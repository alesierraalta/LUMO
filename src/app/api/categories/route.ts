import { NextResponse } from "next/server";
import db from "@/lib/db";
import { z } from "zod";
import { getCurrentUser, isAdmin } from "@/lib/auth";

// Validation schema for category creation
const CategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

// GET /api/categories - List all categories
export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!prisma) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Allow all authenticated users to view categories for product assignment
    const categories = await db.category.findMany({
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
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: "No tienes permisos para crear categorías" },
        { status: 403 }
      );
    }

    if (!prisma) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }
    
    const body = await req.json();
    const validatedData = CategorySchema.parse(body);

    const category = await db.category.create({
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