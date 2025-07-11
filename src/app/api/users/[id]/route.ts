import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getTokenFromRequest, getCurrentUserFromToken } from '@/lib/auth-server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    console.log('🔔 Users GET [id] API: Starting for user:', id);
    
    // Development mode fallback - check for development mode header
    const isDevelopmentMode = request.headers.get('X-Development-Mode') === 'true';
    console.log('🔔 Users GET [id] API: Development mode:', isDevelopmentMode);
    
    let user = null;
    
    if (isDevelopmentMode && process.env.NODE_ENV === 'development') {
      console.log('🔧 Users GET [id] API: Using development mode fallback');
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
        console.log('❌ Users GET [id] API: Unauthorized - no user found');
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    console.log('✅ Users GET [id] API: User authenticated:', user.role);

    const supabase = await createServerClient();
    
    // Get specific user with their role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        is_active,
        created_at,
        updated_at,
        role:roles(id, name, description)
      `)
      .eq('id', id)
      .single();

    if (userError) {
      console.error('❌ Users GET [id] API: Database error:', userError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user', details: userError },
        { status: 500 }
      );
    }

    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ Users GET [id] API: User found:', userData.id);

    // Transform the user data to match the expected format
    const transformedUser = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      isActive: userData.is_active,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at,
      role: userData.role
    };

    return NextResponse.json({
      success: true,
      user: transformedUser
    });
  } catch (error) {
    console.error('❌ Users GET [id] API: Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    console.log('🔔 Users PUT [id] API: Starting for user:', id);
    
    // Development mode fallback - check for development mode header
    const isDevelopmentMode = request.headers.get('X-Development-Mode') === 'true';
    console.log('🔔 Users PUT [id] API: Development mode:', isDevelopmentMode);
    
    let user = null;
    
    if (isDevelopmentMode && process.env.NODE_ENV === 'development') {
      console.log('🔧 Users PUT [id] API: Using development mode fallback');
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
        console.log('❌ Users PUT [id] API: Unauthorized - no user found');
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Only ADMIN can update users
      if (user.role !== 'ADMIN') {
        console.log('❌ Users PUT [id] API: Forbidden - user role:', user.role);
        return NextResponse.json(
          { success: false, error: 'Only administrators can update users' },
          { status: 403 }
        );
      }
    }

    console.log('✅ Users PUT [id] API: User authenticated:', user.role);

    const data = await request.json();
    console.log('🔔 Users PUT [id] API: Request data:', data);
    
    const { name, email, roleId, isActive } = data;

    const supabase = await createServerClient();
    
    // Update user profile
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        name,
        email,
        role_id: roleId,
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
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

    if (updateError) {
      console.error('❌ Users PUT [id] API: Database error:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: updateError.message || 'Failed to update user'
        },
        { status: 500 }
      );
    }

    console.log('✅ Users PUT [id] API: User updated successfully:', updatedUser);

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        isActive: updatedUser.is_active,
        createdAt: updatedUser.created_at,
        updatedAt: updatedUser.updated_at,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('❌ Users PUT [id] API: Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    console.log('🔔 Users DELETE [id] API: Starting for user:', id);
    
    // Development mode fallback - check for development mode header
    const isDevelopmentMode = request.headers.get('X-Development-Mode') === 'true';
    console.log('🔔 Users DELETE [id] API: Development mode:', isDevelopmentMode);
    
    let user = null;
    
    if (isDevelopmentMode && process.env.NODE_ENV === 'development') {
      console.log('🔧 Users DELETE [id] API: Using development mode fallback');
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
        console.log('❌ Users DELETE [id] API: Unauthorized - no user found');
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Only ADMIN can delete users
      if (user.role !== 'ADMIN') {
        console.log('❌ Users DELETE [id] API: Forbidden - user role:', user.role);
        return NextResponse.json(
          { success: false, error: 'Only administrators can delete users' },
          { status: 403 }
        );
      }
    }

    console.log('✅ Users DELETE [id] API: User authenticated:', user.role);

    // Prevent self-deletion
    if (user.id === id) {
      console.log('❌ Users DELETE [id] API: Cannot delete self');
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    
    // Delete user from database
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ Users DELETE [id] API: Database error:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: deleteError.message || 'Failed to delete user'
        },
        { status: 500 }
      );
    }

    console.log('✅ Users DELETE [id] API: User deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('❌ Users DELETE [id] API: Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete user'
      },
      { status: 500 }
    );
  }
}