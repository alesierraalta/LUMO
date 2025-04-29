import { NextRequest, NextResponse } from "next/server";
import { deleteInventoryItem } from "@/services/inventoryService";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { 
          success: false,
          error: "El ID del item de inventario es requerido" 
        },
        { status: 400 }
      );
    }

    const result = await deleteInventoryItem(id);

    return NextResponse.json({
      success: true,
      message: `Item de inventario eliminado correctamente. Se eliminaron ${result.item.movementsDeleted} movimientos asociados.`,
      data: result
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error al eliminar el item de inventario:", error);
    
    // Clasificar tipo de error para determinar status code
    let statusCode = 500;
    if (error.message?.includes("no encontrado")) {
      statusCode = 404;
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Error al eliminar el item de inventario" 
      },
      { status: statusCode }
    );
  }
} 