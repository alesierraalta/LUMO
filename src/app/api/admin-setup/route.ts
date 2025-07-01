import { NextRequest, NextResponse } from 'next/server';
// import db from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { email, password, action } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // TEMPORARILY DISABLED: Supabase migration in progress
    // This endpoint needs to be updated to work with Supabase auth system
    return NextResponse.json(
      { 
        error: 'Admin setup temporalmente deshabilitado durante migración a Supabase',
        message: 'Use la consola de Supabase para configurar usuarios administradores'
      },
      { status: 503 }
    );

    /*
    // Original Prisma code - needs Supabase equivalent
    if (action === 'create') {
      // Verificar si el usuario ya existe
      const adminUser = await db.user.findUnique({
        where: { email },
      });

      if (adminUser) {
        // Buscar o crear rol de administrador
        let adminRole = await db.role.findUnique({
          where: { name: 'ADMIN' },
        });

        if (!adminRole) {
          adminRole = await db.role.create({
            data: {
              name: 'ADMIN',
              description: 'Administrador del sistema',
            },
          });

          // Crear permiso básico
          const adminPermission = await db.permission.create({
            data: {
              name: 'admin:all',
              description: 'Acceso completo de administrador',
              resource: 'all',
              action: 'all',
            },
          });

          // Asociar permiso al rol
          await db.rolePermission.create({
            data: {
              roleId: adminRole.id,
              permissionId: adminPermission.id,
            },
          });
        }

        // Crear nuevo usuario administrador
        const newAdmin = await db.user.create({
          data: {
            email,
            password,
            name: 'Administrador',
            roleId: adminRole.id,
            isActive: true,
            emailVerified: new Date(),
          },
        });

        await db.$disconnect();

        return NextResponse.json({
          success: true,
          message: 'Usuario administrador creado exitosamente',
          user: { id: newAdmin.id, email: newAdmin.email, role: adminRole.name },
        });
      } else {
        // Usuario ya existe, actualizar rol
        const adminRole = await db.role.findUnique({
          where: { name: 'ADMIN' },
        });

        if (adminRole) {
          const updatedUser = await db.user.update({
            where: { email },
            data: { roleId: adminRole.id },
          });

          return NextResponse.json({
            success: true,
            message: 'Usuario actualizado a administrador',
            user: { id: updatedUser.id, email: updatedUser.email, role: adminRole.name },
          });
        } else {
          const updatedUser = await db.user.update({
            where: { email },
            data: { roleId: null },
          });

          return NextResponse.json({
            success: true,
            message: 'Rol de administrador no encontrado',
          });
        }
      }

      await db.$disconnect();
    }
    */

  } catch (error) {
    console.error('Error en admin setup:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 