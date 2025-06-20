import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server-client';
import { hasPermission, getRolePermissions, PERMISSIONS } from '@/lib/permissions-client';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Obtener usuario actual
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return NextResponse.json({
        error: 'No authenticated user',
        authError: authError?.message
      }, { status: 401 });
    }

    // Buscar usuario en la base de datos
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', authUser.email)
      .single();

    if (dbError || !dbUser) {
      return NextResponse.json({
        error: 'User not found in database',
        dbError: dbError?.message,
        authUserEmail: authUser.email
      }, { status: 404 });
    }

    // Verificar permisos específicos para el sidebar
    const sidebarPermissions = {
      'users:view': hasPermission(dbUser, 'users:view'),
      'settings:view': hasPermission(dbUser, 'settings:view'),
      'permissions:view': hasPermission(dbUser, 'permissions:view'),
    };

    // Obtener todos los permisos del rol
    const rolePermissions = getRolePermissions(dbUser.role);

    const debugInfo = {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        isActive: dbUser.is_active,
        name: dbUser.name
      },
      sidebarPermissions,
      rolePermissions: rolePermissions.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description
      })),
      allAvailablePermissions: Object.values(PERMISSIONS).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description
      })),
      isAdmin: dbUser.role === 'ADMIN',
      shouldShowUsers: hasPermission(dbUser, 'users:view'),
      shouldShowSettings: hasPermission(dbUser, 'settings:view'),
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error('Debug permissions error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 