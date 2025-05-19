import { NextRequest, NextResponse } from "next/server";
import { deleteInventoryItem, getInventoryItemById } from "@/services/inventoryService";
import { checkPermissionsWithDebug } from "@/components/auth/check-permissions-debug";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permisos antes de eliminar datos
    const authCheck = await checkPermissionsWithDebug("admin");
    
    if (!authCheck.authorized) {
      return NextResponse.json(
        { 
          success: false,
          error: "No tienes permisos para eliminar items de inventario" 
        },
        { status: 403 }
      );
    }

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

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permisos antes de devolver datos
    const authCheck = await checkPermissionsWithDebug("admin");
    
    if (!authCheck.authorized) {
      return NextResponse.json(
        { 
          success: false,
          error: "No tienes permisos para ver detalles de items de inventario" 
        },
        { status: 403 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "El ID del item de inventario es requerido" },
        { status: 400 }
      );
    }

    const item = await getInventoryItemById(id);

    if (!item) {
      return NextResponse.json(
        { success: false, error: `Item de inventario con ID '${id}' no encontrado` },
        { status: 404 }
      );
    }

    return NextResponse.json(item, { status: 200 });
  } catch (error: any) {
    console.error("Error al obtener el item de inventario:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Error al obtener el item de inventario" 
      },
      { status: 500 }
    );
  }
} 