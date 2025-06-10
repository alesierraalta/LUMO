import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin, hasPermission } from "@/lib/auth";
import { importService } from "@/lib/importService";
import db from "@/lib/db";

export const runtime = "nodejs";

async function ensureImportTablesExist() {
  try {
    // Check if ImportSession table exists
    try {
      await db.$queryRawUnsafe("SELECT 1 FROM \"ImportSession\" LIMIT 1");
      return true; // Table exists
    } catch (error) {
      console.log("ImportSession table does not exist, creating required tables...");
      
      // Create ImportSession table
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ImportSession" (
          id TEXT PRIMARY KEY,
          "fileName" TEXT NOT NULL,
          "filePath" TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'processing',
          notes TEXT,
          "totalItems" INTEGER NOT NULL DEFAULT 0,
          "successItems" INTEGER NOT NULL DEFAULT 0,
          "warningItems" INTEGER NOT NULL DEFAULT 0,
          "errorItems" INTEGER NOT NULL DEFAULT 0,
          "createdById" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "completedAt" TIMESTAMP(3),
          FOREIGN KEY ("createdById") REFERENCES "users"("id")
        )
      `);
      
      // Create ImportSessionDetail table
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ImportSessionDetail" (
          id TEXT PRIMARY KEY,
          "sessionId" TEXT NOT NULL,
          name TEXT NOT NULL,
          sku TEXT NOT NULL,
          status TEXT NOT NULL,
          message TEXT,
          "originalData" TEXT NOT NULL,
          "importedData" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("sessionId") REFERENCES "ImportSession"("id") ON DELETE CASCADE
        )
      `);
      
      // Create indexes
      await db.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "ImportSession_createdById_idx" ON "ImportSession"("createdById");
        CREATE INDEX IF NOT EXISTS "ImportSession_createdAt_idx" ON "ImportSession"("createdAt");
        CREATE INDEX IF NOT EXISTS "ImportSessionDetail_sessionId_idx" ON "ImportSessionDetail"("sessionId");
        CREATE INDEX IF NOT EXISTS "ImportSessionDetail_status_idx" ON "ImportSessionDetail"("status");
      `);
      
      console.log("Created import tables successfully");
      return true;
    }
  } catch (error) {
    console.error("Error ensuring import tables exist:", error);
    return false;
  }
}

export async function GET(request: NextRequest) {
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
    
    // Get import sessions
    const sessions = await importService.listImportSessionsWithCreators();
    
    return NextResponse.json({
      success: true,
      sessions: sessions || []
    });
    
  } catch (error) {
    console.error("Error fetching import history:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al obtener el historial de importaciones" },
      { status: 500 }
    );
  }
} 