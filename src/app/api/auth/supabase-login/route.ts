import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookie } from '@/lib/supabase-auth-server';

export async function POST(request: NextRequest) {
  try {
    const { access_token, refresh_token } = await request.json();
    
    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { error: 'Missing access_token or refresh_token' },
        { status: 400 }
      );
    }
    
    // Set secure HTTP-only cookies
    const success = await setAuthCookie(access_token, refresh_token);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to set auth cookies' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Supabase login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 