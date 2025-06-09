#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function debugSidebarPermissions() {
  console.log('🔍 DIAGNÓSTICO DE PERMISOS PARA SIDEBAR');
  console.log('=====================================');
  
  const prisma = new PrismaClient();
  
  try {
    // 1. Verificar usuario administrador
    console.log('\n1️⃣ VERIFICANDO USUARIO ADMINISTRADOR...');
    const adminUser = await prisma.user.findUnique({
      where: { email: 'alesierraalta@gmail.com' },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });
    
    if (!adminUser) {
      console.log('❌ Usuario administrador no encontrado');
      return;
    }
    
    console.log(`✅ Usuario encontrado: ${adminUser.email}`);
    console.log(`   - Rol: ${adminUser.role?.name || adminUser.role}`);
    console.log(`   - Activo: ${adminUser.isActive}`);
    console.log(`   - Permisos: ${adminUser.role?.rolePermissions?.length || 0}`);
    
    // 2. Verificar permisos específicos del sidebar
    console.log('\n2️⃣ VERIFICANDO PERMISOS ESPECÍFICOS DEL SIDEBAR...');
    const sidebarPermissions = [
      'dashboard:view',
      'inventory:view', 
      'categories:view',
      'locations:view',
      'users:view',
      'settings:view'
    ];
    
    sidebarPermissions.forEach(permKey => {
      const [resource, action] = permKey.split(':');
      const hasPermission = adminUser.role?.rolePermissions?.some(rp => 
        rp.permission.resource === resource && rp.permission.action === action
      );
      console.log(`   ${hasPermission ? '✅' : '❌'} ${permKey}`);
    });
    
    // 3. Listar todos los permisos
    console.log('\n3️⃣ TODOS LOS PERMISOS DEL USUARIO...');
    if (adminUser.role?.rolePermissions) {
      adminUser.role.rolePermissions.forEach(rp => {
        console.log(`   ✅ ${rp.permission.resource}:${rp.permission.action} - ${rp.permission.description}`);
      });
    }
    
    // 4. Simular la función hasPermission del cliente
    console.log('\n4️⃣ SIMULANDO FUNCIÓN hasPermission DEL CLIENTE...');
    
    // Simulamos la lógica de permissions-client.ts
    const userRole = adminUser.role?.name || adminUser.role;
    console.log(`   - Role del usuario: ${userRole}`);
    
    if (userRole === 'ADMIN') {
      console.log('   ✅ Usuario es ADMIN - debería tener TODOS los permisos');
      console.log('   ✅ hasPermission("dashboard:view") = true (ADMIN automático)');
      console.log('   ✅ hasPermission("inventory:view") = true (ADMIN automático)');
      console.log('   ✅ hasPermission("categories:view") = true (ADMIN automático)');
      console.log('   ✅ hasPermission("users:view") = true (ADMIN automático)');
      console.log('   ✅ hasPermission("settings:view") = true (ADMIN automático)');
    } else {
      console.log('   ⚠️ Usuario NO es ADMIN - verificaría localStorage o roles predefinidos');
    }
    
    console.log('\n🎯 CONCLUSIONES:');
    console.log('================');
    
    if (userRole === 'ADMIN') {
      console.log('✅ El usuario tiene rol ADMIN');
      console.log('✅ La función hasPermission() debería retornar true automáticamente');
      console.log('✅ El sidebar debería mostrar todas las opciones');
      console.log('');
      console.log('🔍 Si el sidebar no muestra las opciones, el problema está en:');
      console.log('   1. El frontend no está recibiendo el rol correcto');
      console.log('   2. La función hasPermission() no está funcionando');
      console.log('   3. El componente sidebar tiene algún error');
    } else {
      console.log('❌ El usuario NO tiene rol ADMIN');
      console.log('💡 Esto explicaría por qué el sidebar no muestra las opciones');
    }
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSidebarPermissions(); 