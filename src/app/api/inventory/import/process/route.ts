import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { importService } from "@/lib/importService";
import * as ExcelJS from "exceljs";
import * as fs from "fs";
import * as path from "path";
import { z } from "zod";
import natural from "natural";
import os from 'os';

export const runtime = "nodejs";

// Initialize NLP tools
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;
const tfidf = new natural.TfIdf();

// Schema for request validation
const processRequestSchema = z.object({
  sessionId: z.string().uuid(),
  userId: z.string(),
});

// Store recent successful mappings to improve future detection
let recentMappings: Array<{
  timestamp: number;
  mappings: Array<{ excelField: string; inventoryField: string; confidence: number }>;
}> = [];

// Max number of recent mappings to keep
const MAX_RECENT_MAPPINGS = 10;
// TTL for recent mappings in milliseconds (1 week)
const MAPPINGS_TTL = 7 * 24 * 60 * 60 * 1000;

// Expanded list of field patterns for matching with many more synonyms
const fieldPatterns = {
  name: [
    "nombre", "name", "producto", "product", "item", "articulo", "artículo", 
    "mercancía", "mercancia", "merchandise", "denominación", "denominacion", 
    "título", "titulo", "title", "elemento", "object", "objeto", "bien", "good",
    "referencia", "reference", "denominado", "mercadería", "merchandise", "prod"
  ],
  sku: [
    "sku", "codigo", "código", "code", "id", "referencia", "reference", "part number", 
    "part", "modelo", "model", "clave", "key", "identificador", "identifier", 
    "serial", "número de serie", "numero de serie", "serial number", "cód", "cod",
    "ref", "no.", "no", "num", "número", "numero", "SKU", "CÓDIGO", "CODIGO", "CODE", 
    "UPC", "EAN", "ISBN", "asin", "GTIN", "MPN", "clave", "CLAVE", "codificación",
    "codificacion", "product code", "product id", "item number", "ref."
  ],
  price: [
    "precio", "price", "valor", "value", "venta", "sale", "sales price", "precio venta",
    "p. venta", "p.venta", "p venta", "pvp", "PVP", "precio de venta", "mrp", "MRP",
    "precio publico", "precio público", "retail price", "precio al por menor", "public price",
    "precio cliente", "customer price", "precio comercial", "commercial price", "precio mercado",
    "market price", "precio unitario", "unit price", "precio ud", "precio unit", "p.u.", "p.u"
  ],
  cost: [
    "costo", "cost", "valor compra", "purchase", "precio compra", "purchase price",
    "coste", "cost price", "precio costo", "valor adquisición", "valor adquisicion",
    "acquisition value", "precio proveedor", "supplier price", "buy price", "c.u.", "c.u",
    "costo unitario", "unit cost", "costo ud", "costo unit", "valor neto", "net value",
    "compra", "precio de compra", "p. compra", "p.compra", "p compra", "PC"
  ],
  quantity: [
    "cantidad", "quantity", "stock", "inventario", "inventory", "existencia", "qty",
    "unidades", "units", "uds", "piezas", "pieces", "pcs", "pzas", "cant", "cant.",
    "conteo", "count", "existencias", "on hand", "disponible", "available", "en stock",
    "in stock", "stock actual", "current stock", "cantidad actual", "current quantity",
    "num piezas", "cantidad ud", "cantidad unit", "qty on hand", "STOCK", "CANTIDAD"
  ],
  category: [
    "categoria", "categoría", "category", "tipo", "type", "clase", "class", "grupo", "group",
    "familia", "family", "clasificación", "clasificacion", "classification", "departamento",
    "department", "sector", "area", "área", "division", "división", "cat", "cat.", "línea",
    "linea", "line", "rubro", "heading", "segmento", "segment", "CATEGORIA", "CATEGORÍA"
  ],
  location: [
    "ubicacion", "ubicación", "location", "lugar", "place", "estante", "shelf", "bodega", 
    "warehouse", "almacén", "almacen", "storage", "depósito", "deposito", "deposit", "pasillo",
    "aisle", "rack", "zona", "zone", "seccion", "sección", "section", "posicion", "posición",
    "position", "localización", "localizacion", "bin", "UBICACIÓN", "UBICACION"
  ],
  description: [
    "descripcion", "descripción", "description", "detalle", "detail", "detalles", "details", 
    "características", "caracteristicas", "features", "notas", "notes", "especificaciones",
    "specifications", "specs", "ficha", "ficha técnica", "ficha tecnica", "data sheet",
    "información", "informacion", "information", "desc", "desc.", "observaciones", "comments",
    "comentarios", "remarks", "DESCRIPCIÓN", "DESCRIPCION"
  ]
};

