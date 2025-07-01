import { NextRequest, NextResponse } from "next/server";
import { ensureValidDate } from "@/lib/utils";
import { db } from '@/lib/db-supabase';
import { getCurrentUser, isAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin permissions
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      // Return empty array for unauthorized users
      return NextResponse.json([]);
    }
    
    // Ensure db is available
    if (!db) {
      console.error("Database connection not available");
      return NextResponse.json([]);
    }
    
    // Price history feature temporarily unavailable during Supabase migration
    return NextResponse.json({
      success: true,
      data: [],
      message: "Price history feature temporarily unavailable during Supabase migration"
    });

  } catch (error) {
    console.error("Error fetching price history:", error);
    return NextResponse.json(
      { error: "Failed to fetch price history" },
      { status: 500 }
    );
  }
} 