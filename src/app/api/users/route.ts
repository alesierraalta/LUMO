import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getTokenFromRequest, getCurrentUserFromToken } from '@/lib/auth-server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    
    
    // Get user from token or session
    const token = getTokenFromRequest(request);
    const user = token ? await getCurrentUserFromToken(token) : await getCurrentUser();
    
    if (!user) {
      
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    

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
    
  try {
    // Get user from token or session
    const token = getTokenFromRequest(request);
    const user = token ? await getCurrentUserFromToken(token) : await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const supabase = await createServerClient();
    
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        name: data.name,
        email: data.email,
        password: data.password, // This should be hashed
        role_id: data.roleId,
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

    if (error) {
      
      return NextResponse.json(
        { success: false, error: 'Failed to create user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: newUser
    }, { status: 201 });
  } catch (error) {
    
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
} 