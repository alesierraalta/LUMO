import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-supabase';
import { getCurrentUser, getTokenFromRequest, getCurrentUserFromToken } from '@/lib/auth-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get user from token or session
    const token = getTokenFromRequest(request);
    const user = token ? await getCurrentUserFromToken(token) : await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const item = await db.inventoryItem.findUnique({
      where: { 
        id,
        isActive: true 
      },
      include: {
        category: true,
        location: true,
        createdBy: true
      }
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      item
    });
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory item' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get user from token or session
    const token = getTokenFromRequest(request);
    const user = token ? await getCurrentUserFromToken(token) : await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const data = await request.json();

    // Check if item exists
    const existingItem = await db.inventoryItem.findUnique({
      where: { id }
    });

    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    // Update the item
    const updatedItem = await db.inventoryItem.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        sku: data.sku,
        currentStock: data.currentStock,
        minStockLevel: data.minStockLevel,
        unitCost: data.unitCost,
        unitPrice: data.unitPrice,
        categoryId: data.categoryId === '' ? null : data.categoryId,
        locationId: data.locationId === '' ? null : data.locationId,
        isActive: data.isActive ?? true
      }
    });

    // Fetch the updated item with includes
    const itemWithIncludes = await db.inventoryItem.findUnique({
      where: { id },
      include: {
        category: true,
        location: true,
        createdBy: true
      }
    });

    return NextResponse.json({
      success: true,
      item: itemWithIncludes
    });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update inventory item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get user from token or session
    const token = getTokenFromRequest(request);
    const user = token ? await getCurrentUserFromToken(token) : await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if item exists
    const existingItem = await db.inventoryItem.findUnique({
      where: { id }
    });

    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    await db.inventoryItem.update({
      where: { id },
      data: {
        isActive: false
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete inventory item' },
      { status: 500 }
    );
  }
} 