import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db-supabase";
import fs from "fs";

export const runtime = "nodejs";

/**
 * Excel Importer Health Check Endpoint
 * 
 * This endpoint provides detailed health information about the Excel importer
 * functionality, specifically designed for Choreo monitoring.
 */
export async function GET() {
  try {
    // Simple health check - just verify database connection
    await db.inventoryItem.findMany({ take: 1 });
    
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      message: "Excel importer service is operational",
      database: "connected"
    });

  } catch (error) {
    return NextResponse.json({
      status: "error",
      timestamp: new Date().toISOString(),
      message: "Excel importer service has issues",
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 