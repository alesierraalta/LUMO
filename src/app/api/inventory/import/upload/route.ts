import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin, hasPermission } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import * as ExcelJS from "exceljs";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { importService } from "@/lib/importService";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

async function ensureImportTablesExist() {
  try {
    // Check if ImportSession table exists
    try {
      await prisma.prisma.$queryRawUnsafe("SELECT 1 FROM \"ImportSession\" LIMIT 1");
      return true; // Table exists
    } catch (error) {
      console.log("ImportSession table does not exist, creating required tables...");
      
      // Create ImportSession table
      await prisma.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ImportSession" (
          id TEXT PRIMARY KEY,
          filename TEXT NOT NULL,
          status TEXT NOT NULL,
          totalRows INTEGER NOT NULL DEFAULT 0,
          processedRows INTEGER NOT NULL DEFAULT 0,
          createdRows INTEGER NOT NULL DEFAULT 0,
          updatedRows INTEGER NOT NULL DEFAULT 0,
          errorRows INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "userId" TEXT,
          error TEXT
        )
      `);
      
      // Create ImportSessionItem table
      await prisma.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ImportSessionItem" (
          id TEXT PRIMARY KEY,
          "sessionId" TEXT NOT NULL,
          "rowNumber" INTEGER NOT NULL,
          status TEXT NOT NULL,
          data JSONB NOT NULL,
          error TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          
          CONSTRAINT "ImportSessionItem_sessionId_fkey" 
          FOREIGN KEY ("sessionId") 
          REFERENCES "ImportSession"(id) 
          ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);
      
      console.log("Created import tables successfully");
      return true;
    }
  } catch (error) {
    console.error("Error ensuring import tables exist:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Ensure import tables exist before proceeding
    await ensureImportTablesExist();
    
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
    const importSession = await importService.createImportSession({
      id: sessionId,
      fileName: file.name,
      filePath,
      status: "processing",
      notes: notes || undefined,
      createdById: userId,
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
      { message: "Error al procesar el archivo" },
      { status: 500 }
    );
  }
} 