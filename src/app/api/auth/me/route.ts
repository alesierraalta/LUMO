import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromToken, getTokenFromRequest } from '@/lib/auth-simple';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [/api/auth/me] Starting authentication check');
    
    // Get token from request
    const token = getTokenFromRequest(request);
    console.log('🔍 [/api/auth/me] Token found:', !!token);
    
    if (!token) {
      console.log('❌ [/api/auth/me] No token provided');
      return NextResponse.json(
        { success: false, error: 'No authentication token provided' },
        { status: 401 }
      );
    }

    // Get current user from token
    console.log('🔍 [/api/auth/me] Getting user from token...');
    const user = await getCurrentUserFromToken(token);
    
    if (!user) {
      console.log('❌ [/api/auth/me] Invalid or expired token');
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    console.log('✅ [/api/auth/me] User authenticated successfully:', user.email);
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('❌ [/api/auth/me] Authentication error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Authentication failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 