// Special exact matches to prioritize
const exactMatches: Record<string, string> = {
  "CATEGORIA": "category",
  "CATEGORÍA": "category",
  "CÓDIGO": "sku",
  "CODIGO": "sku",
  "DESCRIPCIÓN": "description",
  "DESCRIPCION": "description",
  "STOCK": "quantity",
  "CANTIDAD": "quantity",
  "PRECIO": "price",
  "VALOR": "price",
  "COSTO": "cost",
  "UBICACION": "location",
  "UBICACIÓN": "location",
  "PRODUCTO": "name",
  "NOMBRE": "name",
  "ARTÍCULO": "name",
  "ARTICULO": "name",
  "SKU": "sku",
  "CODE": "sku",
  "ID": "sku",
  "QTY": "quantity",
  "FAMILY": "category",
  "DEPARTMENT": "category",
  "INVENTARIO": "quantity",
  "EXISTENCIA": "quantity",
  "EXISTENCIAS": "quantity",
  "LÍNEA": "category",
  "LINEA": "category",
  "PVP": "price",
  "PRECIO DE VENTA": "price",
  "PRECIO VENTA": "price",
  "COSTO UNITARIO": "cost",
  "PRECIO UNITARIO": "price"
};

// Enhanced field type detection function
function detectFieldType(value: any, columnName: string = ''): string {
  if (value === null || value === undefined) {
    return "unknown";
  }
  
  // Check column name first (highest priority)
  const columnNameUpper = columnName.toUpperCase();
  if (exactMatches[columnNameUpper]) {
    return exactMatches[columnNameUpper];
  }
  
  // Regex patterns for common field types
  const patterns = {
    sku: [
      /^[A-Z0-9]{3,16}$/,                            // Common SKU format (e.g., ABC123)
      /^[A-Z]{2,3}-[0-9]{3,6}$/,                     // Dash format (e.g., AB-12345)
      /^\d{8,13}$/,                                  // UPC/EAN type (e.g., 123456789012)
      /^[A-Z0-9]{3,6}\.[A-Z0-9]{2,4}$/,              // Dot format (e.g., ABC.123)
      /^[0-9]{3,6}(-[A-Z0-9]{1,5})?$/                // Number with optional suffix (e.g., 12345-A)
    ],
    name: [
      /^[A-Za-z].{10,}$/,                            // Starts with letter, at least 10 chars
      /^[A-Za-z][\w\s\-\']{5,}[A-Za-z]$/             // Typical product name format
    ],
    price: [
      /^\$?\d+(\.\d{1,2})?$/,                        // Basic price format ($10.99 or 10.99)
      /^\d{1,6}(\.\d{1,2})?\s?(?:MXN|USD|EUR)?$/,    // With optional currency
      /^\d{1,6},\d{1,2}\s?(?:€|\$)?$/                // European format with comma
    ],
    quantity: [
      /^\d{1,5}$/,                                   // Simple integer
      /^\d{1,5}\s?(?:pcs|uds|units|piezas)$/,        // With unit
      /^\d{1,5}\s?(?:u|pz|pc)$/                      // Short unit
    ],
    category: [
      /^[A-Za-z]+\s*[A-Za-z]*$/,                     // Simple word or two (typically categories)
      /^[A-Za-z]+\/[A-Za-z]+$/                       // Parent/child format
    ]
  };
  
  // Helper to check against patterns
  const matchesAnyPattern = (patterns: RegExp[]): boolean => {
    if (typeof value !== 'string') return false;
    return patterns.some(pattern => pattern.test(value));
  };
  
  // Type detection based on value format
  if (typeof value === "number") {
    // If it's a small integer, likely a quantity
    if (Number.isInteger(value) && value >= 0 && value < 10000) {
      return "quantity";
    }
    // If it has decimal places and is positive, likely a price
    if (value > 0 && !Number.isInteger(value)) {
      // Small decimals (below 100) more likely to be price
      if (value < 100) return "price";
      // Large decimals (above 1000) more likely to be cost for bulk
      if (value > 1000) return "cost";
      return "price";
    }
    return "number";
  }
  
  if (typeof value === "string") {
    const valueStr = value.trim();
    
    // First try matching against specific patterns
    if (matchesAnyPattern(patterns.sku)) return "sku";
    if (matchesAnyPattern(patterns.price)) return "price";
    if (matchesAnyPattern(patterns.quantity)) return "quantity";
    if (matchesAnyPattern(patterns.category)) return "category";
    
    // If no pattern match, use text-based heuristics
    const lowerValue = valueStr.toLowerCase();
    
    // Check for SKU-like patterns
    if (/^[a-zA-Z0-9\-_\.]{3,16}$/.test(valueStr)) {
      return "sku";
    }
    
    // Check for currency symbols strongly indicating price
    if (/[\$\€\£\¥]/.test(valueStr.slice(0, 1))) {
      return "price";
    }
    
    // Check if it's a number with units (likely quantity)
    if (/^\d+\s*(?:u|uds|pcs|piezas|units|pc|pz|kg|g|oz|lb)$/i.test(valueStr)) {
      return "quantity";
    }
    
    // If the string is short with specific formats
    if (valueStr.length < 5) {
      // Short strings are more likely to be categories or locations
      // (like "A1", "Dep1", etc.)
      return "category";
    }
    
    // Long text is most likely description or name
    if (valueStr.length > 50) {
      return "description";
    }
    
    // Medium length text with good sentence structure likely name
    if (valueStr.length > 10 && /^[A-Z][a-z]/.test(valueStr)) {
      return "name";
    }
  }
  
  return "unknown";
}

// Advanced function for column analysis based on content samples
function analyzeColumnContents(rows: any[], column: string): { type: string, confidence: number } {
  if (!rows.length || !column) {
    return { type: "unknown", confidence: 0 };
  }
  
  // Take a sample of up to 20 values for analysis
  const sampleSize = Math.min(rows.length, 20);
  const sample = [];
  const sampleStep = Math.max(1, Math.floor(rows.length / sampleSize));
  
  for (let i = 0; i < rows.length; i += sampleStep) {
    if (sample.length >= sampleSize) break;
    const value = rows[i][column];
    if (value !== undefined && value !== null && value !== '') {
      sample.push(value);
    }
  }
  
  if (sample.length === 0) {
    return { type: "unknown", confidence: 0 };
  }
  
  // Count occurrences of each detected type
  const typeCounts: Record<string, number> = {};
  const totalValues = sample.length;
  
  sample.forEach(value => {
    const detectedType = detectFieldType(value, column);
    typeCounts[detectedType] = (typeCounts[detectedType] || 0) + 1;
  });
  
  // Find the most common type
  let mostCommonType = "unknown";
  let maxCount = 0;
  
  for (const [type, count] of Object.entries(typeCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonType = type;
    }
  }
  
  // Calculate confidence based on consistency
  const confidence = maxCount / totalValues;
  
  return {
    type: mostCommonType,
    confidence: confidence
  };
}

// Enhanced column names analysis function with content-based checks
function analyzeColumnNames(columns: string[], rows: any[] = []): Array<{ excelField: string; inventoryField: string; confidence: number }> {
  const mappings: Array<{ excelField: string; inventoryField: string; confidence: number }> = [];
  
  // Analyze each column
  for (const column of columns) {
    if (!column) continue;
    
    const columnStr = String(column);
    const columnUpper = columnStr.toUpperCase();
    const columnLower = columnStr.toLowerCase();
    
    // Check for exact matches first (highest priority)
    if (exactMatches[columnUpper]) {
      mappings.push({
        excelField: columnStr,
        inventoryField: exactMatches[columnUpper],
        confidence: 1.0 // Maximum confidence for exact matches
      });
      continue;
    }
    
    let bestMatch = "";
    let highestConfidence = 0;
    
    // Check against each field pattern
    for (const [field, patterns] of Object.entries(fieldPatterns)) {
      for (const pattern of patterns) {
        // Calculate confidence based on similarity
        let confidence = 0;
        
        // Exact match
        if (columnLower === pattern) {
          confidence = 1.0;
        } 
        // Contains pattern
        else if (columnLower.includes(pattern)) {
          confidence = 0.8;
        }
        // Pattern contains column
        else if (pattern.includes(columnLower)) {
          confidence = 0.7;
        }
        // Partial match
        else {
          const similarity = natural.JaroWinklerDistance(columnLower, pattern);
          if (similarity > 0.7) {
            confidence = similarity * 0.6;
          }
        }
        
        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          bestMatch = field;
        }
      }
    }
    
    // If we have rows data, analyze column contents for additional confidence
    if (rows.length > 0 && highestConfidence < 0.9) {
      const contentAnalysis = analyzeColumnContents(rows, columnStr);
      
      // If content analysis is confident and different from name analysis
      if (contentAnalysis.confidence > 0.7 && contentAnalysis.type !== bestMatch) {
        // If name analysis wasn't very confident, use content analysis
        if (highestConfidence < 0.5) {
          bestMatch = contentAnalysis.type;
          highestConfidence = contentAnalysis.confidence;
        } 
        // If both have good confidence, blend them with preference to name
        else {
          // Keep the name-based match but boost confidence if content agrees
          highestConfidence = (highestConfidence * 0.7) + (contentAnalysis.confidence * 0.3);
        }
      }
    }
    
    mappings.push({
      excelField: columnStr,
      inventoryField: highestConfidence > 0.4 ? bestMatch : "",
      confidence: highestConfidence
    });
  }
  
  return mappings;
}

