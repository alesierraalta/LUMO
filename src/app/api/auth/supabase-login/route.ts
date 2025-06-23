/**
 * Supabase-Only Login Endpoint
 * NO JWT, NO LEGACY FALLBACKS - ONLY SUPABASE
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server-only';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [Supabase Login] Starting Supabase-only login...');
    
    const { email, password } = await request.json();
    
    if (!email || !password) {
      console.log('❌ [Supabase Login] Missing email or password');
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log(`🔍 [Supabase Login] Login attempt for: ${email}`);
    
    // Use Supabase authentication
    const supabase = supabaseServer;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      console.log(`❌ [Supabase Login] Authentication failed: ${error?.message}`);
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log(`✅ [Supabase Login] Supabase authentication successful for: ${email}`);
    
    // Get user role from database
    let userRole = 'USER';
    let userName = data.user.user_metadata?.name || email.split('@')[0];
    
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
        userName = dbUser.name || userName;
        userRole = (dbUser.roles as any)?.name || 'USER';
      } else {
        // For alesierraalta@gmail.com, default to ADMIN role
        if (email === 'alesierraalta@gmail.com') {
          console.log('🔑 [Supabase Login] Applied admin role for root user');
          userRole = 'ADMIN';
        }
      }
    } catch (dbError) {
      console.warn('❌ [Supabase Login] Database query failed:', dbError);
      // For alesierraalta@gmail.com, default to ADMIN role
      if (email === 'alesierraalta@gmail.com') {
        console.log('🔑 [Supabase Login] Applied admin role for root user (fallback)');
        userRole = 'ADMIN';
      }
    }

    const user = {
      id: data.user.id,
      email: data.user.email,
      name: userName,
      role: userRole,
      isActive: true,
      permissions: userRole === 'ADMIN' ? ['read', 'write', 'delete', 'admin'] : ['read']
    };

    console.log(`✅ [Supabase Login] Login completed successfully for: ${email} with role: ${userRole}`);
    
    return NextResponse.json({
      success: true,
      user: user,
      session: data.session,
      message: 'Supabase login successful'
    });

  } catch (error) {
    console.error('❌ [Supabase Login] Unexpected error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Login failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 