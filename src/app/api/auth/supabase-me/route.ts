import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase-auth';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [/api/auth/supabase-me] Starting Supabase authentication check');
    
    const user = await getServerUser();
    
    if (!user) {
      console.log('❌ [/api/auth/supabase-me] No user found');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    console.log('✅ [/api/auth/supabase-me] User authenticated successfully:', user.email);
    
    return NextResponse.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('❌ [/api/auth/supabase-me] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 