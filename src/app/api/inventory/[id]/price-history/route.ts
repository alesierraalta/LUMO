import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/db-supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Since priceHistory table doesn't exist in Supabase, return empty history
    // This maintains API compatibility while the migration is in progress
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