import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromToken, getTokenFromRequest } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Auth - Starting authentication check...');
    
    // Check cookies
    const cookies = request.cookies;
    console.log('🍪 Available cookies:', Array.from(cookies.getAll()).map(c => c.name));
    
    // Try to get token
    const token = getTokenFromRequest(request);
    console.log('🔑 Token found:', !!token, token ? `Length: ${token.length}` : 'No token');
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'No authentication token found',
        debug: {
          hasCookies: cookies.getAll().length > 0,
          cookieNames: Array.from(cookies.getAll()).map(c => c.name),
          headers: Object.fromEntries(request.headers.entries()),
          url: request.url
        }
      });
    }
    
    // Try to get user from token
    const user = await getCurrentUserFromToken(token);
    console.log('👤 User found:', !!user, user ? `Role: ${user.role}` : 'No user');
    
    return NextResponse.json({
      success: true,
      authenticated: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive
      } : null,
      debug: {
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 10) + '...',
        cookieNames: Array.from(cookies.getAll()).map(c => c.name),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Debug Auth error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        timestamp: new Date().toISOString(),
        error: error
      }
    });
  }
} 