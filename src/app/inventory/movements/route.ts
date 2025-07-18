import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-supabase';
import { getCurrentUser, getTokenFromRequest, getCurrentUserFromToken } from '@/lib/auth-server';

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
    const inventoryItemId = searchParams.get('inventoryItemId');
    const movementType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query parameters
    const queryParams: any = {
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset,
      include: {
        inventoryItem: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    };

    // Add filters if provided
    const whereConditions: any = {};
    
    if (inventoryItemId) {
      whereConditions.inventoryItemId = inventoryItemId;
    }
    
    if (movementType) {
      whereConditions.movementType = movementType;
    }

    if (Object.keys(whereConditions).length > 0) {
      queryParams.where = whereConditions;
    }

    // Get stock movements
    const movements = await db.stockMovement.findMany(queryParams);

    // Get total count for pagination
    const totalCount = await db.stockMovement.count({
      where: queryParams.where
    });

    return NextResponse.json({
      success: true,
      movements,
      total: totalCount,
      limit,
      offset,
      hasMore: offset + limit < totalCount
    });
  } catch (error) {
    console.error('Error fetching inventory movements:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory movements' },
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
    
    // Validate required fields
    if (!data.inventoryItemId || !data.movementType || !data.quantity) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: inventoryItemId, movementType, quantity' },
        { status: 400 }
      );
    }

    // Validate movement type
    const validMovementTypes = ['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'SALE', 'PURCHASE', 'RETURN'];
    if (!validMovementTypes.includes(data.movementType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid movement type' },
        { status: 400 }
      );
    }

    // Get the inventory item to update stock
    const inventoryItem = await db.inventoryItem.findUnique({
      where: { id: data.inventoryItemId }
    });

    if (!inventoryItem) {
      return NextResponse.json(
        { success: false, error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    // Calculate new stock level
    let newStockLevel = inventoryItem.currentStock;
    const quantity = parseInt(data.quantity);

    // Determine if this is an increase or decrease
    const increaseTypes = ['IN', 'PURCHASE', 'RETURN', 'ADJUSTMENT'];
    const decreaseTypes = ['OUT', 'SALE', 'TRANSFER'];

    if (increaseTypes.includes(data.movementType)) {
      newStockLevel += quantity;
    } else if (decreaseTypes.includes(data.movementType)) {
      newStockLevel -= quantity;
      
      // Check if we have enough stock
      if (newStockLevel < 0) {
        return NextResponse.json(
          { success: false, error: 'Insufficient stock for this operation' },
          { status: 400 }
        );
      }
    } else if (data.movementType === 'ADJUSTMENT') {
      // For adjustments, the quantity might be the new total or the difference
      // We'll treat it as the new total if specified
      if (data.newTotal !== undefined) {
        newStockLevel = parseInt(data.newTotal);
      }
    }

    // Handle development mode user ID
    let createdById = user.id;
    if (user.id === 'dev-admin') {
      createdById = null;
    }

    // Create the stock movement record
    const movement = await db.stockMovement.create({
      data: {
        inventoryItemId: data.inventoryItemId,
        movementType: data.movementType,
        quantity: quantity,
        previousStock: inventoryItem.currentStock,
        newStock: newStockLevel,
        unitCost: data.unitCost || inventoryItem.unitCost,
        totalCost: (data.unitCost || inventoryItem.unitCost) * quantity,
        reason: data.reason || '',
        notes: data.notes || '',
        referenceNumber: data.referenceNumber || '',
        createdById
      },
      include: {
        inventoryItem: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Update the inventory item's current stock
    await db.inventoryItem.update({
      where: { id: data.inventoryItemId },
      data: {
        currentStock: newStockLevel
      }
    });

    return NextResponse.json({
      success: true,
      movement,
      message: 'Stock movement recorded successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory movement:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create inventory movement' },
      { status: 500 }
    );
  }
}