import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeDecimal } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { page = '1', limit = '12', search, category, minPrice, maxPrice, inStock } = searchParams;

    // Build the where clause
    const where: any = { active: true };
    
    if (search) {
      where.OR = [
        { name: { contains: search.toString() } },
        { sku: { contains: search.toString() } }
      ];
    }

    if (category) {
      where.categoryId = category.toString();
    }

    if (minPrice) {
      where.price = { ...where.price, gte: parseFloat(minPrice.toString()) };
    }

    if (maxPrice) {
      where.price = { ...where.price, lte: parseFloat(maxPrice.toString()) };
    }

    if (inStock === 'true') {
      where.quantity = { gt: 0 };
    }

    // Execute the query
    const [products, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        include: {
          category: true
        },
        orderBy: {
          name: 'asc'
        },
        skip: (parseInt(page.toString()) - 1) * parseInt(limit.toString()),
        take: parseInt(limit.toString())
      }),
      prisma.inventoryItem.count({ where })
    ]);

    // Return the results
    return NextResponse.json({
      products: serializeDecimal(products),
      pagination: {
        total,
        pages: Math.ceil(total / parseInt(limit.toString())),
        currentPage: parseInt(page.toString()),
        perPage: parseInt(limit.toString())
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
} 