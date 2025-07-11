import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getTokenFromRequest, getCurrentUserFromToken } from '@/lib/auth-server';
import { createServerClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  console.log('🔔 Users Create Temp API: Starting...');
  
  try {
    // Get user from token or session
    const token = getTokenFromRequest(request);
    const user = token ? await getCurrentUserFromToken(token) : await getCurrentUser();
    
    if (!user) {
      console.log('❌ Users Create Temp API: Unauthorized - no user found');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only ADMIN can create users
    if (user.role !== 'ADMIN') {
      console.log('❌ Users Create Temp API: Forbidden - user role:', user.role);
      return NextResponse.json(
        { success: false, error: 'Only administrators can create users' },
        { status: 403 }
      );
    }

    const data = await request.json();
    console.log('🔔 Users Create Temp API: Request data:', { ...data, password: '[REDACTED]' });
    
    const { name, email, password, roleId } = data;
    if (!name || !email || !password || !roleId) {
      console.log('❌ Users Create Temp API: Missing required fields');
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    
    // For now, just create the user profile without Supabase Auth
    // The user will need to use "Forgot Password" to set their password
    console.log('🔔 Users Create Temp API: Creating user profile without auth...');
    
    // Generate a temporary ID (in production, this should be handled differently)
    const tempUserId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { data: newUser, error: dbError } = await supabase
      .from('users')
      .insert({
        id: tempUserId,
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
        role:roles(id, name, description)
      `)
      .single();

    if (dbError) {
      console.error('❌ Users Create Temp API: Database error:', dbError);
      return NextResponse.json(
        { 
          success: false, 
          error: dbError.message || 'Failed to create user profile' 
        },
        { status: 500 }
      );
    }

    console.log('✅ Users Create Temp API: User profile created:', newUser);

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
      },
      warning: 'User created without authentication. They will need to use "Forgot Password" to set their password.'
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Users Create Temp API: Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create user' 
      },
      { status: 500 }
    );
  }
}