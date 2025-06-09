#!/usr/bin/env node

/**
 * Script para Asegurar Permisos del Administrador
 * 
 * Este script garantiza que:
 * 1. Todos los permisos necesarios existan en la base de datos
 * 2. El rol ADMIN tenga TODOS los permisos asignados
 * 3. El usuario administrador tenga el rol ADMIN correctamente
 */

const { PrismaClient } = require('@prisma/client');

// Definición completa de permisos necesarios
const ALL_PERMISSIONS = [
  // Dashboard
  { name: 'Ver Dashboard', resource: 'dashboard', action: 'view', description: 'Acceso al panel principal' },
  
  // Inventario
  { name: 'Ver Inventario', resource: 'inventory', action: 'view', description: 'Ver productos en inventario' },
  { name: 'Crear Inventario', resource: 'inventory', action: 'create', description: 'Añadir nuevos productos' },
  { name: 'Editar Inventario', resource: 'inventory', action: 'edit', description: 'Modificar productos existentes' },
  { name: 'Eliminar Inventario', resource: 'inventory', action: 'delete', description: 'Eliminar productos del inventario' },
  
  // Ventas
  { name: 'Ver Ventas', resource: 'sales', action: 'view', description: 'Ver historial de ventas' },
  { name: 'Crear Ventas', resource: 'sales', action: 'create', description: 'Registrar nuevas ventas' },
  { name: 'Editar Ventas', resource: 'sales', action: 'edit', description: 'Modificar ventas existentes' },
  { name: 'Eliminar Ventas', resource: 'sales', action: 'delete', description: 'Eliminar registros de ventas' },
  
  // Ubicaciones
  { name: 'Ver Ubicaciones', resource: 'locations', action: 'view', description: 'Ver ubicaciones de inventario' },
  { name: 'Crear Ubicaciones', resource: 'locations', action: 'create', description: 'Añadir nuevas ubicaciones' },
  { name: 'Editar Ubicaciones', resource: 'locations', action: 'edit', description: 'Modificar ubicaciones existentes' },
  { name: 'Eliminar Ubicaciones', resource: 'locations', action: 'delete', description: 'Eliminar ubicaciones' },
  
  // Categorías
  { name: 'Ver Categorías', resource: 'categories', action: 'view', description: 'Ver categorías de productos' },
  { name: 'Crear Categorías', resource: 'categories', action: 'create', description: 'Añadir nuevas categorías' },
  { name: 'Editar Categorías', resource: 'categories', action: 'edit', description: 'Modificar categorías existentes' },
  { name: 'Eliminar Categorías', resource: 'categories', action: 'delete', description: 'Eliminar categorías' },
  
  // Usuarios
  { name: 'Ver Usuarios', resource: 'users', action: 'view', description: 'Ver lista de usuarios' },
  { name: 'Crear Usuarios', resource: 'users', action: 'create', description: 'Añadir nuevos usuarios' },
  { name: 'Editar Usuarios', resource: 'users', action: 'edit', description: 'Modificar usuarios existentes' },
  { name: 'Eliminar Usuarios', resource: 'users', action: 'delete', description: 'Eliminar usuarios del sistema' },
  
  // Permisos
  { name: 'Ver Permisos', resource: 'permissions', action: 'view', description: 'Ver configuración de permisos' },
  { name: 'Editar Permisos', resource: 'permissions', action: 'edit', description: 'Modificar permisos de roles' },
  
  // Configuración
  { name: 'Ver Configuración', resource: 'settings', action: 'view', description: 'Acceso a configuración del sistema' },
  { name: 'Editar Configuración', resource: 'settings', action: 'edit', description: 'Modificar configuración del sistema' },
  
  // Reportes
  { name: 'Ver Reportes', resource: 'reports', action: 'view', description: 'Acceso a reportes y análisis' },
  { name: 'Exportar Reportes', resource: 'reports', action: 'export', description: 'Exportar reportes' }
];

