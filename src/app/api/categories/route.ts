import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { z } from "zod";
import { getCurrentUserFromToken, getTokenFromRequest } from "@/lib/auth-server";

// Build-time detection
const isBuild = process.env.NODE_ENV === 'production' && (
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.BUILD_ID ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'
);

// Validation schema for category creation
const CategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

// Build-safe response helper
const createBuildSafeResponse = (data: any = [], status: number = 200) => {
  if (isBuild) {
    console.log('🏗️ Build mode: Returning mock response for categories');
    return NextResponse.json(data, { status });
  }
  return null;
};

// GET /api/categories - List all categories
export async function GET(request: NextRequest) {
  try {
    // Build-time safety check
    const buildResponse = createBuildSafeResponse([]);
    if (buildResponse) return buildResponse;

    const token = getTokenFromRequest(request);
    let user = null;
    
    if (token) {
      user = await getCurrentUserFromToken(token);
    }
    
    // Fallback to default user if no token or user found
    if (!user) {
      user = {
        id: 'dd97c238-6649-4e31-979b-c9ef12959998',
        email: 'alesierraalta@gmail.com',
        name: 'Alejandro Sierra (ROOT)',
        role: 'USER'
      };
    }

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Allow all authenticated users to view categories for product assignment
    const categories = await db.category.findMany({
      orderBy: {
        name: "asc",
      },
    });
    
    return NextResponse.json(categories || []);
  } catch (error: unknown) {
    console.error("Error fetching categories:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch categories";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create a new category
export async function POST(req: NextRequest) {
  try {
    // Build-time safety check
    const buildResponse = createBuildSafeResponse({ id: 'build-mock', name: 'Mock Category' }, 201);
    if (buildResponse) return buildResponse;

    const token = getTokenFromRequest(req);
    let user = null;
    
    if (token) {
      user = await getCurrentUserFromToken(token);
    }
    
    // Fallback to default user if no token or user found
    if (!user) {
      user = {
        id: 'dd97c238-6649-4e31-979b-c9ef12959998',
        email: 'alesierraalta@gmail.com',
        name: 'Alejandro Sierra (ROOT)',
        role: 'USER'
      };
    }

    // Allow both ADMIN and USER roles to create categories
    if (user.role !== 'ADMIN' && user.role !== 'USER') {
      return NextResponse.json(
        { error: "No tienes permisos para crear categorías" },
        { status: 403 }
      );
    }

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }
    
    const body = await req.json();
    const validatedData = CategorySchema.parse(body);

    const category = await db.category.create({
      data: {
        ...validatedData,
        createdById: user.id,
      },
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