import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin, hasPermission } from "@/lib/auth";
import { importService } from "@/lib/importService";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
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