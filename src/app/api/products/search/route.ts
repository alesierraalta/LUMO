import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-supabase';
import { serializeDecimal } from '@/lib/utils';
import { getCurrentUserFromToken, getTokenFromRequest } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    // Authentication check with fallback for Choreo
    const token = getTokenFromRequest(request);
    let user = token ? await getCurrentUserFromToken(token) : null;
    
    // Fallback for Choreo deployment testing
    if (!user) {
      user = {
        id: 'dd97c238-6649-4e31-979b-c9ef12959998',
        email: 'alesierraalta@gmail.com',
        name: 'Alejandro Sierra (ROOT)',
        role: 'USER'
      };
      console.log('🔄 Using fallback user for product search:', user.email);
    }

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

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
      db.inventoryItem.findMany({
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
      db.inventoryItem.count({ where })
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
    console.error('❌ Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', details: (error as any).message },
      { status: 500 }
    );
  }
} 
