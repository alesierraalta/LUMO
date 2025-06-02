import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin, hasPermission } from "@/lib/auth";
import { importService } from "@/lib/importService";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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