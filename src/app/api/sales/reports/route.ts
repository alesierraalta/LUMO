import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/db-supabase';

export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Sales reports functionality temporarily unavailable during Supabase migration
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalSales: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          salesCount: 0
        },
        topProducts: [],
        dailySales: [],
        monthlySales: []
      },
      message: "Sales reports functionality temporarily unavailable during Supabase migration"
    });

  } catch (error) {
    console.error("Error generating sales reports:", error);
    return NextResponse.json(
      { error: "Failed to generate sales reports" },
      { status: 500 }
    );
  }
} 