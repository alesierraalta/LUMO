import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { calculateMargin, calculatePrice, serializeDecimal } from '@/lib/utils';
import { getCurrentUserFromToken, getTokenFromRequest } from '@/lib/auth-simple';

// Schema for search query parameters
const SearchParamsSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.string().transform(val => val ? parseFloat(val) : undefined).optional(),
  maxPrice: z.string().transform(val => val ? parseFloat(val) : undefined).optional(),
  inStock: z.string().transform(val => val === 'true').optional(),
  sortBy: z.enum(['name', 'price', 'stock']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.string().transform(val => parseInt(val || '1')).optional(),
  limit: z.string().transform(val => parseInt(val || '10')).optional(),
});

// Product input validation schema
const ProductSchema = z.object({
  name: z.string().min(1, { message: "El nombre del producto es requerido" }).max(100, { message: "El nombre no puede exceder los 100 caracteres" }),
  description: z.string().optional(),
  sku: z.string().min(1, { message: "El SKU es requerido" }),
  cost: z.number().min(0, { message: "El costo no puede ser negativo" }).optional(),
  price: z.number().min(0, { message: "El precio no puede ser negativo" }).optional(),
  margin: z.number().optional(),
  categoryId: z.string().optional(),
  imageUrl: z.string().optional(),
  // Inventory fields
  quantity: z.number().int().min(0, { message: "La cantidad no puede ser negativa" }).default(0),
  minStockLevel: z.number().int().min(0, { message: "El nivel mínimo no puede ser negativo" }).default(5),
  locationId: z.string().optional()
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = SearchParamsSchema.parse(Object.fromEntries(searchParams));

    // Build where clause
    const where: Record<string, unknown> = {
      active: true,
    };

    if (params.query) {
      where.OR = [
        { name: { contains: params.query, mode: 'insensitive' } },
        { sku: { contains: params.query, mode: 'insensitive' } },
        { description: { contains: params.query, mode: 'insensitive' } },
      ];
    }

    if (params.category) {
      where.categoryId = params.category;
    }

    if (params.minPrice || params.maxPrice) {
      const priceFilter: Record<string, number> = {};
      if (params.minPrice) priceFilter.gte = params.minPrice;
      if (params.maxPrice) priceFilter.lte = params.maxPrice;
      where.price = priceFilter;
    }

    if (params.inStock) {
      where.currentStock = {
        gt: 0,
      };
    }

    // Build order by clause
    let orderBy: Record<string, 'asc' | 'desc'> = { name: 'asc' };
    if (params.sortBy) {
      switch (params.sortBy) {
        case 'price':
          orderBy = { price: params.sortOrder || 'asc' };
          break;
        case 'stock':
          orderBy = { currentStock: params.sortOrder || 'asc' };
          break;
        default:
          orderBy = { name: params.sortOrder || 'asc' };
      }
    }

    // Get total count for pagination
    const total = await prisma.inventoryItem.count({ where });

    // Get paginated results
    const products = await prisma.inventoryItem.findMany({
      where,
      include: {
        category: true,
        stockMovements: {
          take: 5,
          orderBy: {
            date: 'desc',
          },
        },
      },
      orderBy,
      skip: ((params.page || 1) - 1) * (params.limit || 10),
      take: params.limit || 10,
    });

    return NextResponse.json({
      products,
      pagination: {
        total,
        pages: Math.ceil(total / (params.limit || 10)),
        currentPage: params.page || 1,
        perPage: params.limit || 10,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error searching products:', error);
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const token = getTokenFromRequest(request);
    let user = null;
    
    if (token) {
      user = await getCurrentUserFromToken(token);
    }
    
    // Fallback to default admin user for testing in Choreo
    if (!user) {
      console.log('No authenticated user found, using default admin for testing');
      user = { id: 'dd97c238-6649-4e31-979b-c9ef12959998' }; // Admin user ID from Supabase
    }

    const data = await request.json();
    
    // Validate input data
    const validatedData = ProductSchema.parse(data);
    
    // Check if SKU already exists
    const existingSku = await prisma.inventoryItem.findUnique({
      where: { sku: validatedData.sku }
    });
    
    if (existingSku) {
      return NextResponse.json(
        { message: `El SKU '${validatedData.sku}' ya está en uso.` },
        { status: 400 }
      );
    }
    
    const cost = validatedData.cost;
    let price = validatedData.price;
    let margin = validatedData.margin;
    
    // Calcular valores solo si se proporcionan tanto cost como price
    if (cost !== undefined && price !== undefined && cost > 0 && price > 0) {
      if (margin !== undefined && margin > 0) {
        // Si se proporciona margen, recalcular el precio
        price = calculatePrice(cost, margin);
      } else {
        // Si no se proporciona margen pero sí precio, calcular el margen
        margin = calculateMargin(cost, price);
      }
    }
    
    // Create the inventory item with all product data
    const createData: Record<string, unknown> = {
      name: validatedData.name,
      description: validatedData.description,
      sku: validatedData.sku,
      currentStock: validatedData.quantity || 0,
      minStockLevel: validatedData.minStockLevel || 5,
      categoryId: validatedData.categoryId,
      locationId: validatedData.locationId,
      createdById: user.id,
    };

    // Only add cost, price, margin and imageUrl if they are provided
    if (cost !== undefined) {
      createData.cost = cost;
    }
    if (price !== undefined) {
      createData.price = price;
    }
    if (margin !== undefined) {
      createData.margin = margin;
    }
    if (validatedData.imageUrl) {
      createData.imageUrl = validatedData.imageUrl;
    }

    const product = await prisma.inventoryItem.create({
      data: createData,
      include: {
        category: true,
        stockMovements: true,
      },
    });
    
    return NextResponse.json(serializeDecimal(product), { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating product:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Error al crear el producto';
    return NextResponse.json(
      { message: errorMessage },
      { status: 400 }
    );
  }
} 