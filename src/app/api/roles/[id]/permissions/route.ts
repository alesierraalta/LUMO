import { NextRequest, NextResponse } from 'next/server';
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
      console.error('Error fetching role permissions:', error);
      return NextResponse.json(
        { error: 'Error al obtener permisos del rol' },
        { status: 500 }
      );
    }

    const permissions = rolePermissions?.map(rp => rp.permissions) || [];

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error('Role permissions GET error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
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
    const { id } = await params;
    const { permissionIds } = await request.json();

    // Eliminar permisos existentes del rol
    const { error: deleteError } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', id);

    if (deleteError) {
      console.error('Error deleting existing permissions:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar permisos existentes' },
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
        console.error('Error inserting new permissions:', insertError);
        return NextResponse.json(
          { error: 'Error al asignar nuevos permisos' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ 
      message: 'Permisos actualizados correctamente',
      success: true 
    });
  } catch (error) {
    console.error('Role permissions PUT error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 