import { NextResponse } from "next/server";
import db from "@/lib/db-hybrid";
import { z } from "zod";

const CategoryUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
});

// GET /api/categories/[id] - Get a single category
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const category = await db.category.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

// PUT /api/categories/[id] - Update a category
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await req.json();
    const validatedData = CategoryUpdateSchema.parse(body);

    const category = await db.category.update({
      where: { id: resolvedParams.id },
      data: validatedData,
    });

    return NextResponse.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - Delete a category
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    
    console.log('🗑️ Attempting to delete category:', resolvedParams.id);
    
    // Check if category has associated products
    const productsCount = await db.inventoryItem.count({
      where: { categoryId: resolvedParams.id }
    });
    
    if (productsCount > 0) {
      console.log('❌ Cannot delete category with associated products:', productsCount);
      return NextResponse.json(
        { error: `Cannot delete category. It has ${productsCount} associated products.` },
        { status: 400 }
      );
    }
    
    await db.category.delete({
      where: { id: resolvedParams.id },
    });

    console.log('✅ Category deleted successfully:', resolvedParams.id);
    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting category:', error);
    
    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete category', details: (error as any).message },
      { status: 500 }
    );
  }
} 