// Process row data with NLP and pattern recognition to extract structured information
function processRowWithNLP(row: any, columnMappings: Array<{ excelField: string; inventoryField: string }>) {
  // Default item with all fields initialized
  const item: any = {
    name: "",
    sku: "",
    price: null,
    cost: null,
    quantity: null,
    category: null,
    location: null,
    description: null,
    confidence: {
      name: 0,
      sku: 0,
      price: 0,
      cost: 0,
      quantity: 0,
      category: 0,
      location: 0,
      description: 0
    },
    originalData: {}
  };
  
  // First pass: direct mapping based on column mappings
  for (const mapping of columnMappings) {
    if (mapping.excelField && mapping.inventoryField) {
      const value = row[mapping.excelField];
      if (value !== undefined && value !== null) {
        // Process the value based on the field type
        let processedValue = value;
        
        // Type conversion based on field type
        switch (mapping.inventoryField) {
          case 'price':
          case 'cost':
            // Convert string prices to numbers, handling currency symbols
            if (typeof value === 'string') {
              const numericMatch = value.replace(/[\$\€\£\¥\,]/g, '').match(/[\d\.]+/);
              if (numericMatch) {
                processedValue = parseFloat(numericMatch[0]);
              }
            }
            break;
            
          case 'quantity':
            // Convert string quantities to numbers, handling units
            if (typeof value === 'string') {
              const numericMatch = value.replace(/[^\d\.]/g, '').match(/[\d\.]+/);
              if (numericMatch) {
                processedValue = parseInt(numericMatch[0], 10);
              }
            }
            break;
            
          case 'sku':
            // Normalize SKUs (trim spaces, uppercase)
            if (typeof value === 'string') {
              processedValue = value.trim().toUpperCase();
            }
            break;
        }
        
        item[mapping.inventoryField] = processedValue;
        item.confidence[mapping.inventoryField] = 0.9; // High confidence for direct mappings
        item.originalData[mapping.excelField] = value;
      }
    }
  }
  
  // Save all original data regardless of mapping
  for (const column in row) {
    if (row[column] !== undefined && row[column] !== null) {
      item.originalData[column] = row[column];
    }
  }
  
  // Second pass: analyze unmapped columns for additional information
  // Only if explicit mappings were not found for essential fields
  const hasExplicitMapping = (field: string) => 
    columnMappings.some(mapping => mapping.inventoryField === field && mapping.excelField && row[mapping.excelField] !== undefined);
  
  const unmappedColumns = columnMappings
    .filter(mapping => !mapping.inventoryField)
    .map(mapping => mapping.excelField);
  
  for (const column of unmappedColumns) {
    const value = row[column];
    if (value === undefined || value === null) continue;
    
    // Try to detect the field type based on content
    const detectedType = detectFieldType(value, column);
    
    // Only apply if:
    // 1. The field isn't already mapped with high confidence
    // 2. There's no explicit mapping for this field from column mappings
    if (detectedType !== "unknown" && 
        (!item[detectedType] || item.confidence[detectedType] < 0.7) && 
        !hasExplicitMapping(detectedType)) {
      
      // For price and cost, be more conservative with auto-detection
      if ((detectedType === "price" || detectedType === "cost") && 
          typeof value !== "number" && 
          !(/^\$?\d+(\.\d{1,2})?$/.test(String(value)))) {
        // Skip assigning if not a clear price format
        continue;
      }
      
      // Convert string to appropriate type if needed
      let processedValue = value;
      if (detectedType === "price" || detectedType === "cost") {
        if (typeof value === "string") {
          // Extract numeric value from string, handling currency symbols
          const numericMatch = value.replace(/[\$\€\£\¥\,]/g, '').match(/[\d\.]+/);
          if (numericMatch) {
            processedValue = parseFloat(numericMatch[0]);
          }
        }
      } else if (detectedType === "quantity") {
        if (typeof value === "string") {
          // Extract numeric value from string, handling unit indicators
          const numericMatch = value.replace(/[^\d\.]/g, '').match(/[\d\.]+/);
          if (numericMatch) {
            processedValue = parseInt(numericMatch[0], 10);
          }
        }
      } else if (detectedType === "sku" && typeof value === "string") {
        // Normalize SKUs
        processedValue = value.trim().toUpperCase();
      }
      
      item[detectedType] = processedValue;
      item.confidence[detectedType] = 0.7; // Medium confidence for detected types
    }
  }
  
  // Third pass: look for compound fields that might contain multiple pieces of information
  // But only if they weren't already mapped explicitly
  for (const column in row) {
    const value = row[column];
    if (typeof value !== "string" || value.length < 10) continue;
    
    // Only apply if:
    // 1. There's no explicit mapping for these fields from column mappings
    // 2. The field isn't already set with high confidence
    if (!hasExplicitMapping("price") && !hasExplicitMapping("quantity")) {
      // Try to extract attributes from longer text fields
      const extractedAttrs = extractProductAttributes(value);
      
      // Apply extracted attributes if they have higher confidence
      for (const [attr, attrValue] of Object.entries(extractedAttrs)) {
        if (!item[attr] || item.confidence[attr] < 0.6) {
          item[attr] = attrValue;
          item.confidence[attr] = 0.6; // Medium-low confidence for extracted attributes
        }
      }
    }
    
    // If no name was found and this is a long text field, use it as name
    if (!item.name && value.length > 10 && !hasExplicitMapping("name")) {
      item.name = value;
      item.confidence.name = 0.5; // Low confidence for fallback names
    }
  }
  
  // Special case: If "CÓDIGO" or similar is mapped to "sku"
  // Make sure SKU is set correctly and with high confidence
  const skuMapping = columnMappings.find(mapping => 
    mapping.inventoryField === "sku" && 
    ["CÓDIGO", "CODIGO", "CODE", "SKU"].includes(mapping.excelField.toUpperCase())
  );
  
  if (skuMapping && row[skuMapping.excelField]) {
    item.sku = row[skuMapping.excelField];
    item.confidence.sku = 1.0; // Maximum confidence
  }
  
  // Generate a fallback SKU if none was found
  if (!item.sku) {
    // Create a simple hash from the name if it exists
    if (item.name) {
      const nameHash = item.name
        .replace(/[^a-zA-Z0-9]/g, "")
        .substring(0, 8)
        .toUpperCase();
      item.sku = `GEN-${nameHash}`;
      item.confidence.sku = 0.3; // Low confidence for generated SKUs
    }
  }
  
  return item;
}

