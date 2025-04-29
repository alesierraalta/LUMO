import { NextRequest, NextResponse } from "next/server";
import { addStock } from "@/services/inventoryService";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: "ID de inventario no proporcionado" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { quantity, notes } = body;

    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "La cantidad debe ser mayor que cero" },
        { status: 400 }
      );
    }

    const result = await addStock(id, Number(quantity), notes);

    return NextResponse.json({
      success: true,
      message: `Se han añadido ${quantity} unidades al inventario`,
      data: result
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error al añadir stock:", error);
    
    // Determinar si es un error conocido o inesperado
    const statusCode = error.message?.includes("no encontrado") ? 404 : 500;
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Error al añadir stock" 
      },
      { status: statusCode }
    );
  }
} 