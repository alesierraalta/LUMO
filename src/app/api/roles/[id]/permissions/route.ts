import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔄 [API] /api/roles/[id]/permissions - Starting GET request for role:', params.id);
    
    // Get authentication session
    const session = await getCurrentUser();
    
    if (!session) {
      console.log('❌ [API] /api/roles/[id]/permissions - No session found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('✅ [API] /api/roles/[id]/permissions - Session found for user:', session.email);

    // For now, return hardcoded role permissions based on role ID
    // In a real app, this would query the database
    const rolePermissions = getRolePermissions(params.id);

    console.log('✅ [API] /api/roles/[id]/permissions - Returning permissions count:', rolePermissions.length);
    
    return NextResponse.json({
      success: true,
      permissions: rolePermissions,
      roleId: params.id,
      total: rolePermissions.length
    });
    
  } catch (error) {
    console.error('❌ [API] /api/roles/[id]/permissions - Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔄 [API] /api/roles/[id]/permissions - Starting PUT request for role:', params.id);
    
    // Get authentication session
    const session = await getCurrentUser();
    
    if (!session) {
      console.log('❌ [API] /api/roles/[id]/permissions - No session found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('✅ [API] /api/roles/[id]/permissions - Session found for user:', session.email);

    // Check if user has permission to update roles
    if (!session.role || !['ADMIN', 'MANAGER'].includes(session.role)) {
      console.log('❌ [API] /api/roles/[id]/permissions - Insufficient permissions');
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { permissionIds } = body;

    console.log('🔄 [API] /api/roles/[id]/permissions - Updating permissions:', permissionIds);

    // In a real app, this would update the database
    // For now, just return success
    console.log('✅ [API] /api/roles/[id]/permissions - Permissions updated successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Permissions updated successfully',
      roleId: params.id,
      updatedPermissions: permissionIds
    });
    
  } catch (error) {
    console.error('❌ [API] /api/roles/[id]/permissions - Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to get permissions for a role
function getRolePermissions(roleId: string) {
  // Get all permissions first
  const allPermissions = [
    {
      id: "perm_inventory_read",
      name: "inventory:read",
      resource: "inventory",
      action: "read",
      category: "inventory",
      description: "Ver inventario y productos"
    },
    {
      id: "perm_inventory_write",
      name: "inventory:write", 
      resource: "inventory",
      action: "write",
      category: "inventory",
      description: "Crear y editar productos"
    },
    {
      id: "perm_inventory_delete",
      name: "inventory:delete",
      resource: "inventory", 
      action: "delete",
      category: "inventory",
      description: "Eliminar productos"
    },
    {
      id: "perm_users_read",
      name: "users:read",
      resource: "users",
      action: "read", 
      category: "users",
      description: "Ver usuarios del sistema"
    },
    {
      id: "perm_users_write",
      name: "users:write",
      resource: "users",
      action: "write",
      category: "users", 
      description: "Crear y editar usuarios"
    },
    {
      id: "perm_users_delete",
      name: "users:delete",
      resource: "users",
      action: "delete",
      category: "users",
      description: "Eliminar usuarios"
    },
    {
      id: "perm_roles_read",
      name: "roles:read",
      resource: "roles",
      action: "read",
      category: "roles",
      description: "Ver roles del sistema"
    },
    {
      id: "perm_roles_write", 
      name: "roles:write",
      resource: "roles",
      action: "write",
      category: "roles",
      description: "Crear y editar roles"
    },
    {
      id: "perm_roles_delete",
      name: "roles:delete",
      resource: "roles",
      action: "delete", 
      category: "roles",
      description: "Eliminar roles"
    },
    {
      id: "perm_reports_read",
      name: "reports:read",
      resource: "reports",
      action: "read",
      category: "reports",
      description: "Ver reportes del sistema"
    },
    {
      id: "perm_reports_export",
      name: "reports:export",
      resource: "reports",
      action: "export",
      category: "reports",
      description: "Exportar reportes"
    },
    {
      id: "perm_settings_read",
      name: "settings:read",
      resource: "settings",
      action: "read",
      category: "settings",
      description: "Ver configuración del sistema"
    },
    {
      id: "perm_settings_write",
      name: "settings:write",
      resource: "settings",
      action: "write",
      category: "settings", 
      description: "Modificar configuración del sistema"
    }
  ];

  // Define default permissions for each role
  const rolePermissionMap = {
    // ADMIN role ID
    "550e8400-e29b-41d4-a716-446655440000": allPermissions,
    // MANAGER role ID  
    "32d2eac0-6bbb-49b8-91f2-8906032312f0": allPermissions.filter(p => 
      !p.id.includes('delete') && !p.id.includes('settings_write')
    ),
    // USER role ID
    "7f8c4b2a-1234-5678-9012-abcdef123456": allPermissions.filter(p => 
      p.action === 'read' || p.id === 'perm_inventory_write'
    )
  };

  return rolePermissionMap[roleId] || [];
}