// Helper function to extract product attributes from unstructured text
function extractProductAttributes(text: string): Record<string, any> {
  if (!text || typeof text !== "string") {
    return {};
  }
  
  const attributes: Record<string, any> = {};
  const lowerText = text.toLowerCase();
  
  // Extract price pattern ($XX.XX or XX.XX)
  const priceMatch = lowerText.match(/\$?(\d+(\.\d{1,2})?)/);
  if (priceMatch) {
    attributes.price = parseFloat(priceMatch[1]);
  }
  
  // Extract quantity pattern (digits followed by units or standalone)
  const qtyMatch = lowerText.match(/(\d+)\s*(pcs|unidades|units|piezas|uds|u|pz)/);
  if (qtyMatch) {
    attributes.quantity = parseInt(qtyMatch[1], 10);
  }
  
  // Look for category indicators
  const categoryIndicators = ["categoría", "categoria", "category", "tipo", "type"];
  for (const indicator of categoryIndicators) {
    const categoryMatch = lowerText.match(new RegExp(`${indicator}[:\\s]+(\\w+)`, "i"));
    if (categoryMatch) {
      attributes.category = categoryMatch[1].trim();
      break;
    }
  }
  
  return attributes;
}

// Helper function to save a successful mapping
function saveSuccessfulMapping(mappings: Array<{ excelField: string; inventoryField: string; confidence: number }>) {
  // Remove old mappings
  const now = Date.now();
  recentMappings = recentMappings.filter(m => now - m.timestamp < MAPPINGS_TTL);
  
  // Add new mapping
  recentMappings.push({
    timestamp: now,
    mappings: mappings,
  });
  
  // Limit the number of stored mappings
  if (recentMappings.length > MAX_RECENT_MAPPINGS) {
    recentMappings.shift(); // Remove oldest
  }
}

