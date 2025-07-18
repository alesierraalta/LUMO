import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-supabase';
import { getCurrentUser, getTokenFromRequest, getCurrentUserFromToken } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

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

    // Products are actually inventory items in this system
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
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Transform inventory item to product format
    const product = {
      id: item.id,
      name: item.name,
      description: item.description,
      sku: item.sku,
      barcode: item.barcode,
      price: item.unitPrice,
      cost: item.unitCost,
      stock: item.currentStock,
      minStock: item.minStockLevel,
      maxStock: item.maxLevel,
      category: item.category,
      location: item.location,
      imageUrl: item.imageUrl,
      isActive: item.isActive,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdBy: item.createdBy
    };

    return NextResponse.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
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
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Update the item (product)
    const updatedItem = await db.inventoryItem.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        sku: data.sku,
        barcode: data.barcode,
        unitPrice: data.price || data.unitPrice,
        unitCost: data.cost || data.unitCost,
        currentStock: data.stock || data.currentStock,
        minStockLevel: data.minStock || data.minStockLevel,
        maxLevel: data.maxStock || data.maxLevel,
        categoryId: data.categoryId === '' ? null : data.categoryId,
        locationId: data.locationId === '' ? null : data.locationId,
        imageUrl: data.imageUrl,
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

    // Transform to product format
    const product = {
      id: itemWithIncludes.id,
      name: itemWithIncludes.name,
      description: itemWithIncludes.description,
      sku: itemWithIncludes.sku,
      barcode: itemWithIncludes.barcode,
      price: itemWithIncludes.unitPrice,
      cost: itemWithIncludes.unitCost,
      stock: itemWithIncludes.currentStock,
      minStock: itemWithIncludes.minStockLevel,
      maxStock: itemWithIncludes.maxLevel,
      category: itemWithIncludes.category,
      location: itemWithIncludes.location,
      imageUrl: itemWithIncludes.imageUrl,
      isActive: itemWithIncludes.isActive,
      createdAt: itemWithIncludes.createdAt,
      updatedAt: itemWithIncludes.updatedAt,
      createdBy: itemWithIncludes.createdBy
    };

    return NextResponse.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
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
    console.log('🗑️ DELETE /api/products/[id] - Starting deletion for ID:', id);
    
    // Get user from token or session
    const token = getTokenFromRequest(request);
    console.log('🔑 DELETE - Token found:', !!token);
    
    const user = token ? await getCurrentUserFromToken(token) : await getCurrentUser();
    console.log('👤 DELETE - User found:', !!user, user?.email);
    
    if (!user) {
      console.log('❌ DELETE - No user found, returning 401');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if item exists
    console.log('🔍 DELETE - Checking if item exists...');
    const existingItem = await db.inventoryItem.findUnique({
      where: { id }
    });
    console.log('📦 DELETE - Item found:', !!existingItem);

    if (!existingItem) {
      console.log('❌ DELETE - Item not found, returning 404');
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    console.log('🗑️ DELETE - Performing soft delete...');
    const updateResult = await db.inventoryItem.update({
      where: { id },
      data: {
        isActive: false
      }
    });
    console.log('✅ DELETE - Update successful:', !!updateResult);

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('❌ DELETE - Error deleting product:', error);
    console.error('❌ DELETE - Error stack:', error.stack);
    console.error('❌ DELETE - Error details:', {
      name: error.name,
      message: error.message,
      cause: error.cause
    });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Error al eliminar el item',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}