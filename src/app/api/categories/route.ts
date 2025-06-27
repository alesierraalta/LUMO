import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// FIXED BUILD DETECTION - Only trigger during actual build, not runtime
const isBuild = (
  process.env.NEXT_PHASE === 'phase-production-build' ||
  (typeof process !== 'undefined' && process.argv && process.argv.some(arg => arg.includes('next build')))
);

// RUNTIME SAFETY: Check for missing configuration but don't treat as build mode
const hasMissingConfig = (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'
);

// ULTRA BUILD-SAFE: Only import during runtime
let db: any = null;
let getCurrentUserFromToken: any = null;
let getTokenFromRequest: any = null;

if (!isBuild) {
  try {
    // Dynamic imports only during runtime
    const dbModule = require("@/lib/db");
    const authModule = require("@/lib/auth-server");
    
    db = dbModule.default;
    getCurrentUserFromToken = authModule.getCurrentUserFromToken;
    getTokenFromRequest = authModule.getTokenFromRequest;
  } catch (error) {
    console.warn('⚠️ Failed to load runtime modules:', error);
  }
}

// Validation schema for category creation
const CategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

// ULTRA BUILD-SAFE response helper
const createBuildSafeResponse = (data: any = [], status: number = 200) => {
  if (isBuild) {
    console.log('🏗️ BUILD MODE: Returning mock response for categories API');
    return NextResponse.json({ success: true, data: [], message: 'Build mode - mock response' }, { status: 200 });
  }
  return NextResponse.json(data, { status });
};

// GET /api/categories - Get all categories
export async function GET(request: NextRequest) {
  // IMMEDIATE BUILD CHECK
  if (isBuild) {
    console.log('🏗️ BUILD MODE: Categories GET bypassed');
    return createBuildSafeResponse([]);
  }

  // Runtime safety checks
  if (!db || !getCurrentUserFromToken || !getTokenFromRequest) {
    console.log('⚠️ Runtime modules not available');
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
  }

  try {
    const token = getTokenFromRequest(request);
    const user = await getCurrentUserFromToken(token);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await db.category.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('❌ Categories GET error:', error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

// POST /api/categories - Create a new category
export async function POST(request: NextRequest) {
  // IMMEDIATE BUILD CHECK
  if (isBuild) {
    console.log('🏗️ BUILD MODE: Categories POST bypassed');
    return createBuildSafeResponse({ id: 'mock-id', name: 'Mock Category' }, 201);
  }

  // Runtime safety checks
  if (!db || !getCurrentUserFromToken || !getTokenFromRequest) {
    console.log('⚠️ Runtime modules not available');
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
  }

  try {
    const token = getTokenFromRequest(request);
    const user = await getCurrentUserFromToken(token);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CategorySchema.parse(body);

    const newCategory = await db.category.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        userId: user.id,
      }
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('❌ Categories POST error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
} 