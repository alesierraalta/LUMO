import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getTokenFromRequest, getCurrentUserFromToken } from '@/lib/auth-server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔔 Users GET API: Starting...');
    
    // Development mode fallback - check for development mode header
    const isDevelopmentMode = request.headers.get('X-Development-Mode') === 'true';
    console.log('🔔 Users GET API: Development mode:', isDevelopmentMode);
    
    let user = null;
    
    if (isDevelopmentMode && process.env.NODE_ENV === 'development') {
      console.log('🔧 Users GET API: Using development mode fallback');
      // In development mode, create a mock admin user
      user = {
        id: 'dev-admin',
        email: 'admin@dev.local',
        role: 'ADMIN',
        name: 'Development Admin'
      };
    } else {
      // Get user from token or session
      const token = getTokenFromRequest(request);
      user = token ? await getCurrentUserFromToken(token) : await getCurrentUser();
      
      if (!user) {
        console.log('❌ Users GET API: Unauthorized - no user found');
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    console.log('✅ Users GET API: User authenticated:', user.role);

    const supabase = await createServerClient();
    
    
    // Simple query to get all users
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name, email, is_active, created_at, updated_at, role_id')
      .order('name', { ascending: true });

    if (userError) {
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users', details: userError },
        { status: 500 }
      );
    }

    

    // Get roles separately
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('id, name, description');

    if (rolesError) {
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch roles', details: rolesError },
        { status: 500 }
      );
    }

    

    // Combine users with their roles
    const usersWithRoles = users?.map(user => {
      const role = roles?.find(r => r.id === user.role_id);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        role: role ? { id: role.id, name: role.name, description: role.description } : null
      };
    }) || [];

    

    return NextResponse.json({
      success: true,
      users: usersWithRoles,
      total: usersWithRoles.length,
      limit: 50,
      offset: 0
    });
  } catch (error) {
    
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('🔔 Users POST API: Starting...');
  
  try {
    // Check if SUPABASE_SERVICE_ROLE_KEY is available
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('🔔 Users POST API: Service role key available:', hasServiceKey);
    
    if (!hasServiceKey) {
      console.error('❌ CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing!');
      return NextResponse.json(
        {
          success: false,
          error: 'Server configuration error: Unable to create users. Please contact administrator.',
          details: 'SUPABASE_SERVICE_ROLE_KEY is not configured in environment variables.'
        },
        { status: 503 } // Service Unavailable
      );
    }
    
    // Development mode fallback - check for development mode header
    const isDevelopmentMode = request.headers.get('X-Development-Mode') === 'true';
    console.log('🔔 Users POST API: Development mode:', isDevelopmentMode);
    
    let user = null;
    
    if (isDevelopmentMode && process.env.NODE_ENV === 'development') {
      console.log('🔧 Users POST API: Using development mode fallback');
      // In development mode, create a mock admin user
      user = {
        id: 'dev-admin',
        email: 'admin@dev.local',
        role: 'ADMIN',
        name: 'Development Admin'
      };
    } else {
      // Get user from token or session
      const token = getTokenFromRequest(request);
      user = token ? await getCurrentUserFromToken(token) : await getCurrentUser();
      
      if (!user) {
        console.log('❌ Users POST API: Unauthorized - no user found');
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Only ADMIN can create users
      if (user.role !== 'ADMIN') {
        console.log('❌ Users POST API: Forbidden - user role:', user.role);
        return NextResponse.json(
          { success: false, error: 'Only administrators can create users' },
          { status: 403 }
        );
      }
    }

    console.log('✅ Users POST API: User authenticated:', user.role);

    const data = await request.json();
    console.log('🔔 Users POST API: Request data:', { ...data, password: '[REDACTED]' });
    
    const { name, email, password, roleId } = data;
    if (!name || !email || !password || !roleId) {
      console.log('❌ Users POST API: Missing required fields');
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    
    let authUserId;
    let newUser;
    
    if (isDevelopmentMode && process.env.NODE_ENV === 'development') {
      // Development mode: Skip Supabase Auth and use mock user creation
      console.log('🔧 Users POST API: Development mode - skipping Supabase Auth');
      
      // Generate a proper UUID for development user
      const { randomUUID } = require('crypto');
      authUserId = randomUUID();
      console.log('🔧 Generated development user ID:', authUserId);
      
      // Create user profile directly in database
      console.log('🔔 Users POST API: Creating development user profile...');
      const { data: devUser, error: dbError } = await supabase
        .from('users')
        .insert({
          id: authUserId,
          name: name,
          email: email,
          password: 'dev-placeholder-password', // Placeholder for development mode
          role_id: roleId,
          is_active: data.isActive !== false
        })
        .select(`
          id,
          name,
          email,
          is_active,
          created_at,
          updated_at,
          role_id
        `)
        .single();

      if (dbError) {
        console.error('❌ Users POST API: Database error:', dbError);
        return NextResponse.json(
          {
            success: false,
            error: dbError.message || 'Failed to create user profile'
          },
          { status: 500 }
        );
      }
      
      // Get role information separately for development mode
      if (devUser && roleId) {
        const { data: roleData } = await supabase
          .from('roles')
          .select('id, name, description')
          .eq('id', roleId)
          .single();
        
        newUser = {
          ...devUser,
          role: roleData || null
        };
      } else {
        newUser = devUser;
      }
      
      console.log('✅ Users POST API: Development user created successfully:', newUser);
      
    } else {
      // Production mode: Use Supabase Auth
      console.log('🔔 Users POST API: Production mode - creating user in Supabase Auth...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: { name: name },
          emailRedirectTo: undefined // Disable email confirmation for admin-created users
        }
      });

      if (authError) {
        console.error('❌ Users POST API: Supabase Auth error:', authError);
        return NextResponse.json(
          {
            success: false,
            error: authError.message || 'Failed to create authentication account'
          },
          { status: 400 }
        );
      }

      if (!authData || !authData.user || !authData.user.id) {
        console.error('❌ Users POST API: Auth user creation failed - no user returned');
        console.log('🔍 Auth response data:', authData);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to create authentication account - no user returned'
          },
          { status: 500 }
        );
      }

      console.log('✅ Users POST API: Auth user created:', authData.user.id);
      authUserId = authData.user.id;
      
      // Then create the user profile in our users table
      console.log('🔔 Users POST API: Creating user profile...');
      const { data: prodUser, error: dbError } = await supabase
        .from('users')
        .insert({
          id: authUserId,
          name: name,
          email: email,
          role_id: roleId,
          is_active: data.isActive !== false
        })
        .select(`
          id,
          name,
          email,
          is_active,
          created_at,
          updated_at,
          role_id
        `)
        .single();

      if (dbError) {
        console.error('❌ Users POST API: Database error:', dbError);
        
        // If database insert fails, try to clean up the auth user
        if (authData.user?.id) {
          console.log('🔔 Users POST API: Attempting to delete auth user after DB error...');
          // Note: Admin API needed to delete users, for now just log the error
        }
        
        return NextResponse.json(
          {
            success: false,
            error: dbError.message || 'Failed to create user profile'
          },
          { status: 500 }
        );
      }
      
      // Get role information separately for production mode
      if (prodUser && roleId) {
        const { data: roleData } = await supabase
          .from('roles')
          .select('id, name, description')
          .eq('id', roleId)
          .single();
        
        newUser = {
          ...prodUser,
          role: roleData || null
        };
      } else {
        newUser = prodUser;
      }
      
      console.log('✅ Users POST API: Production user created successfully:', newUser);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        isActive: newUser.is_active,
        createdAt: newUser.created_at,
        updatedAt: newUser.updated_at,
        role: newUser.role
      }
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Users POST API: Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create user'
      },
      { status: 500 }
    );
  }
}