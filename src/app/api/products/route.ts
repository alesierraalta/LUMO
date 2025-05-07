import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { calculateMargin, calculatePrice } from '@/lib/client-utils';

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
  cost: z.number().default(0),
  price: z.number().min(0.01, { message: "El precio debe ser mayor que 0" }),
  margin: z.number().optional(),
  categoryId: z.string().optional(),
  imageUrl: z.string().optional(),
  // Inventory fields
  quantity: z.number().int().min(0, { message: "La cantidad no puede ser negativa" }).default(0),
  minStockLevel: z.number().int().min(0, { message: "El nivel mínimo no puede ser negativo" }).default(5),
  location: z.string().optional()
});

// Helper function to serialize Decimal fields to numbers
function serializeDecimal(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'object') {
    if (data.constructor && data.constructor.name === 'Decimal') {
      return Number(data);
    }

    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        data[key] = serializeDecimal(data[key]);
      }
    }
  }

  if (Array.isArray(data)) {
    return data.map(item => serializeDecimal(item));
  }

  return data;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = SearchParamsSchema.parse(Object.fromEntries(searchParams));

    // Build where clause
    const where: any = {
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
      where.price = {};
      if (params.minPrice) where.price.gte = params.minPrice;
      if (params.maxPrice) where.price.lte = params.maxPrice;
    }

    if (params.inStock) {
      where.quantity = {
        gt: 0,
      };
    }

    // Build order by clause
    let orderBy: any = { name: 'asc' };
    if (params.sortBy) {
      switch (params.sortBy) {
        case 'price':
          orderBy = { price: params.sortOrder || 'asc' };
          break;
        case 'stock':
          orderBy = { quantity: params.sortOrder || 'asc' };
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

export async function POST(request: Request) {
  try {
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
    
    const cost = validatedData.cost || 0;
    let price = validatedData.price;
    let margin = validatedData.margin;
    
    // Asegurar que tanto el precio como el margen sean consistentes
    if (margin !== undefined && margin > 0) {
      // Si se proporciona margen, recalcular el precio
      price = calculatePrice(cost, margin);
    } else if (price !== undefined && price > 0) {
      // Si no se proporciona margen pero sí precio, calcular el margen
      margin = calculateMargin(cost, price);
    } else {
      // Caso por defecto si no hay información suficiente
      margin = 0;
      // El precio debe ser al menos mayor que el costo
      price = Math.max(price, cost * 1.01);
    }
    
    // Create the inventory item with all product data
    const product = await prisma.inventoryItem.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        sku: validatedData.sku,
        cost,
        price,
        margin,
        categoryId: validatedData.categoryId,
        imageUrl: validatedData.imageUrl,
        quantity: validatedData.quantity || 0,
        minStockLevel: validatedData.minStockLevel || 5,
        location: validatedData.location,
        // Create initial stock movement if quantity > 0
        stockMovements: validatedData.quantity > 0 ? {
          create: {
            quantity: validatedData.quantity,
            type: "INITIAL",
            notes: "Inventario inicial",
          }
        } : undefined,
      },
      include: {
        category: true,
        stockMovements: true,
      },
    });
    
    return NextResponse.json(serializeDecimal(product), { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    
    // Handle validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: error.message || 'Error al crear el producto' },
      { status: 400 }
    );
  }
} 