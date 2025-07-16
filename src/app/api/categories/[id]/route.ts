import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-supabase';
import { getCurrentUser, getTokenFromRequest, getCurrentUserFromToken } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get user from token or session
    const token = getTokenFromRequest(request);
    const user = token ? await getCurrentUserFromToken(token) : await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const category = await db.category.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            inventoryItems: true
          }
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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

    // Check if category exists
    const existingCategory = await db.category.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    const category = await db.category.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            inventoryItems: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      category
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log('🗑️ DELETE /api/categories/[id] - Starting deletion process');
    console.log('Category ID:', id);

    // Enhanced authentication with better error handling
    let user = null;
    let authError = null;

    try {
      // Get user from token or session with timeout
      const token = getTokenFromRequest(request);
      console.log('Token found:', !!token);
      
      if (token) {
        user = await Promise.race([
          getCurrentUserFromToken(token),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 5000))
        ]);
      } else {
        user = await Promise.race([
          getCurrentUser(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 5000))
        ]);
      }
      
      console.log('User found:', !!user, user?.id);
    } catch (error) {
      console.error('❌ Authentication error:', error);
      authError = error;
      
      // If it's a timeout or auth system error, return 500
      if (error.message === 'Auth timeout' || error.message?.includes('timeout')) {
        return NextResponse.json(
          { success: false, error: 'Authentication service timeout. Please try again.' },
          { status: 500 }
        );
      }
    }
    
    if (!user) {
      console.log('❌ No user found - unauthorized');
      // If there was an auth error, return 500, otherwise 401
      if (authError) {
        return NextResponse.json(
          { success: false, error: 'Authentication service error. Please try again.' },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔍 Checking if category exists...');
    
    // Enhanced database query with timeout
    let existingCategory = null;
    try {
      existingCategory = await Promise.race([
        db.category.findUnique({
          where: { id },
          include: {
            _count: {
              select: {
                inventoryItems: true
              }
            }
          }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 10000))
      ]);
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      if (dbError.message === 'Database timeout') {
        return NextResponse.json(
          { success: false, error: 'Database timeout. Please try again.' },
          { status: 500 }
        );
      }
      throw dbError; // Re-throw other database errors
    }

    console.log('Category found:', !!existingCategory);
    if (existingCategory) {
      console.log('Category name:', existingCategory.name);
      console.log('Associated products count:', existingCategory._count?.inventoryItems || 0);
    }

    if (!existingCategory) {
      console.log('❌ Category not found');
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category has inventory items with safe access
    const inventoryCount = existingCategory._count?.inventoryItems || 0;
    if (inventoryCount > 0) {
      console.log('❌ Category has associated products - cannot delete');
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete category with ${inventoryCount} associated products. Please reassign or delete the products first.`
        },
        { status: 400 }
      );
    }

    console.log('🗑️ Proceeding with deletion...');
    
    // Enhanced deletion with timeout
    let deleteResult = null;
    try {
      deleteResult = await Promise.race([
        db.category.delete({ where: { id } }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Delete timeout')), 10000))
      ]);
    } catch (deleteError) {
      console.error('❌ Delete operation error:', deleteError);
      if (deleteError.message === 'Delete timeout') {
        return NextResponse.json(
          { success: false, error: 'Delete operation timeout. Please try again.' },
          { status: 500 }
        );
      }
      throw deleteError; // Re-throw other delete errors
    }
    
    console.log('🗑️ Delete result:', deleteResult);
    console.log('✅ Category deleted successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting category:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      cause: error?.cause
    });
    
    // Enhanced error response with more context
    let errorMessage = 'Unknown error occurred';
    let statusCode = 500;
    
    if (error?.message) {
      errorMessage = error.message;
      
      // Specific error handling
      if (error.message.includes('Record to delete does not exist')) {
        errorMessage = 'Category not found or already deleted';
        statusCode = 404;
      } else if (error.message.includes('Foreign key constraint')) {
        errorMessage = 'Cannot delete category with associated products';
        statusCode = 400;
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Operation timeout. Please try again.';
        statusCode = 500;
      }
    }
    
    return NextResponse.json(
      { success: false, error: `Failed to delete category: ${errorMessage}` },
      { status: statusCode }
    );
  }
}