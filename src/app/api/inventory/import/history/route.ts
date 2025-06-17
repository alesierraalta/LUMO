import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    // For now, return empty sessions to prevent the error
    // This feature can be implemented later when import functionality is needed
    return NextResponse.json({
      success: true,
      sessions: [],
      message: "Funcionalidad de historial de importaciones no disponible actualmente"
    });
    
  } catch (error) {
    console.error("Error fetching import history:", error);
    return NextResponse.json(
      { message: "Error al obtener el historial de importaciones" },
      { status: 500 }
    );
  }
} 