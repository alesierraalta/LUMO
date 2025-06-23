import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromToken, getTokenFromRequest } from '@/lib/auth-simple';

/**
 * Choreo-Optimized Authentication Check API
 * Verifies current user authentication and admin status for Choreo deployment
 * Uses JWT token authentication consistent with login endpoints
 */
export async function GET(request: NextRequest) {
  console.log('🔍 [Choreo Auth Check] Starting authentication verification...');
  
  try {
    // Extract token from request (Authorization header or cookie)
    const token = getTokenFromRequest(request);
    
    console.log('🔍 [Choreo Auth Check] Token extraction:');
    console.log('  - Token found:', !!token);

    if (!token) {
      console.log('❌ [Choreo Auth Check] No authentication token found');
      return NextResponse.json(
        { 
          authenticated: false, 
          user: null, 
          error: 'No authentication token provided' 
        },
        { status: 401 }
      );
    }

    // Get user from token using the same method as other endpoints
    const user = await getCurrentUserFromToken(token);

    if (!user) {
      console.log('❌ [Choreo Auth Check] Invalid or expired token');
      return NextResponse.json(
        { 
          authenticated: false, 
          user: null, 
          error: 'Invalid or expired authentication token' 
        },
        { status: 401 }
      );
    }

    console.log('✅ [Choreo Auth Check] Valid token found');
    console.log('  - User ID:', user.id);
    console.log('  - Email:', user.email);
    console.log('  - Role:', user.role);

    // CRITICAL: Admin fallback for root user in Choreo (additional safety layer)
    let userRole = user.role;
    if (user.email === 'alesierraalta@gmail.com') {
      console.log('🔑 [Choreo Auth Check] Applied admin role for root user');
      userRole = 'ADMIN';
    }

    // Create comprehensive user object with Choreo optimization
    const responseUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: userRole,
      isActive: user.isActive,
      permissions: userRole === 'ADMIN' ? ['read', 'write', 'delete', 'admin'] : ['read'],
      choreoOptimized: true // Flag to indicate this is Choreo-optimized
    };

    console.log('✅ [Choreo Auth Check] User object created:', JSON.stringify(responseUser, null, 2));

    // Return successful authentication response
    const response = NextResponse.json({
      authenticated: true,
      user: responseUser,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });

    console.log(`✅ [Choreo Auth Check] Authentication verified for: ${responseUser.email} with role: ${responseUser.role}`);
    return response;

  } catch (error) {
    console.error('❌ [Choreo Auth Check] Unexpected error:', error);
    return NextResponse.json(
      { 
        authenticated: false, 
        user: null, 
        error: 'Authentication verification failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json({
    message: 'Choreo Authentication Check API - Use GET method to verify authentication',
    status: 'ready',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
} 