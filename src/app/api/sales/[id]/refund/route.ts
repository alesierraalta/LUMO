import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Sales refund functionality temporarily unavailable during Supabase migration
    return NextResponse.json({
      success: false,
      message: "Sales refund functionality temporarily unavailable during Supabase migration"
    }, { status: 503 });

  } catch (error) {
    console.error("Error processing refund:", error);
    return NextResponse.json(
      { error: "Failed to process refund" },
      { status: 500 }
    );
  }
} 