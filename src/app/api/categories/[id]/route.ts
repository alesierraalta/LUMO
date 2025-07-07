import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-supabase';
import { getCurrentUser, getTokenFromRequest, getCurrentUserFromToken } from '@/lib/auth-server';

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

    // Get user from token or session
    const token = getTokenFromRequest(request);
    console.log('Token found:', !!token);
    
    const user = token ? await getCurrentUserFromToken(token) : await getCurrentUser();
    console.log('User found:', !!user, user?.id);
    
    if (!user) {
      console.log('❌ No user found - unauthorized');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔍 Checking if category exists...');
    // Check if category exists
    const existingCategory = await db.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            inventoryItems: true
          }
        }
      }
    });

    console.log('Category found:', !!existingCategory);
    if (existingCategory) {
      console.log('Category name:', existingCategory.name);
      console.log('Associated products count:', existingCategory._count.inventoryItems);
    }

    if (!existingCategory) {
      console.log('❌ Category not found');
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category has inventory items
    if (existingCategory._count.inventoryItems > 0) {
      console.log('❌ Category has associated products - cannot delete');
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete category with ${existingCategory._count.inventoryItems} associated products. Please reassign or delete the products first.` 
        },
        { status: 400 }
      );
    }

    console.log('🗑️ Proceeding with deletion...');
    const deleteResult = await db.category.delete({
      where: { id }
    });
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
    
    // Return more specific error information
    const errorMessage = error?.message || 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: `Failed to delete category: ${errorMessage}` },
      { status: 500 }
    );
  }
} 