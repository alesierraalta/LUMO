import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { importService } from "@/lib/importService";
import * as ExcelJS from "exceljs";
import * as fs from "fs";
import * as path from "path";
import { z } from "zod";
import natural from "natural";

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

// Helper function to detect field type based on content
function detectFieldType(value: any): string {
  if (value === null || value === undefined) {
    return "unknown";
  }
  
  if (typeof value === "number") {
    // If it's a small integer, likely a quantity
    if (Number.isInteger(value) && value >= 0 && value < 1000) {
      return "quantity";
    }
    // If it has decimal places and is positive, likely a price
    if (value > 0 && !Number.isInteger(value)) {
      return "price";
    }
    return "number";
  }
  
  if (typeof value === "string") {
    const lowerValue = value.toLowerCase();
    
    // Check for SKU patterns (alphanumeric with dashes, underscores)
    if (/^[a-zA-Z0-9\-_]{3,20}$/.test(value)) {
      return "sku";
    }
    
    // Check for price patterns
    if (/^\$?\d+(\.\d{1,2})?$/.test(value) || /^(precio|price|cost|costo|valor|value)/.test(lowerValue)) {
      return "price";
    }
    
    // Check for quantity patterns
    if (/^(qty|quantity|cantidad|stock|inventario|inventory|existencia)/.test(lowerValue)) {
      return "quantity";
    }
    
    // Check for category patterns
    if (/^(category|categoría|categoria|tipo|type|clase|class)/.test(lowerValue)) {
      return "category";
    }
    
    // Check for location patterns
    if (/^(location|ubicación|ubicacion|lugar|place|estante|shelf|bodega|warehouse)/.test(lowerValue)) {
      return "location";
    }
    
    // For longer text, likely product name
    if (value.length > 10) {
      return "name";
    }
  }
  
  return "unknown";
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

// Analyze column names to suggest mappings
function analyzeColumnNames(columns: string[]): Array<{ excelField: string; inventoryField: string; confidence: number }> {
  const mappings: Array<{ excelField: string; inventoryField: string; confidence: number }> = [];
  
  // Define field patterns for matching
  const fieldPatterns = {
    name: ["nombre", "name", "producto", "product", "descripcion", "description", "item", "articulo"],
    sku: ["sku", "codigo", "code", "id", "referencia", "reference", "part number", "part", "modelo", "model"],
    price: ["precio", "price", "valor", "value", "venta", "sale", "sales price", "precio venta"],
    cost: ["costo", "cost", "valor compra", "purchase", "precio compra", "purchase price"],
    quantity: ["cantidad", "quantity", "stock", "inventario", "inventory", "existencia", "qty"],
    category: ["categoria", "categoría", "category", "tipo", "type", "clase", "class", "grupo", "group"],
    location: ["ubicacion", "ubicación", "location", "lugar", "place", "estante", "shelf", "bodega", "warehouse"]
  };
  
  // Analyze each column
  for (const column of columns) {
    if (!column) continue;
    
    const columnLower = typeof column === "string" ? column.toLowerCase() : String(column).toLowerCase();
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
    
    mappings.push({
      excelField: column,
      inventoryField: highestConfidence > 0.4 ? bestMatch : "",
      confidence: highestConfidence
    });
  }
  
  return mappings;
}

// Process row data with NLP to extract structured information
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
    confidence: {
      name: 0,
      sku: 0,
      price: 0,
      cost: 0,
      quantity: 0,
      category: 0,
      location: 0
    },
    originalData: {}
  };
  
  // First pass: direct mapping based on column mappings
  for (const mapping of columnMappings) {
    if (mapping.excelField && mapping.inventoryField) {
      const value = row[mapping.excelField];
      if (value !== undefined && value !== null) {
        item[mapping.inventoryField] = value;
        item.confidence[mapping.inventoryField] = 0.9; // High confidence for direct mappings
        item.originalData[mapping.excelField] = value;
      }
    }
  }
  
  // Second pass: analyze unmapped columns for additional information
  const unmappedColumns = columnMappings
    .filter(mapping => !mapping.inventoryField)
    .map(mapping => mapping.excelField);
  
  for (const column of unmappedColumns) {
    const value = row[column];
    if (value === undefined || value === null) continue;
    
    item.originalData[column] = value;
    
    // Try to detect the field type based on content
    const detectedType = detectFieldType(value);
    
    // Only apply if the field isn't already mapped with high confidence
    if (detectedType !== "unknown" && (!item[detectedType] || item.confidence[detectedType] < 0.7)) {
      // Convert string to appropriate type if needed
      let processedValue = value;
      if (detectedType === "price" || detectedType === "cost" || detectedType === "quantity") {
        if (typeof value === "string") {
          // Extract numeric value from string
          const numericMatch = value.match(/[\d\.]+/);
          if (numericMatch) {
            processedValue = parseFloat(numericMatch[0]);
          }
        }
      }
      
      item[detectedType] = processedValue;
      item.confidence[detectedType] = 0.7; // Medium confidence for detected types
    }
  }
  
  // Third pass: look for compound fields that might contain multiple pieces of information
  for (const column in row) {
    const value = row[column];
    if (typeof value !== "string" || value.length < 10) continue;
    
    // Try to extract attributes from longer text fields
    const extractedAttrs = extractProductAttributes(value);
    
    // Apply extracted attributes if they have higher confidence
    for (const [attr, attrValue] of Object.entries(extractedAttrs)) {
      if (!item[attr] || item.confidence[attr] < 0.6) {
        item[attr] = attrValue;
        item.confidence[attr] = 0.6; // Medium-low confidence for extracted attributes
      }
    }
    
    // If no name was found and this is a long text field, use it as name
    if (!item.name && value.length > 10) {
      item.name = value;
      item.confidence.name = 0.5; // Low confidence for fallback names
    }
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
    
    // Analyze column names to suggest mappings
    const mappings = analyzeColumnNames(headers.filter(Boolean));
    
    // Process each row with NLP
    const processedItems = rowData.map((row, index) => {
      const processedItem = processRowWithNLP(row, mappings);
      return {
        rowId: index + 2, // +2 because we skip header and 0-indexed
        ...processedItem
      };
    });
    
    // Filter out rows without minimum data
    const validItems = processedItems.filter(item => 
      item.name || item.sku || item.quantity !== null
    );
    
    // Update import session status
    await importService.updateImportSession(sessionId, {
      totalItems: validItems.length,
      status: "processing"
    });
    
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