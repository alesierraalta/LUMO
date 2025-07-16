import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-supabase';
import { getCurrentUser, getTokenFromRequest, getCurrentUserFromToken } from '@/lib/auth-server';
import {
  getOptimizedInventoryItemsCached,
  getOptimizedInventoryCountCached,
  invalidateInventoryCaches
} from '@/lib/db-optimization-redis';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');
    const locationId = searchParams.get('locationId');
    const lowStock = searchParams.get('lowStock') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Use Redis-cached optimized queries
    const page = Math.floor(offset / limit) + 1;
    const items = await getOptimizedInventoryItemsCached(
      page,
      limit,
      search || undefined,
      categoryId || undefined,
      locationId || undefined,
      lowStock
    );

    const total = await getOptimizedInventoryCountCached(
      search || undefined,
      categoryId || undefined,
      locationId || undefined,
      lowStock
    );

    return NextResponse.json({
      success: true,
      items,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const data = await request.json();
    
    // Handle development mode user ID
    let createdById = user.id;
    if (user.id === 'dev-admin') {
      // In development mode, use a valid UUID or null
      createdById = null;
    }
    
    const item = await db.inventoryItem.create({
      data: {
        name: data.name,
        description: data.description,
        sku: data.sku,
        barcode: data.barcode,
        currentStock: data.currentStock || data.quantity || 0,
        minStockLevel: data.minStockLevel || 0,
        maxLevel: data.maxLevel,
        unitCost: data.cost || data.unitCost || 0,
        unitPrice: data.price || data.unitPrice || 0,
        categoryId: data.categoryId === 'none' ? null : data.categoryId,
        locationId: data.locationId === 'none' ? null : data.locationId,
        imageUrl: data.imageUrl,
        createdById,
        isActive: true
      }
    });

    console.log('Created item:', item);

    // Invalidate inventory caches after creating new item
    await invalidateInventoryCaches();

    if (!item) {
      console.error('Item creation returned null');
      return NextResponse.json(
        { success: false, error: 'Item creation failed - null response' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      item
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    
    // Handle specific Supabase constraint violations
    if (error instanceof Error) {
      const errorMessage = error.message;
      
      // Check for duplicate SKU constraint violation
      if (errorMessage.includes('23505') && errorMessage.includes('inventory_items_sku_key')) {
        return NextResponse.json(
          { success: false, error: 'SKU already exists. Please use a unique SKU.' },
          { status: 409 }
        );
      }
      
      // Check for foreign key constraint violations
      if (errorMessage.includes('23503')) {
        if (errorMessage.includes('category_id')) {
          return NextResponse.json(
            { success: false, error: 'Invalid category selected.' },
            { status: 400 }
          );
        }
        if (errorMessage.includes('location_id')) {
          return NextResponse.json(
            { success: false, error: 'Invalid location selected.' },
            { status: 400 }
          );
        }
      }
      
      // Check for not null constraint violations
      if (errorMessage.includes('23502')) {
        return NextResponse.json(
          { success: false, error: 'Required field is missing.' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create inventory item' },
      { status: 500 }
    );
  }
}