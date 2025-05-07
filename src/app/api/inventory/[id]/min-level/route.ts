import { NextRequest, NextResponse } from "next/server";
import { updateMinStockLevel } from "@/services/inventoryService";

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
    const { minLevel } = body;

    if (minLevel === undefined || minLevel < 0) {
      return NextResponse.json(
        { error: "El nivel mínimo de stock no puede ser negativo" },
        { status: 400 }
      );
    }

    const result = await updateMinStockLevel(id, Number(minLevel));

    return NextResponse.json({
      success: true,
      message: `Nivel mínimo actualizado a ${minLevel} unidades`,
      data: result
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error al actualizar nivel mínimo:", error);
    
    // Clasificar tipo de error para determinar status code
    let statusCode = 500;
    if (error.message?.includes("no encontrado")) {
      statusCode = 404;
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Error al actualizar el nivel mínimo de stock" 
      },
      { status: statusCode }
    );
  }
} 