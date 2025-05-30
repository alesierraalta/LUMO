// Endpoint para crear usuario administrador en producción
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

// Solo para uso de emergencia
export async function GET(request: NextRequest) {
  // Verificar la clave secreta en la URL
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  
  if (key !== 'setup-admin-2025') {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid key' },
      { status: 401 }
    );
  }
  
  try {
    const prisma = new PrismaClient();
    console.log('🔐 Admin setup: Verificando usuario administrador...');
    
    // Buscar usuario administrador
    const adminUser = await prisma.user.findUnique({
      where: { email: 'alesierraalta@gmail.com' }
    });
    
    if (!adminUser) {
      console.log('⚠️ Admin setup: Usuario administrador no encontrado, creándolo...');
      
      // Buscar rol de administrador
      let adminRole = await prisma.role.findUnique({
        where: { name: 'admin' }
      });
      
      // Si no existe el rol, crearlo
      if (!adminRole) {
        console.log('⚠️ Admin setup: Rol de administrador no encontrado, creándolo...');
        
        adminRole = await prisma.role.create({
          data: {
            name: 'admin',
            description: 'Acceso completo a todas las funcionalidades'
          }
        });
        
        // Crear permiso básico
        const adminPermission = await prisma.permission.create({
          data: {
            name: 'admin:all',
            description: 'Acceso completo de administrador',
            resource: 'admin',
            action: 'all'
          }
        });
        
        // Asignar permiso al rol
        await prisma.rolePermission.create({
          data: {
            roleId: adminRole.id,
            permissionId: adminPermission.id
          }
        });
        
        console.log('✅ Admin setup: Rol de administrador creado con permisos');
      }
      
      // Crear usuario administrador
      const passwordHash = await bcrypt.hash('admin123', 12);
      const newAdmin = await prisma.user.create({
        data: {
          email: 'alesierraalta@gmail.com',
          passwordHash: passwordHash,
          firstName: 'Alejandro',
          lastName: 'Sierra',
          roleId: adminRole.id,
          isActive: true,
          isEmailVerified: true
        }
      });
      
      await prisma.$disconnect();
      
      return NextResponse.json({
        success: true,
        message: 'Usuario administrador creado exitosamente',
        user: {
          email: newAdmin.email,
          firstName: newAdmin.firstName,
          lastName: newAdmin.lastName
        }
      });
    } else {
      console.log('✅ Admin setup: Usuario administrador encontrado:', adminUser.email);
      
      // Asegurar que el usuario tenga rol de administrador
      const adminRole = await prisma.role.findUnique({
        where: { name: 'admin' }
      });
      
      if (adminRole && adminUser.roleId !== adminRole.id) {
        const updatedUser = await prisma.user.update({
          where: { id: adminUser.id },
          data: { roleId: adminRole.id }
        });
        console.log('✅ Admin setup: Rol de administrador actualizado para', updatedUser.email);
      }
      
      // Actualizar contraseña para asegurar que funcione
      const passwordHash = await bcrypt.hash('admin123', 12);
      const updatedUser = await prisma.user.update({
        where: { id: adminUser.id },
        data: { 
          passwordHash: passwordHash,
          isActive: true,
          isEmailVerified: true
        }
      });
      
      await prisma.$disconnect();
      
      return NextResponse.json({
        success: true,
        message: 'Usuario administrador actualizado',
        user: {
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName
        }
      });
    }
  } catch (error: any) {
    console.error('❌ Admin setup error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 