// Helper function to find similar previous mappings
function findSimilarMapping(columns: string[]): Array<{ excelField: string; inventoryField: string; confidence: number }> | null {
  if (recentMappings.length === 0 || !columns.length) {
    return null;
  }
  
  // Sort columns to normalize
  const sortedColumns = [...columns].sort();
  
  // Find best matching recent mapping
  let bestMatch: typeof recentMappings[0] | null = null;
  let bestScore = 0;
  
  for (const mapping of recentMappings) {
    const mappedColumns = mapping.mappings.map(m => m.excelField).sort();
    
    // Calculate similarity score based on column overlap
    const overlap = mappedColumns.filter(col => sortedColumns.includes(col));
    const overlapScore = overlap.length / Math.max(sortedColumns.length, mappedColumns.length);
    
    if (overlapScore > bestScore && overlapScore > 0.6) { // At least 60% match
      bestScore = overlapScore;
      bestMatch = mapping;
    }
  }
  
  if (bestMatch && bestScore > 0.6) {
    // Transform the best match to match current columns
    const result: Array<{ excelField: string; inventoryField: string; confidence: number }> = [];
    
    for (const column of columns) {
      // Find if this column was in the best match
      const matchedMapping = bestMatch.mappings.find(m => m.excelField === column);
      
      if (matchedMapping) {
        // Apply the previous mapping with slightly reduced confidence
        result.push({
          excelField: column,
          inventoryField: matchedMapping.inventoryField,
          confidence: matchedMapping.confidence * 0.9 // Slightly reduce confidence for historical mappings
        });
      } else {
        // No match found
        result.push({
          excelField: column,
          inventoryField: "",
          confidence: 0
        });
      }
    }
    
    return result;
  }
  
  return null;
}

