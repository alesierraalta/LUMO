import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase-auth-server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [/api/auth/supabase-me] Starting authentication check');
    
    const user = await getServerUser();
    
    if (!user) {
      console.log('❌ [/api/auth/supabase-me] No user found');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    console.log('✅ [/api/auth/supabase-me] User authenticated successfully:', user.email);
    
    // Return user data in our expected format
    const userData = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split('@')[0] || '',
      role: user.user_metadata?.role || 'USER',
      isActive: user.user_metadata?.isActive !== false,
      permissions: user.user_metadata?.permissions || []
    };
    
    return NextResponse.json(userData);
  } catch (error) {
    console.error('❌ [/api/auth/supabase-me] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 