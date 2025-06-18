import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies } from '@/lib/supabase-auth-server';

export async function POST(request: NextRequest) {
  try {
    // Clear auth cookies
    const success = await clearAuthCookies();

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to clear auth cookies' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Supabase logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 