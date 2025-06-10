import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin, hasPermission } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import * as ExcelJS from "exceljs";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { importService } from "@/lib/importService";
import db from "@/lib/db";
import { ensureImportDirectories } from "@/lib/server-utils";
import { logger } from "@/lib/logger";
import { errorLogger, ErrorCategory, ErrorSeverity, ErrorContext } from "@/lib/logger/error-logger";
import { dbLogger, trackDbOperation } from "@/lib/db/db-logger";

export const runtime = "nodejs";

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  else return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export async function POST(request: NextRequest) {
  // Generate unique request ID for tracking
  const requestId = uuidv4().slice(0, 8);
  const logContext = { 
    module: 'import',
    component: 'upload',
    requestId
  };
  
  // Error context for consistent error logging
  const errorContext: ErrorContext = {
    requestId,
    module: 'import',
    component: 'upload',
    operation: 'fileUpload',
    method: 'POST',
    path: '/api/inventory/import/upload',
    additionalInfo: {}
  };
  
  // Start timing for performance tracking
  const startTime = performance.now();
  
  logger.info(`[${requestId}] Starting file upload process`, logContext);
  
  try {
    // Ensure directories exist for import files
    logger.debug(`[${requestId}] Ensuring import directories exist`, logContext);
    ensureImportDirectories();
    
    // Check user permissions
    logger.debug(`[${requestId}] Verifying user authentication`, logContext);
    const user = await getCurrentUser();
    
    if (!user) {
      errorLogger.logAuthError("Unauthorized upload attempt", {
        ...errorContext,
        additionalInfo: { error: 'No authenticated user' }
      });
      
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }
    
    logger.info(`[${requestId}] Authenticated user: ${user.id}`, {
      ...logContext,
      userId: user.id
    });
    
    // Update error context with user info
    errorContext.userId = user.id;
    
    // Check inventory permissions
    logger.debug(`[${requestId}] Verifying user permissions`, logContext);
    const hasInventoryAccess = isAdmin(user) || hasPermission(user, 'page', 'inventory');
    
    if (!hasInventoryAccess) {
      errorLogger.logAuthError("Insufficient permissions for import", {
        ...errorContext,
        additionalInfo: { 
          hasInventoryAccess,
          isAdmin: isAdmin(user)
        }
      });
      
      return NextResponse.json(
        { message: "No tienes permiso para acceder a esta funcionalidad" },
        { status: 403 }
      );
    }
    
    // Get form data from the request
    logger.debug(`[${requestId}] Extracting form data from request`, logContext);
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;
    const notes = formData.get("notes") as string;
    
    // Log file details
    if (file) {
      logger.info(
        `[${requestId}] File received: ${file.name} (${formatFileSize(file.size)}, type: ${file.type})`, 
        logContext,
        {
          fileInfo: {
            name: file.name,
            size: file.size,
            type: file.type
          }
        }
      );
      
      // Update error context with file info
      errorContext.additionalInfo = {
        ...errorContext.additionalInfo,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      };
    }
    
    // Validate file
    if (!file) {
      const errorId = errorLogger.logValidationError("No file provided for import", errorContext);
      
      return NextResponse.json(
        { message: "No se ha proporcionado ningún archivo", errorId },
        { status: 400 }
      );
    }
    
    if (file.size > MAX_FILE_SIZE) {
      const errorId = errorLogger.logValidationError(
        `File size (${formatFileSize(file.size)}) exceeds maximum allowed (${formatFileSize(MAX_FILE_SIZE)})`,
        errorContext
      );
      
      return NextResponse.json(
        { message: "El archivo es demasiado grande. El tamaño máximo permitido es 10MB", errorId },
        { status: 400 }
      );
    }
    
    // Check file type
    const fileType = file.type;
    const isExcel = 
      fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || 
      fileType === "application/vnd.ms-excel" ||
      fileType === "text/csv";
    
    logger.debug(
      `[${requestId}] Checking file type: ${fileType}, isValidFormat: ${isExcel}`, 
      logContext,
      { fileType }
    );
    
    if (!isExcel) {
      const errorId = errorLogger.logValidationError(
        `Invalid file type: ${fileType}`,
        { ...errorContext, additionalInfo: { ...errorContext.additionalInfo, fileType } }
      );
      
      return NextResponse.json(
        { message: "Formato de archivo no válido. Por favor, utiliza archivos Excel (.xlsx, .xls) o CSV", errorId },
        { status: 400 }
      );
    }
    
    // Create a temporary file
    logger.debug(`[${requestId}] Converting file to buffer`, logContext);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create a unique session ID
    const sessionId = uuidv4();
    logger.info(
      `[${requestId}] Created import session ID: ${sessionId}`, 
      logContext,
      { sessionId }
    );
    
    // Update error context with session ID
    errorContext.sessionId = sessionId;
    
    // Create a temporary directory for this session
    const tempDir = path.join(os.tmpdir(), "inventory-import", sessionId);
    logger.debug(
      `[${requestId}] Creating temporary directory: ${tempDir}`, 
      logContext,
      { tempDir }
    );
    
    try {
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
    } catch (fsError) {
      const errorId = errorLogger.logError(
        fsError as Error, 
        ErrorSeverity.HIGH, 
        ErrorCategory.FILE_SYSTEM,
        { 
          ...errorContext,
          additionalInfo: { 
            ...errorContext.additionalInfo,
            tempDir 
          } 
        }
      );
      
      return NextResponse.json(
        { message: "Error al crear directorio temporal", errorId },
        { status: 500 }
      );
    }
    
    // Save the file to the temporary directory
    const filePath = path.join(tempDir, file.name);
    logger.debug(
      `[${requestId}] Saving file to: ${filePath}`, 
      logContext,
      { filePath }
    );
    
    try {
      fs.writeFileSync(filePath, buffer);
      logger.info(
        `[${requestId}] File saved successfully (${buffer.length} bytes)`, 
        logContext,
        { fileSize: buffer.length }
      );
    } catch (fsError) {
      const errorId = errorLogger.logError(
        fsError as Error, 
        ErrorSeverity.HIGH, 
        ErrorCategory.FILE_SYSTEM,
        { 
          ...errorContext, 
          additionalInfo: { 
            ...errorContext.additionalInfo,
            filePath 
          } 
        }
      );
      
      return NextResponse.json(
        { message: "Error al guardar el archivo", errorId },
        { status: 500 }
      );
    }
    
    // Read the Excel file to get columns
    logger.debug(`[${requestId}] Opening file to read column headers`, logContext);
    let columns: string[] = [];
    
    try {
      const workbook = new ExcelJS.Workbook();
      
      if (file.name.endsWith(".csv")) {
        // Handle CSV file
        logger.debug(`[${requestId}] Processing as CSV file`, logContext);
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
        logger.debug(`[${requestId}] Processing as Excel file`, logContext);
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
      logger.info(
        `[${requestId}] Extracted ${columns.length} columns from file`, 
        logContext,
        {
          columnCount: columns.length,
          columns
        }
      );
    } catch (parseError) {
      const errorId = errorLogger.logError(
        parseError as Error, 
        ErrorSeverity.MEDIUM, 
        ErrorCategory.PARSING,
        errorContext
      );
      
      return NextResponse.json(
        { message: "Error al leer el archivo. Comprueba el formato.", errorId },
        { status: 400 }
      );
    }
    
    // Create an import session in the database
    try {
      logger.debug(
        `[${requestId}] Creating import session in database`, 
        logContext,
        {
          sessionId,
          fileName: file.name,
          filePath
        }
      );
      
      // Use the database logger for this operation
      const dbOperationId = dbLogger.startOperation('create', 'ImportSession');
      
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
        
        // Calculate processing time
        const endTime = performance.now();
        const processingTime = Math.round(endTime - startTime);
        
        // Log successful database operation
        dbLogger.endOperation(dbOperationId, {
          success: true,
          recordCount: 1,
          rowsAffected: 1
        });
        
        logger.info(
          `[${requestId}] Import session created successfully (${processingTime}ms)`, 
          logContext,
          {
            sessionId,
            processingTime,
            status: "success"
          }
        );
        
        return NextResponse.json({
          success: true,
          sessionId,
          columns,
          message: "Archivo subido correctamente y listo para procesar"
        });
      } catch (dbError) {
        // Log failed database operation
        dbLogger.endOperation(dbOperationId, {
          success: false,
          error: dbError as Error
        });
        
        throw dbError; // Re-throw to be caught by outer catch block
      }
    } catch (error) {
      const errorId = errorLogger.logDatabaseError(
        error as Error, 
        {
          ...errorContext,
          operation: 'createImportSession'
        }
      );
      
      return NextResponse.json(
        { 
          message: "Error al procesar el archivo: " + (error instanceof Error ? error.message : String(error)),
          errorId 
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    const errorId = errorLogger.logCriticalError(
      error as Error,
      errorContext
    );
    
    return NextResponse.json(
      { 
        message: "Error al procesar el archivo",
        errorId
      },
      { status: 500 }
    );
  }
} 