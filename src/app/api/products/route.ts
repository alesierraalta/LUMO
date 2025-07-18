import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getCurrentUserFromToken, getTokenFromRequest } from '@/lib/auth-server';
import { db } from '@/lib/db-supabase';

// GET /api/products - Get all products (inventory items)
export async function GET(request: NextRequest) {
  try {
    console.log('📦 GET /api/products - Starting request');
    
    // Get user from token or session
    const token = getTokenFromRequest(request);
    console.log('🔑 GET - Token found:', !!token);
    
    const user = token ? await getCurrentUserFromToken(token) : await getCurrentUser();
    console.log('👤 GET - User found:', !!user, user?.email);
    
    if (!user) {
      console.log('❌ GET - No user found, returning 401');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const locationId = searchParams.get('locationId') || '';
    const includeInactive = searchParams.get('includeInactive') === 'true';

    console.log('🔍 GET - Query params:', { page, limit, search, categoryId, locationId, includeInactive });

    // Build where clause
    const where: any = {};
    
    if (!includeInactive) {
      where.isActive = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (locationId) {
      where.locationId = locationId;
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    console.log('🗃️ GET - Fetching inventory items...');
    
    // Get inventory items with related data
    const [items, totalCount] = await Promise.all([
      db.inventoryItem.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          },
          location: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: [
          { name: 'asc' }
        ],
        skip: offset,
        take: limit
      }),
      db.inventoryItem.count({ where })
    ]);

    console.log('✅ GET - Found', items.length, 'items out of', totalCount, 'total');

    // Transform to match frontend expectations
    const products = items.map(item => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      description: item.description,
      category: item.category?.name || 'Sin categoría',
      categoryId: item.categoryId,
      location: item.location?.name || 'Sin ubicación',
      locationId: item.locationId,
      currentStock: item.currentStock,
      quantity: item.currentStock, // Alias for compatibility
      minStockLevel: item.minStockLevel,
      unitPrice: item.unitPrice,
      unitCost: item.unitCost,
      cost: item.unitCost, // Alias for compatibility
      price: item.unitPrice, // Alias for compatibility
      margin: item.margin,
      imageUrl: item.imageUrl,
      isActive: item.isActive,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    console.error('❌ GET - Error fetching products:', error);
    console.error('❌ GET - Error stack:', error.stack);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener los productos',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product (inventory item)
export async function POST(request: NextRequest) {
  try {
    console.log('➕ POST /api/products - Starting creation');
    
    // Get user from token or session
    const token = getTokenFromRequest(request);
    console.log('🔑 POST - Token found:', !!token);
    
    const user = token ? await getCurrentUserFromToken(token) : await getCurrentUser();
    console.log('👤 POST - User found:', !!user, user?.email);
    
    if (!user) {
      console.log('❌ POST - No user found, returning 401');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('📝 POST - Request body:', body);

    // Validate required fields
    const { name, sku } = body;
    if (!name || !sku) {
      console.log('❌ POST - Missing required fields');
      return NextResponse.json(
        { success: false, error: 'Name and SKU are required' },
        { status: 400 }
      );
    }

    // Check if SKU already exists
    const existingSku = await db.inventoryItem.findUnique({
      where: { sku }
    });

    if (existingSku) {
      console.log('❌ POST - SKU already exists');
      return NextResponse.json(
        { success: false, error: 'SKU already exists' },
        { status: 400 }
      );
    }

    // Create the inventory item
    console.log('💾 POST - Creating inventory item...');
    const newItem = await db.inventoryItem.create({
      data: {
        name,
        sku,
        description: body.description || '',
        categoryId: body.categoryId || null,
        locationId: body.locationId || null,
        currentStock: body.currentStock || 0,
        minStockLevel: body.minStockLevel || 0,
        unitPrice: body.unitPrice || body.price || null,
        unitCost: body.unitCost || body.cost || null,
        margin: body.margin || null,
        imageUrl: body.imageUrl || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
        createdById: user.id
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        location: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log('✅ POST - Item created successfully:', newItem.id);

    // Transform response
    const product = {
      id: newItem.id,
      name: newItem.name,
      sku: newItem.sku,
      description: newItem.description,
      category: newItem.category?.name || 'Sin categoría',
      categoryId: newItem.categoryId,
      location: newItem.location?.name || 'Sin ubicación',
      locationId: newItem.locationId,
      currentStock: newItem.currentStock,
      quantity: newItem.currentStock,
      minStockLevel: newItem.minStockLevel,
      unitPrice: newItem.unitPrice,
      unitCost: newItem.unitCost,
      cost: newItem.unitCost,
      price: newItem.unitPrice,
      margin: newItem.margin,
      imageUrl: newItem.imageUrl,
      isActive: newItem.isActive,
      createdAt: newItem.createdAt,
      updatedAt: newItem.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });

  } catch (error) {
    console.error('❌ POST - Error creating product:', error);
    console.error('❌ POST - Error stack:', error.stack);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al crear el producto',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}