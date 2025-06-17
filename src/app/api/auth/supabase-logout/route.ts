import { NextRequest, NextResponse } from 'next/server';
import { signOut } from '@/lib/supabase-auth';

export async function POST(request: NextRequest) {
  try {
    // Sign out from Supabase
    const success = await signOut();

    if (!success) {
      return NextResponse.json(
        { error: 'Logout failed' },
        { status: 500 }
      );
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful'
    });

    // Clear the JWT cookies
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
    response.cookies.delete('auth-token'); // Clear old cookie too

    return response;
  } catch (error) {
    console.error('❌ Supabase logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 