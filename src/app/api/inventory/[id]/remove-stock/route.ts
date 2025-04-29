import { NextRequest, NextResponse } from "next/server";
import { removeStock } from "@/services/inventoryService";

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

    const result = await removeStock(id, Number(quantity), notes);

    return NextResponse.json({
      success: true,
      message: `Se han retirado ${quantity} unidades del inventario`,
      data: result
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error al reducir stock:", error);
    
    // Clasificar tipo de error para determinar status code
    let statusCode = 500;
    if (error.message?.includes("no encontrado")) {
      statusCode = 404;
    } else if (error.message?.includes("Stock insuficiente")) {
      statusCode = 400;
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Error al reducir stock" 
      },
      { status: statusCode }
    );
  }
} 