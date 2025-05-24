import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getAllCategories } from "@/services/productService";
import { checkPermissionsWithDebug } from "@/components/auth/check-permissions-debug";

// Validation schema for category creation
const CategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

// GET /api/categories - List all categories
export async function GET() {
  try {
    // Allow all authenticated users to view categories for product assignment
    // Only restrict creation/modification to admins
    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    });
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create a new category
export async function POST(req: Request) {
  try {
    // Verificar permisos antes de crear datos
    const authCheck = await checkPermissionsWithDebug("admin");
    
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: "No tienes permisos para crear categorías" },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const validatedData = CategorySchema.parse(body);

    const category = await prisma.category.create({
      data: validatedData,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
} 