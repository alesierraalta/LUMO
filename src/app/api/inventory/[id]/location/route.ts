import { NextRequest, NextResponse } from "next/server";
import { updateItemLocation } from "@/services/inventoryService";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    if (!id) {
      return NextResponse.json(
        { error: "ID de inventario no proporcionado" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { location } = body;

    // location puede ser una cadena vacía para eliminar la ubicación
    if (location === undefined) {
      return NextResponse.json(
        { error: "La ubicación es requerida" },
        { status: 400 }
      );
    }

    const result = await updateItemLocation(id, location);
    
    const message = location.trim() === "" 
      ? "Ubicación eliminada correctamente" 
      : `Ubicación actualizada a "${location}"`;

    return NextResponse.json({
      success: true,
      message,
      data: result
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error al actualizar ubicación:", error);
    
    // Clasificar tipo de error para determinar status code
    let statusCode = 500;
    if (error.message?.includes("no encontrado")) {
      statusCode = 404;
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Error al actualizar la ubicación" 
      },
      { status: statusCode }
    );
  }
} 