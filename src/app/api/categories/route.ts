import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-supabase';
import { getCurrentUser, getTokenFromRequest, getCurrentUserFromToken } from '@/lib/auth-server';
import { getCategoriesCached, invalidateInventoryCaches } from '@/lib/db-optimization-redis';
import { responseCache, getCacheKey } from '@/lib/response-cache';
import { createServerClient } from '@/lib/supabase-server';

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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ];
    }

    // Use Redis-cached categories
    let categories = await getCategoriesCached();
    
    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      categories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchLower) ||
        (cat.description && cat.description.toLowerCase().includes(searchLower))
      );
    }

    // Calculate pagination
    const total = categories.length;
    const paginatedCategories = categories.slice(offset, offset + limit);

    // Add additional fields that the frontend expects
    const categoriesWithMeta = paginatedCategories.map(cat => ({
      ...cat,
      createdBy: null, // Will be populated from cache if needed
      _count: { inventoryItems: 0 } // Will be populated from cache if needed
    }));

    return NextResponse.json({
      success: true,
      categories: categoriesWithMeta,
      total,
      limit,
      offset
    });
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
    if (!data.name || data.name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }
    
    // Ensure we have a valid user ID (created_by_id is required in database)
    if (!user.id) {
      console.error('No user ID available for category creation');
      return NextResponse.json(
        { success: false, error: 'User authentication error' },
        { status: 401 }
      );
    }

    console.log('🔍 Verifying user exists in database:', user.id);

    // Verify user exists in database before creating category
    const supabase = await createServerClient();
    const { data: userExists, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    let validUserId = user.id;

    if (userCheckError || !userExists) {
      console.error('❌ User ID not found in database:', user.id, userCheckError?.message);
      
      // Try to find user by email as fallback
      const { data: userByEmail, error: emailError } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();
      
      if (emailError || !userByEmail) {
        console.error('❌ User not found by email either:', user.email, emailError?.message);
        return NextResponse.json({ 
          success: false, 
          error: 'User not found in database. Please contact administrator.' 
        }, { status: 400 });
      }
      
      console.log('✅ Found user by email, using database ID:', userByEmail.id);
      validUserId = userByEmail.id; // Use the database user ID
    } else {
      console.log('✅ User ID verified in database');
    }
    
    const category = await db.category.create({
      data: {
        name: data.name.trim(),
        description: data.description || '',
        createdById: validUserId
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

    // Check if category creation failed
    if (!category) {
      console.error('Category creation returned null - database operation failed');
      return NextResponse.json(
        { success: false, error: 'Failed to create category - database error' },
        { status: 500 }
      );
    }

    // Invalidate caches after creating new category
    await invalidateInventoryCaches();

    return NextResponse.json({
      success: true,
      category
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    return NextResponse.json(
      { success: false, error: `Failed to create category: ${error.message}` },
      { status: 500 }
    );
  }
} 