// Enhance the POST function to use row data for better column mapping
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { sessionId, userId } = processRequestSchema.parse(body);
    
    // Check user permissions
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }
    
    // Check inventory permissions
    const hasInventoryAccess = isAdmin(user) || hasPermission(user, 'page', 'inventory');
    
    if (!hasInventoryAccess) {
      return NextResponse.json(
        { message: "No tienes permiso para acceder a esta funcionalidad" },
        { status: 403 }
      );
    }
    
    // Get import session from the database
    const importSession = await importService.findImportSession(sessionId);
    
    if (!importSession) {
      return NextResponse.json(
        { message: "Sesión de importación no encontrada" },
        { status: 404 }
      );
    }
    
    // Read the Excel file
    const filePath = importSession.filePath;
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { message: "Archivo no encontrado" },
        { status: 404 }
      );
    }
    
    // Read the Excel file
    const workbook = new ExcelJS.Workbook();
    let rowData: Array<Record<string, any>> = [];
    
    if (filePath.endsWith(".csv")) {
      // Handle CSV file
      await workbook.csv.readFile(filePath);
    } else {
      // Handle Excel file
      await workbook.xlsx.readFile(filePath);
    }
    
    // Get the first worksheet
    const worksheet = workbook.worksheets[0];
    
    if (!worksheet) {
      return NextResponse.json(
        { message: "No se encontró ninguna hoja en el archivo" },
        { status: 400 }
      );
    }
    
    // Get headers and rows
    const headers: string[] = [];
    
    // Get headers from the first row
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      if (cell.value) {
        headers[colNumber] = cell.value.toString().trim();
      }
    });
    
    // Process all rows
    worksheet.eachRow((row, rowNumber) => {
      // Skip the header row
      if (rowNumber === 1) return;
      
      const rowObj: Record<string, any> = {};
      
      // Process each cell in the row
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber];
        if (header) {
          rowObj[header] = cell.value;
        }
      });
      
      rowData.push(rowObj);
    });
    
    // First try to find similar previous mappings
    let mappings = findSimilarMapping(headers.filter(Boolean));
    
    // If no good previous mapping found, analyze column names
    if (!mappings) {
      // Pass sample data to improve mapping accuracy
      mappings = analyzeColumnNames(headers.filter(Boolean), rowData.slice(0, 50));
    }
    
    // Process each row with enhanced NLP
    const processedItems = rowData.map((row, index) => {
      const processedItem = processRowWithNLP(row, mappings!);
      return {
        rowId: index + 2, // +2 because we skip header and 0-indexed
        ...processedItem
      };
    });
    
    // Filter out rows without minimum data
    const validItems = processedItems.filter(item => 
      item.sku || (item.name && item.quantity !== null)
    );
    
    // Update import session status
    await importService.updateImportSession(sessionId, {
      totalItems: validItems.length,
      status: "processing"
    });
    
    // Save this mapping for future reference if it's valid
    if (mappings && mappings.some(m => m.confidence > 0.7)) {
      saveSuccessfulMapping(mappings);
    }
    
    return NextResponse.json({
      success: true,
      mappings,
      preview: validItems,
      message: "Archivo procesado correctamente"
    });
    
  } catch (error) {
    console.error("Error processing file:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al procesar el archivo" },
      { status: 500 }
    );
  }
} 