async function fixAdminPermissions() {
  // Check if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL no está configurada');
    console.error('⚠️ No se puede acceder a la base de datos');
    console.log('💡 Este script debe ejecutarse en el entorno de producción (Choreo)');
    return;
  }

  const prisma = new PrismaClient();
  
  console.log('🔧 Reparando Permisos del Administrador\n');

  try {
    await prisma.$connect();
    console.log('✅ Conectado a la base de datos\n');

    // 1. Crear/actualizar todos los permisos
    console.log('📝 Creando/actualizando permisos...');
    const createdPermissions = [];
    
    for (const perm of ALL_PERMISSIONS) {
      const permission = await prisma.permission.upsert({
        where: {
          resource_action: {
            resource: perm.resource,
            action: perm.action
          }
        },
        update: {
          name: perm.name,
          description: perm.description
        },
        create: {
          name: perm.name,
          resource: perm.resource,
          action: perm.action,
          description: perm.description
        }
      });
      
      createdPermissions.push(permission);
      console.log(`   ✅ ${perm.resource}:${perm.action}`);
    }
    
    console.log(`\n📊 Total de permisos: ${createdPermissions.length}\n`);

    // 2. Asegurar que el rol ADMIN existe
    console.log('🏷️ Verificando rol ADMIN...');
    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {
        description: 'Administrador con acceso completo al sistema',
        isSystem: true
      },
      create: {
        name: 'ADMIN',
        description: 'Administrador con acceso completo al sistema',
        isSystem: true
      }
    });
    
    console.log(`✅ Rol ADMIN: ${adminRole.id}\n`);

    // 3. Asignar TODOS los permisos al rol ADMIN
    console.log('🔐 Asignando permisos al rol ADMIN...');
    let assignedCount = 0;
    
    for (const permission of createdPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id
        }
      });
      
      assignedCount++;
    }
    
    console.log(`✅ Permisos asignados al rol ADMIN: ${assignedCount}\n`);

    // 4. Verificar el usuario administrador
    console.log('👤 Verificando usuario administrador...');
    const adminUser = await prisma.user.findUnique({
      where: { email: 'alesierraalta@gmail.com' },
      include: { role: true }
    });

    if (!adminUser) {
      console.log('❌ Usuario administrador no encontrado');
      return;
    }

    // 5. Asegurar que el usuario tenga el rol ADMIN
    if (adminUser.roleId !== adminRole.id) {
      console.log('🔄 Asignando rol ADMIN al usuario...');
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { roleId: adminRole.id }
      });
      console.log('✅ Rol ADMIN asignado al usuario\n');
    } else {
      console.log('✅ Usuario ya tiene rol ADMIN\n');
    }

    // 6. Verificación final
    console.log('🔍 Verificación final...');
    const finalCheck = await prisma.user.findUnique({
      where: { email: 'alesierraalta@gmail.com' },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    console.log(`✅ Usuario: ${finalCheck.email}`);
    console.log(`✅ Rol: ${finalCheck.role.name}`);
    console.log(`✅ Permisos: ${finalCheck.role.permissions.length}`);
    console.log(`✅ Activo: ${finalCheck.isActive ? 'Sí' : 'No'}`);

    // 7. Mostrar permisos críticos para sidebar
    const criticalPerms = ['dashboard:view', 'inventory:view', 'users:view', 'settings:view'];
    console.log('\n🎯 Permisos críticos para sidebar:');
    
    criticalPerms.forEach(permKey => {
      const [resource, action] = permKey.split(':');
      const hasIt = finalCheck.role.permissions.some(rp => 
        rp.permission.resource === resource && rp.permission.action === action
      );
      console.log(`   ${hasIt ? '✅' : '❌'} ${permKey}`);
    });

    console.log('\n🎉 ¡Reparación de permisos completada!');
    console.log('💡 El usuario administrador ahora debería ver todas las opciones en el sidebar');

  } catch (error) {
    console.error('❌ Error durante la reparación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminPermissions(); 