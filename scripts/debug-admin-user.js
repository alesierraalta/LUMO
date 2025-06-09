#!/usr/bin/env node

/**
 * Script de Debug para Usuario Administrador
 * 
 * Este script verifica el estado del usuario administrador en la base de datos
 * y diagnostica problemas con el sistema de permisos.
 */

const { PrismaClient } = require('@prisma/client');

async function debugAdminUser() {
  const prisma = new PrismaClient();
  
  console.log('🔍 Debug del Usuario Administrador\n');

  try {
    // 1. Verificar conexión a la base de datos
    console.log('📊 Verificando conexión a la base de datos...');
    await prisma.$connect();
    console.log('✅ Conexión exitosa\n');

    // 2. Buscar el usuario administrador
    console.log('👤 Buscando usuario administrador...');
    const adminUser = await prisma.user.findUnique({
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

    if (!adminUser) {
      console.log('❌ Usuario administrador NO ENCONTRADO');
      return;
    }

    console.log('✅ Usuario administrador encontrado:');
    console.log(`   - ID: ${adminUser.id}`);
    console.log(`   - Email: ${adminUser.email}`);
    console.log(`   - Nombre: ${adminUser.name}`);
    console.log(`   - Rol: ${adminUser.role?.name || 'SIN ROL'}`);
    console.log(`   - Activo: ${adminUser.isActive ? 'Sí' : 'No'}`);
    console.log('');

    // 3. Verificar el rol ADMIN
    console.log('🏷️ Verificando rol ADMIN...');
    const adminRole = await prisma.role.findUnique({
      where: { name: 'ADMIN' },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!adminRole) {
      console.log('❌ Rol ADMIN NO ENCONTRADO');
      return;
    }

    console.log('✅ Rol ADMIN encontrado:');
    console.log(`   - ID: ${adminRole.id}`);
    console.log(`   - Nombre: ${adminRole.name}`);
    console.log(`   - Descripción: ${adminRole.description}`);
    console.log(`   - Permisos asignados: ${adminRole.permissions.length}`);
    console.log('');

    // 4. Listar permisos del rol ADMIN
    if (adminRole.permissions.length > 0) {
      console.log('🔐 Permisos del rol ADMIN:');
      adminRole.permissions.forEach((rp, index) => {
        const perm = rp.permission;
        console.log(`   ${index + 1}. ${perm.name} (${perm.resource}:${perm.action})`);
      });
    } else {
      console.log('⚠️ El rol ADMIN NO TIENE PERMISOS ASIGNADOS');
    }
    console.log('');

    // 5. Verificar todos los permisos disponibles
    console.log('📋 Permisos disponibles en el sistema...');
    const allPermissions = await prisma.permission.findMany({
      orderBy: { resource: 'asc' }
    });

    console.log(`✅ Total de permisos en sistema: ${allPermissions.length}`);
    
    const permissionsByResource = {};
    allPermissions.forEach(perm => {
      if (!permissionsByResource[perm.resource]) {
        permissionsByResource[perm.resource] = [];
      }
      permissionsByResource[perm.resource].push(perm);
    });

    Object.keys(permissionsByResource).forEach(resource => {
      console.log(`   📁 ${resource}:`);
      permissionsByResource[resource].forEach(perm => {
        const hasPermission = adminRole.permissions.some(rp => rp.permission.id === perm.id);
        console.log(`      ${hasPermission ? '✅' : '❌'} ${perm.action} - ${perm.name}`);
      });
    });
    console.log('');

    // 6. Verificar si faltan permisos críticos
    const criticalPermissions = [
      'dashboard:view',
      'inventory:view', 
      'users:view',
      'settings:view'
    ];

    console.log('🚨 Verificando permisos críticos para sidebar...');
    const adminPermissionNames = adminRole.permissions.map(rp => `${rp.permission.resource}:${rp.permission.action}`);
    
    let missingCritical = false;
    criticalPermissions.forEach(permName => {
      const hasIt = adminPermissionNames.includes(permName);
      console.log(`   ${hasIt ? '✅' : '❌'} ${permName}`);
      if (!hasIt) missingCritical = true;
    });

    if (missingCritical) {
      console.log('\n⚠️ PROBLEMA DETECTADO: Faltan permisos críticos para el usuario ADMIN');
      console.log('💡 Solución: Ejecutar scripts/fix-admin-permissions.js');
    } else {
      console.log('\n✅ Todos los permisos críticos están asignados');
    }

  } catch (error) {
    console.error('❌ Error durante el debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAdminUser(); 