import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromToken, getTokenFromRequest } from '@/lib/auth-simple';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [/api/auth/me] Starting authentication check');
    
    // Log all cookies and headers for debugging
    const cookies = request.cookies.getAll();
    const authHeader = request.headers.get('authorization');
    console.log('🍪 [/api/auth/me] Available cookies:', cookies.map(c => ({ name: c.name, hasValue: !!c.value })));
    console.log('🔐 [/api/auth/me] Authorization header:', authHeader ? 'Present' : 'Not present');
    
    // Get token from request
    const token = getTokenFromRequest(request);
    console.log('🎫 [/api/auth/me] Token extracted:', token ? 'YES' : 'NO');
    
    if (!token) {
      console.log('❌ [/api/auth/me] No authentication token provided');
      return NextResponse.json(
        { error: 'No authentication token provided' },
        { status: 401 }
      );
    }

    console.log('🔍 [/api/auth/me] Calling getCurrentUserFromToken...');
    // Get current user from token
    const user = await getCurrentUserFromToken(token);
    console.log('👤 [/api/auth/me] User found:', user ? 'YES' : 'NO');

    if (!user) {
      console.log('❌ [/api/auth/me] Invalid or expired token');
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    console.log('✅ [/api/auth/me] Authentication successful for user:', user.id);
    // Return user information
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      }
    });

  } catch (error) {
    console.error('💥 [/api/auth/me] Get current user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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