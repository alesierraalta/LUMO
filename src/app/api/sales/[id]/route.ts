import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-supabase';
import { getCurrentUserFromToken, getTokenFromRequest } from '@/lib/auth-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Sales details functionality temporarily unavailable during Supabase migration
    return NextResponse.json({
      success: false,
      message: "Sales details functionality temporarily unavailable during Supabase migration"
    }, { status: 503 });

  } catch (error) {
    console.error("Error fetching sale:", error);
    return NextResponse.json(
      { error: "Failed to fetch sale" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Sales deletion functionality temporarily unavailable during Supabase migration
    return NextResponse.json({
      success: false,
      message: "Sales deletion functionality temporarily unavailable during Supabase migration"
    }, { status: 503 });

  } catch (error) {
    console.error("Error deleting sale:", error);
    return NextResponse.json(
      { error: "Failed to delete sale" },
      { status: 500 }
    );
  }
} 