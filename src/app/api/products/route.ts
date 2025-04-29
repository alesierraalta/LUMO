import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createProduct } from '@/services/productService';
import { z } from 'zod';

const prisma = new PrismaClient();

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
      where.inventory = {
        quantity: {
          gt: 0,
        },
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
          orderBy = { 
            inventory: {
              quantity: params.sortOrder || 'asc',
            },
          };
          break;
        default:
          orderBy = { name: params.sortOrder || 'asc' };
      }
    }

    // Get total count for pagination
    const total = await prisma.product.count({ where });

    // Get paginated results
    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        inventory: true,
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
    
    const product = await createProduct(data);
    
    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { message: error.message || 'Error al crear el producto' },
      { status: 400 }
    );
  }
} 