import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-supabase';
import { getCurrentUser, getTokenFromRequest, getCurrentUserFromToken } from '@/lib/auth-server';

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

    const where: any = {
      isActive: true
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { description: { contains: search } }
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (locationId) {
      where.locationId = locationId;
    }

    if (lowStock) {
      // Use a special flag for low stock filtering - this will be handled in post-processing
      where.currentStock = { lte: 'minStockLevel' };
    }

    const items = await db.inventoryItem.findMany({
      where,
      include: {
        category: true,
        location: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { name: 'asc' },
      take: limit,
      skip: offset
    });

    const total = await db.inventoryItem.count({ where });

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
      },
      include: {
        category: true,
        location: true,
        createdBy: createdById ? {
          select: {
            id: true,
            name: true,
            email: true
          }
        } : undefined
      }
    });

    return NextResponse.json({
      success: true,
      item
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create inventory item' },
      { status: 500 }
    );
  }
} 