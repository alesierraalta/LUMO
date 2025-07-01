import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-supabase';
import { z } from "zod";
import { serializeDecimal } from "@/lib/utils";

// Schema for validating financial updates
const financialsUpdateSchema = z.object({
  price: z.number().min(0).optional(),
  cost: z.number().min(0).optional(),
  margin: z.number().optional(),
  changeReason: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID del producto es requerido' },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Validate request body
    const validation = financialsUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid data provided", issues: validation.error.issues },
        { status: 400 }
      );
    }
    
    const { price, cost, margin } = validation.data;

    // Prepare data for update (only include fields that are present)
    const updateData: { price?: number; cost?: number; margin?: number } = {};
    if (price !== undefined) updateData.price = price;
    if (cost !== undefined) updateData.cost = cost;
    if (margin !== undefined) updateData.margin = margin;

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
       return NextResponse.json(
        { success: true, message: "No financial data provided for update." },
        { status: 200 }
      );
    }

    // Update the inventory item (simplified - no transaction or history)
    const updatedItem = await db.inventoryItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Inventory item financials updated successfully.",
      data: serializeDecimal(updatedItem),
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error updating inventory financials:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Error updating inventory financials",
        details: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID del producto es requerido' },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Get the inventory item with financial data
    const item = await db.inventoryItem.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Calculate financial metrics
    const cost = Number(item.cost) || 0;
    const price = Number(item.price) || 0;
    const quantity = item.quantity || 0;

    const margin = cost > 0 ? ((price - cost) / cost) * 100 : 0;
    const totalValue = price * quantity;
    const totalCost = cost * quantity;
    const totalProfit = totalValue - totalCost;

    const financials = {
      id: item.id,
      name: item.name,
      sku: item.sku,
      cost,
      price,
      quantity,
      margin: Math.round(margin * 100) / 100,
      totalValue: Math.round(totalValue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      category: item.category?.name || 'Sin categoría',
      lastUpdated: item.lastUpdated
    };

    return NextResponse.json(financials);

  } catch (error) {
    console.error('Error fetching financial data:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 