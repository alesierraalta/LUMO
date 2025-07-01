import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Role permissions functionality temporarily unavailable during Supabase migration
    return NextResponse.json({
      success: false,
      message: "Role permissions functionality temporarily unavailable during Supabase migration"
    }, { status: 503 });

  } catch (error) {
    console.error("Error managing role permissions:", error);
    return NextResponse.json(
      { error: "Failed to manage role permissions" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Permissions functionality temporarily unavailable during Supabase migration
    return NextResponse.json({
      success: true,
      data: [],
      message: "Permissions functionality temporarily unavailable during Supabase migration"
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
} 