import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin, hasPermission } from "@/lib/auth";
import { importService } from "@/lib/importService";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure import tables exist before proceeding
    await ensureImportTablesExist();
    
    const sessionId = params.id;
    
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
    
    // Get import session details
    const details = await importService.listImportSessionDetails(sessionId);
    
    if (!details) {
      return NextResponse.json(
        { message: "No se encontraron detalles para esta sesión de importación" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      details
    });
    
  } catch (error) {
    console.error("Error fetching import session details:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al obtener los detalles de la importación" },
      { status: 500 }
    );
  }
} 