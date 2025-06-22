import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server-only';

/**
 * Choreo-Optimized Login API
 * Specifically designed for production Choreo deployment with admin access
 */
export async function POST(request: NextRequest) {
  console.log('[Choreo Login API] Processing login request');
  
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      console.log('[Choreo Login API] Missing email or password');
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log(`[Choreo Login API] Login attempt for: ${email}`);

    // Use server-safe Supabase client for authentication
    const supabase = supabaseServer;
    
    // Attempt Supabase authentication
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      console.log(`[Choreo Login API] Authentication failed: ${authError?.message}`);
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log(`[Choreo Login API] Supabase authentication successful for: ${email}`);

    // Get user role from database with admin fallback for root user
    let userRole = 'USER';
    let userName = authData.user.user_metadata?.name || email.split('@')[0];
    let isActive = true;

    try {
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select(`
          name, 
          is_active, 
          roles!inner(name)
        `)
        .eq('email', email)
        .single();

      if (!dbError && dbUser) {
        console.log(`[Choreo Login API] Database user found: ${JSON.stringify(dbUser)}`);
        userName = dbUser.name || userName;
        isActive = dbUser.is_active;
        userRole = (dbUser.roles as any)?.name || 'USER';
      } else {
        console.warn(`[Choreo Login API] Database query failed: ${dbError?.message}`);
      }

      // CRITICAL: Admin fallback for root user in Choreo
      if (email === 'alesierraalta@gmail.com') {
        console.log('[Choreo Login API] Applied admin role for root user');
        userRole = 'ADMIN';
        isActive = true;
      }

    } catch (dbError) {
      console.warn(`[Choreo Login API] Database error: ${dbError}`);
      
      // CRITICAL: Admin fallback for root user in Choreo
      if (email === 'alesierraalta@gmail.com') {
        console.log('[Choreo Login API] Applied admin role for root user (fallback)');
        userRole = 'ADMIN';
        isActive = true;
      }
    }

    // Create user object for response
    const user = {
      id: authData.user.id,
      email: authData.user.email,
      name: userName,
      role: userRole,
      isActive: isActive,
      permissions: userRole === 'ADMIN' ? ['read', 'write', 'delete', 'admin'] : ['read']
    };

    console.log(`[Choreo Login API] User object created:`, JSON.stringify(user, null, 2));

    // Create response with session token
    const response = NextResponse.json({
      success: true,
      user: user,
      message: 'Login successful'
    });

    // Set Supabase session cookies for Choreo
    if (authData.session) {
      const maxAge = 7 * 24 * 60 * 60; // 7 days
      
      // Set access token cookie
      response.cookies.set('sb-access-token', authData.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: maxAge,
        path: '/'
      });

      // Set refresh token cookie
      response.cookies.set('sb-refresh-token', authData.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: maxAge,
        path: '/'
      });

      console.log('[Choreo Login API] Session cookies set successfully');
    }

    console.log(`[Choreo Login API] Login completed successfully for: ${email} with role: ${userRole}`);
    return response;

  } catch (error) {
    console.error('[Choreo Login API] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Choreo Login API - Use POST method to authenticate',
    status: 'ready',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
} 