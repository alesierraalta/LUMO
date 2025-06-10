import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";

// Endpoint para obtener todas las ventas
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y permisos
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: "No autorizado para realizar esta acción" },
        { status: 401 }
      );
    }

    // Verificar que prisma está disponible
    if (!prisma) {
      return NextResponse.json(
        { error: "Error de conexión a la base de datos" },
        { status: 500 }
      );
    }

    // Obtener parámetros de consulta (para futura paginación)
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50");
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    // Obtener ventas con sus detalles
    const sales = await db.sale.findMany({
      skip,
      take: limit,
      orderBy: {
        date: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        transactions: {
          select: {
            id: true,
            quantity: true
          }
        }
      }
    });

    // Obtener total para paginación
    const total = await db.sale.count();

    // Serializar datos para manejar decimales
    const serializedSales = sales.map(sale => ({
      ...sale,
      total: Number(sale.total),
      subtotal: Number(sale.subtotal),
      tax: Number(sale.tax)
    }));

    // Devolver respuesta con ventas
    return NextResponse.json({
      sales: serializedSales,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    return NextResponse.json(
      { error: "Error al obtener las ventas", sales: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación y permisos
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: "No autorizado para realizar esta acción" },
        { status: 401 }
      );
    }

    // Obtener datos de la solicitud
    const data = await request.json();
    
    // Validar datos requeridos
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json(
        { error: "Se requieren productos para la orden de venta" },
        { status: 400 }
      );
    }

    // Verificar que prisma está disponible
    if (!prisma) {
      return NextResponse.json(
        { error: "Error de conexión a la base de datos" },
        { status: 500 }
      );
    }

    // Iniciar transacción para garantizar consistencia
    return await db.$transaction(async (tx) => {
      // 1. Crear registro de la orden de venta
      const saleOrder = await tx.sale.create({
        data: {
          notes: data.notes || "",
          total: data.total || 0,
          subtotal: data.total || 0,
          tax: 0,
          userId: data.userId || user.id,
          status: "COMPLETED",
        },
      });

      // 2. Procesar cada ítem de la orden
      for (const item of data.items) {
        // Verificar stock disponible
        const inventoryItem = await tx.inventoryItem.findUnique({
          where: { id: item.productId },
        });

        if (!inventoryItem) {
          throw new Error(`Producto no encontrado: ${item.productName}`);
        }

        if (inventoryItem.quantity < item.quantity) {
          throw new Error(`Stock insuficiente para: ${item.productName}`);
        }

        // Crear detalle de la orden
        await tx.saleTransaction.create({
          data: {
            saleId: saleOrder.id,
            inventoryItemId: item.productId,
            quantity: item.quantity,
            unitPrice: item.price,
            subtotal: item.total,
          },
        });

        // Reducir stock del inventario
        await tx.inventoryItem.update({
          where: { id: item.productId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });

        // Registrar movimiento de inventario (salida)
        await tx.stockMovement.create({
          data: {
            inventoryItemId: item.productId,
            quantity: -item.quantity, // Negativo porque es una salida
            type: "STOCK_OUT",
            notes: `Venta #${saleOrder.id} - ${data.notes ? data.notes : 'Venta directa'}`,
            userId: data.userId || user.id,
          },
        });
      }

      // Devolver respuesta con la orden creada
      return NextResponse.json({
        id: saleOrder.id,
        message: "Orden de venta procesada con éxito",
      });
    });
  } catch (error: any) {
    console.error("Error al procesar orden de venta:", error);
    
    return NextResponse.json(
      { 
        error: "Error al procesar la orden de venta", 
        message: error.message 
      },
      { status: 500 }
    );
  }
} 