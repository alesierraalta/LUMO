import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getTokenFromRequest, getCurrentUserFromToken } from '@/lib/auth-server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get user from token or session
    const token = getTokenFromRequest(request);
    const currentUser = token ? await getCurrentUserFromToken(token) : await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createServerClient();
    
    // First check if user exists
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        is_active,
        created_at,
        updated_at,
        role:roles(id, name)
      `)
      .eq('id', id)
      .single();

    if (error && error.code === 'PGRST116') {
      // User not found
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user' },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Now check permissions after confirming user exists
    // Handle both role formats: string ('ADMIN') and object ({ name: 'ADMIN' })
    const userRole = typeof currentUser.role === 'string' ? currentUser.role : currentUser.role?.name;
    if (userRole !== 'ADMIN' && currentUser.id !== id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Transform the response to match frontend expectations
    const transformedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      role: user.role
    };

    return NextResponse.json({
      success: true,
      user: transformedUser
    });

  } catch (error) {
    console.error('Error in GET /api/users/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get user from token or session
    const token = getTokenFromRequest(request);
    const currentUser = token ? await getCurrentUserFromToken(token) : await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can update other users, users can update themselves
    // Handle both role formats: string ('ADMIN') and object ({ name: 'ADMIN' })
    const userRole = typeof currentUser.role === 'string' ? currentUser.role : currentUser.role?.name;
    if (userRole !== 'ADMIN' && currentUser.id !== id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, isActive, role } = body;

    const supabase = await createServerClient();
    
    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email.toLowerCase();
    if (isActive !== undefined) updateData.is_active = isActive;

    // Only admins can change roles
    if (role !== undefined && userRole === 'ADMIN') {
      // First, get the role ID
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', role)
        .single();

      if (roleError || !roleData) {
        return NextResponse.json(
          { success: false, error: 'Invalid role specified' },
          { status: 400 }
        );
      }

      updateData.role_id = roleData.id;
    }

    // Check if email is already taken (if email is being updated)
    if (email !== undefined) {
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .neq('id', id);

      if (checkError) {
        console.error('Error checking email:', checkError);
        return NextResponse.json(
          { success: false, error: 'Failed to validate email' },
          { status: 500 }
        );
      }

      if (existingUsers && existingUsers.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    // Update the user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        name,
        email,
        is_active,
        created_at,
        updated_at,
        role:roles(id, name)
      `)
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // Transform the response
    const transformedUser = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      isActive: updatedUser.is_active,
      createdAt: updatedUser.created_at,
      updatedAt: updatedUser.updated_at,
      role: updatedUser.role
    };

    return NextResponse.json({
      success: true,
      user: transformedUser
    });

  } catch (error) {
    console.error('Error in PATCH /api/users/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🗑️ DELETE request for user:', id);
    
    // Get user from token or session
    const token = getTokenFromRequest(request);
    console.log('🔍 Token extracted:', token ? 'YES' : 'NO', token?.substring(0, 20) + '...');
    const currentUser = token ? await getCurrentUserFromToken(token) : await getCurrentUser();
    console.log('🔍 Current user:', currentUser);
    console.log('🔍 Auth functions:', {
      getTokenFromRequest: typeof getTokenFromRequest,
      getCurrentUserFromToken: typeof getCurrentUserFromToken,
      getCurrentUser: typeof getCurrentUser
    });
    
    if (!currentUser) {
      console.log('❌ No current user found');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // FIXED: Better role detection
    const isAdmin = (
      currentUser.role?.name === 'ADMIN' || 
      currentUser.role === 'ADMIN' || 
      currentUser.permissions?.includes('admin')
    );
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    console.log('🔍 Permission check:', { 
      isAdmin, 
      isDevelopment, 
      userRole: currentUser.role?.name || currentUser.role,
      userId: currentUser.id,
      permissions: currentUser.permissions 
    });
    
    if (!isAdmin && !isDevelopment) {
      console.log('❌ User is not admin and not in development mode');
      return NextResponse.json(
        { success: false, error: 'Forbidden - Only admins can delete users' },
        { status: 403 }
      );
    }

    // Prevent self-deletion
    if (currentUser.id === id) {
      console.log('❌ User trying to delete themselves');
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    
    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, name, role:roles(name)')
      .eq('id', id)
      .single();

    if (checkError || !existingUser) {
      console.log('❌ User not found:', checkError);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ User found, proceeding with deletion:', existingUser.name);

    // Check if this is the last admin user (only in production)
    if (existingUser.role?.name === 'ADMIN' && !isDevelopment) {
      const { data: adminUsers, error: countError } = await supabase
        .from('users')
        .select('id')
        .eq('role.name', 'ADMIN')
        .eq('is_active', true);

      if (countError) {
        console.error('Error counting admin users:', countError);
        return NextResponse.json(
          { success: false, error: 'Failed to validate deletion' },
          { status: 500 }
        );
      }

      if ((adminUsers?.length || 0) <= 1) {
        return NextResponse.json(
          { success: false, error: 'Cannot delete the last admin user' },
          { status: 400 }
        );
      }
    }

    // FIXED: Handle foreign key constraints - Update related records first
    try {
      console.log('🔄 Updating related records before deletion...');
      
      // Update categories to remove the user reference
      const { error: categoriesError } = await supabase
        .from('categories')
        .update({ created_by_id: null })
        .eq('created_by_id', id);
      
      if (categoriesError) {
        console.warn('⚠️ Warning updating categories:', categoriesError);
        // Continue anyway - we'll try to handle this gracefully
      }

      // Update inventory items to remove the user reference
      const { error: inventoryError } = await supabase
        .from('inventory_items')
        .update({ created_by_id: null })
        .eq('created_by_id', id);
      
      if (inventoryError) {
        console.warn('⚠️ Warning updating inventory:', inventoryError);
      }

      // Update any other tables that might reference this user (only if they have created_by_id column)
      try {
      const { error: locationsError } = await supabase
        .from('locations')
        .update({ created_by_id: null })
        .eq('created_by_id', id);
      
      if (locationsError) {
          // If the column doesn't exist, that's fine - just log and continue
          if (locationsError.message?.includes("Could not find the 'created_by_id' column")) {
            console.log('ℹ️ Locations table does not have created_by_id column - skipping');
          } else {
        console.warn('⚠️ Warning updating locations:', locationsError);
          }
        }
      } catch (locationsUpdateError) {
        console.log('ℹ️ Skipping locations update - column may not exist');
      }

      console.log('✅ Related records updated successfully');

    } catch (relationError) {
      console.warn('⚠️ Warning handling related records:', relationError);
      // Continue with deletion attempt
    }

    // Delete the user
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ Error deleting user:', deleteError);
      
      // If it's still a foreign key constraint error, provide helpful message
      if (deleteError.message?.includes('foreign key constraint')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Cannot delete user: User has associated records. Please reassign or delete related data first.' 
          },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    console.log('✅ User deleted successfully');
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error in DELETE /api/users/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 