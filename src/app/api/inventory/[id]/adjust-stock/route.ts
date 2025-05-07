import { NextRequest, NextResponse } from "next/server";
import { adjustStock } from "@/services/inventoryService";

export async function POST(
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
    const { newQuantity, notes } = body;

    if (newQuantity === undefined || newQuantity < 0) {
      return NextResponse.json(
        { error: "La cantidad no puede ser negativa" },
        { status: 400 }
      );
    }

    const result = await adjustStock(id, Number(newQuantity), notes);

    return NextResponse.json({
      success: true,
      message: `La cantidad se ha ajustado a ${newQuantity} unidades`,
      data: result
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error al ajustar stock:", error);
    
    // Clasificar tipo de error para determinar status code
    let statusCode = 500;
    if (error.message?.includes("no encontrado")) {
      statusCode = 404;
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Error al ajustar stock" 
      },
      { status: statusCode }
    );
  }
} 