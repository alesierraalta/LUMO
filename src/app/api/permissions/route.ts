import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 [API] /api/permissions - Starting GET request');
    
    // Get authentication session
    const session = await getCurrentUser();
    
    if (!session) {
      console.log('❌ [API] /api/permissions - No session found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('✅ [API] /api/permissions - Session found for user:', session.user?.email);

    // For now, return hardcoded permissions that match the application structure
    const permissions = [
      // Inventory Management
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
      // User Management
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
      // Role Management
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
      // Reports
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
      // Settings
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

    console.log('✅ [API] /api/permissions - Returning permissions count:', permissions.length);
    
    return NextResponse.json({
      success: true,
      permissions: permissions,
      total: permissions.length
    });
    
  } catch (error) {
    console.error('❌ [API] /api/permissions - Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}