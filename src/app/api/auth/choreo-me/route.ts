import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server-only';

/**
 * Choreo-Optimized Authentication Check API
 * Verifies current user authentication and admin status for Choreo deployment
 */
export async function GET(request: NextRequest) {
  console.log('🔍 [Choreo Auth Check] Starting authentication verification...');
  
  try {
    // Extract tokens from various possible sources
    const authHeader = request.headers.get('authorization');
    const accessToken = request.cookies.get('sb-access-token')?.value ||
                       request.cookies.get('supabase-auth-token')?.value ||
                       request.cookies.get('sb-ndprriqyhddjoixrlqnz-auth-token')?.value ||
                       request.cookies.get('sb-ubjujxtvlubxowsphvuk-auth-token')?.value;

    console.log('🔍 [Choreo Auth Check] Token sources checked:');
    console.log('  - Authorization header:', !!authHeader);
    console.log('  - Access token cookie:', !!accessToken);

    // Use server-safe Supabase client
    const supabase = supabaseServer;

    // Try to get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('🔍 [Choreo Auth Check] Session check result:');
    console.log('  - Error:', sessionError?.message || 'none');
    console.log('  - Session exists:', !!session);
    console.log('  - User exists:', !!session?.user);

    if (!session?.user) {
      console.log('❌ [Choreo Auth Check] No valid session found');
      return NextResponse.json(
        { 
          authenticated: false, 
          user: null, 
          error: 'No valid authentication session' 
        },
        { status: 401 }
      );
    }

    console.log('✅ [Choreo Auth Check] Valid session found');
    console.log('  - User ID:', session.user.id);
    console.log('  - Email:', session.user.email);

    // Get user data from database with admin role detection
    let userRole = 'USER';
    let userName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User';
    let isActive = true;

    try {
      console.log('🔍 [Choreo Auth Check] Querying database for user data...');
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select(`
          name, 
          is_active, 
          roles!inner(name, description)
        `)
        .eq('email', session.user.email)
        .single();

      if (!dbError && dbUser) {
        console.log('✅ [Choreo Auth Check] Database query successful');
        console.log('  - DB User:', JSON.stringify(dbUser, null, 2));
        userName = dbUser.name || userName;
        isActive = dbUser.is_active;
        userRole = (dbUser.roles as any)?.name || 'USER';
      } else {
        console.warn('⚠️ [Choreo Auth Check] Database query failed:', dbError?.message);
      }

      // CRITICAL: Admin fallback for root user in Choreo
      if (session.user.email === 'alesierraalta@gmail.com') {
        console.log('🔑 [Choreo Auth Check] Applied admin role for root user');
        userRole = 'ADMIN';
        isActive = true;
      }

    } catch (dbError) {
      console.warn('❌ [Choreo Auth Check] Database query error:', dbError);
      
      // CRITICAL: Admin fallback for root user in Choreo
      if (session.user.email === 'alesierraalta@gmail.com') {
        console.log('🔑 [Choreo Auth Check] Applied admin role for root user (fallback)');
        userRole = 'ADMIN';
        isActive = true;
      }
    }

    // Create comprehensive user object
    const user = {
      id: session.user.id,
      email: session.user.email,
      name: userName,
      role: userRole,
      isActive: isActive,
      permissions: userRole === 'ADMIN' ? ['read', 'write', 'delete', 'admin'] : ['read'],
      emailConfirmed: !!session.user.email_confirmed_at,
      lastSignIn: session.user.last_sign_in_at,
      choreoOptimized: true // Flag to indicate this is Choreo-optimized
    };

    console.log('✅ [Choreo Auth Check] User object created:', JSON.stringify(user, null, 2));

    // Return successful authentication response
    const response = NextResponse.json({
      authenticated: true,
      user: user,
      session: {
        accessToken: !!session.access_token,
        refreshToken: !!session.refresh_token,
        expiresAt: session.expires_at,
        expiresIn: session.expires_in
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });

    // Ensure session cookies are properly set for Choreo
    if (session.access_token) {
      const maxAge = 7 * 24 * 60 * 60; // 7 days
      
      response.cookies.set('sb-access-token', session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: maxAge,
        path: '/'
      });

      if (session.refresh_token) {
        response.cookies.set('sb-refresh-token', session.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: maxAge,
          path: '/'
        });
      }
    }

    console.log(`✅ [Choreo Auth Check] Authentication verified for: ${user.email} with role: ${user.role}`);
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