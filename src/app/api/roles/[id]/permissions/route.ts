import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromToken, getTokenFromRequest } from '@/lib/auth-server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - Obtener permisos de un rol
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user for authorization
    const token = getTokenFromRequest(request);
    const user = token ? await getCurrentUserFromToken(token) : null;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN and MANAGER can view role permissions
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Obtener permisos del rol
    const { data: rolePermissions, error } = await supabase
      .from('role_permissions')
      .select(`
        permission_id,
        permissions (
          id,
          name,
          resource,
          action,
          category,
          description
        )
      `)
      .eq('role_id', id);

    if (error) {
      console.error('❌ Error fetching role permissions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch role permissions' },
        { status: 500 }
      );
    }

    const permissions = rolePermissions?.map(rp => rp.permissions) || [];

    return NextResponse.json({ 
      success: true,
      permissions 
    });
  } catch (error) {
    console.error('❌ Role permissions GET error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch role permissions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Actualizar permisos de un rol
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user for authorization
    const token = getTokenFromRequest(request);
    const user = token ? await getCurrentUserFromToken(token) : null;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN can update role permissions
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { permissionIds } = await request.json();

    // Eliminar permisos existentes del rol
    const { error: deleteError } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', id);

    if (deleteError) {
      console.error('❌ Error deleting existing permissions:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete existing permissions' },
        { status: 500 }
      );
    }

    // Agregar nuevos permisos
    if (permissionIds && permissionIds.length > 0) {
      const rolePermissionsData = permissionIds.map((permissionId: string) => ({
        role_id: id,
        permission_id: permissionId
      }));

      const { error: insertError } = await supabase
        .from('role_permissions')
        .insert(rolePermissionsData);

      if (insertError) {
        console.error('❌ Error inserting new permissions:', insertError);
        return NextResponse.json(
          { error: 'Failed to assign new permissions' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Permissions updated successfully'
    });
  } catch (error) {
    console.error('❌ Role permissions PUT error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update role permissions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 