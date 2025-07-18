import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-supabase';
import { getCurrentUser, getTokenFromRequest, getCurrentUserFromToken } from '@/lib/auth-server';
import { getCategoriesCached, invalidateInventoryCaches } from '@/lib/db-optimization-redis';
import { responseCache, getCacheKey } from '@/lib/response-cache';
import { createServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // CRITICAL BUILD FIX: Handle build-time execution
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('⚠️ Categories GET: Build-time execution detected, returning empty response');
      return NextResponse.json({
        success: true,
        categories: [],
        total: 0,
        limit: 50,
        offset: 0
      });
    }

    // Try to get from cache first
    const cacheKey = getCacheKey.categories();
    const cached = responseCache.get(cacheKey);
    if (cached) {
      console.log('✅ Categories: Returning cached response');
      return NextResponse.json(cached);
    }

    // Use optimized cached function
    const categories = await getCategoriesCached();

    const response = {
      success: true,
      categories,
      total: categories.length,
      limit: 50,
      offset: 0
    };

    // Cache the response
    responseCache.set(cacheKey, response, 300000); // 5 minutes in milliseconds

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // CRITICAL BUILD FIX: Handle build-time execution
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('⚠️ Categories POST: Build-time execution detected, returning empty response');
      return NextResponse.json({
        success: false,
        error: 'Build-time execution'
      }, { status: 503 });
    }

    // Authentication check - use fallback pattern like other APIs
    const token = getTokenFromRequest(request);
    const user = token ? await getCurrentUserFromToken(token) : await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.name || data.name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }
    
    const category = await db.category.create({
      data: {
        name: data.name.trim(),
        description: data.description || '',
        createdById: user.id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Invalidate caches
    await invalidateInventoryCaches();
    responseCache.invalidate('categories');

    return NextResponse.json({
      success: true,
      category
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: `Failed to create category: ${error.message}` },
      { status: 500 }
    );
  }
}