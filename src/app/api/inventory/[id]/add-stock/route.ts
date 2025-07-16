import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-supabase';
import { getCurrentUser, getTokenFromRequest, getCurrentUserFromToken } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user from token or session
    const token = getTokenFromRequest(request);
    const user = token ? await getCurrentUserFromToken(token) : await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const { quantity, notes } = await request.json();

    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid quantity provided' },
        { status: 400 }
      );
    }

    // Get current item
    const currentItem = await db.inventoryItem.findUnique({
      where: { id }
    });

    if (!currentItem) {
      return NextResponse.json(
        { success: false, error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    // Update stock
    const newStock = currentItem.currentStock + quantity;
    const updatedItem = await db.inventoryItem.update({
      where: { id },
      data: {
        currentStock: newStock
      }
    });

    // TODO: Create stock movement record
    // This would typically be done with a stockMovement.create call

    return NextResponse.json({
      success: true,
      item: updatedItem,
      message: `Added ${quantity} units. New stock: ${newStock}`
    });
  } catch (error) {
    console.error('Error adding stock:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add stock' },
      { status: 500 }
    );
  }
} 