import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin, hasPermission } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import * as ExcelJS from "exceljs";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { importService } from "@/lib/importService";
import { prisma } from "@/lib/prisma";
import { ensureImportDirectories } from "@/lib/server-utils";

export const runtime = "nodejs";

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // Ensure directories exist for import files
    ensureImportDirectories();
    
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
    
    // Get form data from the request
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;
    const notes = formData.get("notes") as string;
    
    // Validate file
    if (!file) {
      return NextResponse.json(
        { message: "No se ha proporcionado ningún archivo" },
        { status: 400 }
      );
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "El archivo es demasiado grande. El tamaño máximo permitido es 10MB" },
        { status: 400 }
      );
    }
    
    // Check file type
    const fileType = file.type;
    const isExcel = 
      fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || 
      fileType === "application/vnd.ms-excel" ||
      fileType === "text/csv";
    
    if (!isExcel) {
      return NextResponse.json(
        { message: "Formato de archivo no válido. Por favor, utiliza archivos Excel (.xlsx, .xls) o CSV" },
        { status: 400 }
      );
    }
    
    // Create a temporary file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create a unique session ID
    const sessionId = uuidv4();
    
    // Create a temporary directory for this session
    const tempDir = path.join(os.tmpdir(), "inventory-import", sessionId);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Save the file to the temporary directory
    const filePath = path.join(tempDir, file.name);
    fs.writeFileSync(filePath, buffer);
    
    // Read the Excel file to get columns
    const workbook = new ExcelJS.Workbook();
    let columns: string[] = [];
    
    if (file.name.endsWith(".csv")) {
      // Handle CSV file
      await workbook.csv.readFile(filePath);
      const worksheet = workbook.worksheets[0];
      
      // Get columns from the first row
      if (worksheet && worksheet.rowCount > 0) {
        const headerRow = worksheet.getRow(1);
        columns = headerRow.values as string[];
        // Remove undefined or empty values and trim
        columns = columns.filter(Boolean).map(col => typeof col === 'string' ? col.trim() : String(col));
      }
    } else {
      // Handle Excel file
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.worksheets[0];
      
      // Get columns from the first row
      if (worksheet && worksheet.rowCount > 0) {
        const headerRow = worksheet.getRow(1);
        columns = headerRow.values as string[];
        // Remove undefined or empty values and trim
        columns = columns.filter(Boolean).map(col => typeof col === 'string' ? col.trim() : String(col));
      }
    }
    
    // Remove any empty columns or indices
    columns = columns.filter(col => col !== undefined && col !== null && col !== "");
    
    // Create an import session in the database
    try {
      const importSession = await importService.createImportSession({
        id: sessionId,
        fileName: file.name, // For backward compatibility
        filePath: filePath,  // New field
        status: "processing",
        notes: notes || undefined,
        createdById: userId,
        fileSize: file.size,
        metadata: { columns } // Store columns in metadata
      });
      
      return NextResponse.json({
        success: true,
        sessionId,
        columns,
        message: "Archivo subido correctamente y listo para procesar"
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      return NextResponse.json(
        { message: "Error al procesar el archivo: " + (error instanceof Error ? error.message : String(error)) },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { message: "Error al procesar el archivo" },
      { status: 500 }
    );
  }
} 