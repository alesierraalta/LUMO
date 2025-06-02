import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { adjustStock } from '@/services/inventoryService';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { z } from 'zod';

export const runtime = 'nodejs';

// Definir el esquema para validar los datos de la solicitud
const adjustmentItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  currentQuantity: z.number(),
  newQuantity: z.number(),
  change: z.number(),
  reason: z.string().optional(),
});

const bulkAdjustmentSchema = z.object({
  items: z.array(adjustmentItemSchema),
  userId: z.string(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Verificar permisos del usuario
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'No tienes permisos para realizar esta acción' }, { status: 403 });
    }

    // Obtener y validar los datos de la solicitud
    const data = await request.json();
    const validationResult = bulkAdjustmentSchema.safeParse(data);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { items, userId, notes } = validationResult.data;

    // Procesar cada ajuste de inventario
    const adjustmentResults = [];
    
    for (const item of items) {
      // Verificar que el producto existe
      const inventoryItem = await prisma?.inventoryItem.findUnique({
        where: { id: item.productId },
      });

      if (!inventoryItem) {
        return NextResponse.json(
          { error: `Producto no encontrado: ${item.productName}` },
          { status: 404 }
        );
      }

      // Crear el mensaje para el registro del movimiento
      const reasonMessage = item.reason 
        ? `${item.reason} (${item.currentQuantity} → ${item.newQuantity})`
        : `Ajuste manual de cantidad de ${item.currentQuantity} a ${item.newQuantity}`;

      // Ajustar el stock
      const adjustmentResult = await adjustStock(
        item.productId,
        item.newQuantity,
        reasonMessage
      );

      adjustmentResults.push({
        productId: item.productId,
        productName: item.productName,
        oldQuantity: item.currentQuantity,
        newQuantity: item.newQuantity,
        change: item.change,
        status: 'success'
      });
    }

    // Registrar el ajuste como un movimiento de stock general si hay notas
    if (notes) {
      // Crear una entrada en StockMovement como resumen de la operación
      await prisma?.stockMovement.create({
        data: {
          inventoryItemId: items[0].productId, // Usamos el primer producto como referencia
          quantity: 0, // Es un movimiento informativo, no afecta cantidades
          type: 'ADJUSTMENT',
          notes: `Ajuste masivo de inventario (${items.length} productos): ${notes}`,
          userId,
          createdBy: userId
        }
      });
    }

    return NextResponse.json({
      message: 'Ajuste de inventario procesado correctamente',
      adjustments: adjustmentResults,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error al procesar el ajuste de inventario:', error);
    return NextResponse.json(
      { error: 'Error al procesar el ajuste de inventario', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
} 