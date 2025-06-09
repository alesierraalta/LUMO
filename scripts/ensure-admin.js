/**
 * Script para asegurar que el usuario administrador exista
 * 
 * Uso:
 *   node scripts/ensure-admin.js
 * 
 * Este script verifica si el usuario administrador existe en la base de datos.
 * Si no existe, lo crea con las credenciales por defecto.
 * También asegura que tenga todos los permisos necesarios.
 */

const bcrypt = require('bcryptjs');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Definición completa de permisos necesarios
const ALL_PERMISSIONS = [
  // Dashboard
  { name: 'Ver Dashboard', resource: 'dashboard', action: 'view', category: 'page', description: 'Acceso al panel principal' },
  
  // Inventario
  { name: 'Ver Inventario', resource: 'inventory', action: 'view', category: 'page', description: 'Ver lista de productos' },
  { name: 'Crear Inventario', resource: 'inventory', action: 'create', category: 'data', description: 'Crear nuevos productos' },
  { name: 'Editar Inventario', resource: 'inventory', action: 'edit', category: 'data', description: 'Modificar productos existentes' },
  { name: 'Eliminar Inventario', resource: 'inventory', action: 'delete', category: 'data', description: 'Eliminar productos' },
  { name: 'Ajustar Stock', resource: 'inventory', action: 'adjust', category: 'data', description: 'Ajustar niveles de stock' },
  
  // Ventas
  { name: 'Ver Ventas', resource: 'sales', action: 'view', category: 'page', description: 'Ver historial de ventas' },
  { name: 'Crear Ventas', resource: 'sales', action: 'create', category: 'data', description: 'Registrar nuevas ventas' },
  { name: 'Editar Ventas', resource: 'sales', action: 'edit', category: 'data', description: 'Modificar ventas existentes' },
  
  // Ubicaciones
  { name: 'Ver Ubicaciones', resource: 'locations', action: 'view', category: 'page', description: 'Ver lista de ubicaciones' },
  { name: 'Crear Ubicaciones', resource: 'locations', action: 'create', category: 'data', description: 'Crear nuevas ubicaciones' },
  { name: 'Editar Ubicaciones', resource: 'locations', action: 'edit', category: 'data', description: 'Modificar ubicaciones existentes' },
  
  // Categorías
  { name: 'Ver Categorías', resource: 'categories', action: 'view', category: 'page', description: 'Ver lista de categorías' },
  { name: 'Crear Categorías', resource: 'categories', action: 'create', category: 'data', description: 'Crear nuevas categorías' },
  { name: 'Editar Categorías', resource: 'categories', action: 'edit', category: 'data', description: 'Modificar categorías existentes' },
  
  // Usuarios
  { name: 'Ver Usuarios', resource: 'users', action: 'view', category: 'page', description: 'Ver lista de usuarios' },
  { name: 'Crear Usuarios', resource: 'users', action: 'create', category: 'data', description: 'Crear nuevos usuarios' },
  { name: 'Editar Usuarios', resource: 'users', action: 'edit', category: 'data', description: 'Modificar usuarios existentes' },
  
  // Permisos
  { name: 'Ver Permisos', resource: 'permissions', action: 'view', category: 'page', description: 'Ver sistema de permisos' },
  { name: 'Editar Permisos', resource: 'permissions', action: 'edit', category: 'data', description: 'Modificar permisos de roles' },
  
  // Configuración
  { name: 'Ver Configuración', resource: 'settings', action: 'view', category: 'page', description: 'Acceso a configuraciones' },
  { name: 'Editar Configuración', resource: 'settings', action: 'edit', category: 'data', description: 'Modificar configuraciones' },
  
  // Reportes
  { name: 'Ver Reportes', resource: 'reports', action: 'view', category: 'page', description: 'Acceso a reportes y analíticas' }
];

// Información del entorno
console.log('🔍 Verificando entorno para usuario administrador...');

// Add a small delay to ensure schema.prisma changes from ensure-prisma-accelerate.js are synced
console.log('⏱️ Esperando sincronización de archivos...');
const start = Date.now();
while (Date.now() - start < 1000) {
  // Wait 1 second for file system sync
}

// Verify schema.prisma configuration before proceeding
const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
if (fs.existsSync(schemaPath)) {
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  console.log('📋 Verificando configuración de schema.prisma...');
  
  if (schemaContent.includes('provider = "postgresql"')) {
    console.log('✅ Schema configurado para PostgreSQL');
  } else if (schemaContent.includes('provider = "sqlite"')) {
    console.log('✅ Schema configurado para SQLite');
  } else {
    console.error('❌ No se pudo determinar el proveedor de la base de datos en schema.prisma');
    console.error('Contenido del schema (primeras 10 líneas):');
    console.error(schemaContent.split('\n').slice(0, 10).join('\n'));
  }
} else {
  console.error('❌ No se encontró schema.prisma');
}

console.log(`- DATABASE_URL: [Configurada]`);
console.log(`- JWT_SECRET: ${process.env.JWT_SECRET ? '[Configurado]' : '[NO CONFIGURADO]'}`);

async function setupAdminWithPermissions() {
  // Verify environment configuration first
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not configured');
    process.exit(1);
  }
  
  console.log('🔍 Verificando configuración de base de datos...');
  let expectedProvider = 'sqlite';
  if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
    console.log('✅ PostgreSQL detectado');
    expectedProvider = 'postgresql';
  } else if (dbUrl.startsWith('file:')) {
    console.log('✅ SQLite detectado');
    expectedProvider = 'sqlite';
  } else {
    console.log('⚠️ Tipo de base de datos no reconocido:', dbUrl.substring(0, 20));
  }
  
  // Check if schema provider matches database URL
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const hasCorrectProvider = schemaContent.includes(`provider = "${expectedProvider}"`);
  
  if (!hasCorrectProvider) {
    console.log(`🔧 Schema provider mismatch - updating to ${expectedProvider}...`);
    
    // Update schema provider
    let updatedSchema = schemaContent;
    if (expectedProvider === 'postgresql') {
      updatedSchema = updatedSchema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
    } else {
      updatedSchema = updatedSchema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
    }
    
    fs.writeFileSync(schemaPath, updatedSchema);
    console.log(`✅ Schema updated to ${expectedProvider}`);
    
    // Regenerate Prisma client
    console.log('🔄 Regenerating Prisma client...');
    try {
      execSync('npx prisma generate', { 
        stdio: 'inherit',
        cwd: process.cwd(),
        timeout: 60000 // 60 second timeout
      });
      console.log('✅ Prisma client regenerated');
      
      // Small delay to ensure client is ready
      const waitStart = Date.now();
      while (Date.now() - waitStart < 1000) {
        // Wait 1 second
      }
    } catch (error) {
      console.error('❌ Error regenerating Prisma client:', error.message);
      console.log('⚠️ Continuing with existing client...');
    }
  }
  
  // Dynamically import PrismaClient after potential regeneration
  let prisma;
  try {
    // Clear require cache to ensure fresh import
    delete require.cache[require.resolve('@prisma/client')];
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
  } catch (error) {
    console.error('❌ Error importing PrismaClient:', error.message);
    console.log('🔄 Attempting one more client generation...');
    
    try {
      execSync('npx prisma generate --force', { 
        stdio: 'inherit',
        cwd: process.cwd() 
      });
      
      delete require.cache[require.resolve('@prisma/client')];
      const { PrismaClient } = require('@prisma/client');
      prisma = new PrismaClient();
      console.log('✅ PrismaClient successfully imported after force generation');
    } catch (finalError) {
      console.error('❌ Critical: Unable to initialize PrismaClient:', finalError.message);
      process.exit(1);
    }
  }
  
  try {
    console.log('🛡️ Verificando usuario administrador root...');
    console.log('🔌 Conectando a la base de datos...');
    await prisma.$connect();
    console.log('✅ Conexión a la base de datos exitosa');

    // Verificar estructura de base de datos
    try {
      await prisma.user.count();
    } catch (error) {
      if (error.message.includes('does not exist')) {
        console.log('⚠️ Las tablas de la base de datos no existen.');
        console.log('🔧 Creando esquema de base de datos...');
        
        try {
          execSync('npx prisma db push --force-reset', { 
            stdio: 'inherit',
            cwd: process.cwd()
          });
          console.log('✅ Esquema de base de datos creado');
          
          // Esperar un momento para que la base de datos esté lista
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (pushError) {
          console.error('❌ Error al crear esquema:', pushError);
          throw pushError;
        }
      } else {
        throw error;
      }
    }

    // 1. CREAR/ACTUALIZAR PERMISOS
    console.log('\n📝 Configurando sistema de permisos...');
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
          description: perm.description,
          category: perm.category
        },
        create: {
          name: perm.name,
          resource: perm.resource,
          action: perm.action,
          description: perm.description,
          category: perm.category,
          isSystem: true
        }
      });
      
      createdPermissions.push(permission);
    }
    
    console.log(`✅ Permisos configurados: ${createdPermissions.length}`);

    // 2. CREAR/ACTUALIZAR ROL ADMIN
    console.log('\n🏷️ Configurando rol ADMIN...');
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
    
    console.log(`✅ Rol ADMIN configurado: ${adminRole.id}`);

    // 3. ASIGNAR TODOS LOS PERMISOS AL ROL ADMIN
    console.log('\n🔐 Asignando permisos al rol ADMIN...');
    let permissionsAssigned = 0;
    
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
      permissionsAssigned++;
    }
    
    console.log(`✅ Permisos asignados: ${permissionsAssigned}`);

    // 4. VERIFICAR/CREAR USUARIO ADMINISTRADOR
    console.log('\n👤 Verificando usuario administrador...');
    
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'alesierraalta@gmail.com' },
      include: { role: true }
    });

    if (existingAdmin) {
      console.log('✅ Usuario administrador encontrado');
      
      // Asegurar que tenga el rol ADMIN correcto
      if (existingAdmin.roleId !== adminRole.id) {
        console.log('🔄 Actualizando rol del usuario...');
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: { roleId: adminRole.id }
        });
        console.log('✅ Rol actualizado');
      }
      
    } else {
      console.log('⚠️ Usuario administrador ROOT no encontrado, creándolo...');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const newAdmin = await prisma.user.create({
        data: {
          email: 'alesierraalta@gmail.com',
          name: 'Alejandro Sierra (ROOT)',
          password: hashedPassword,
          roleId: adminRole.id,
          isActive: true
        },
        include: { role: true }
      });
      
      console.log('✅ Usuario administrador ROOT creado exitosamente');
      console.log(`   - Email: ${newAdmin.email}`);
      console.log(`   - Rol: ${newAdmin.role.name}`);
    }

    // 5. VERIFICACIÓN FINAL
    console.log('\n🔍 Verificación final del sistema...');
    const finalAdmin = await prisma.user.findUnique({
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

    console.log('✅ Estado del usuario administrador:');
    console.log(`   - Email: ${finalAdmin.email}`);
    console.log(`   - Rol: ${finalAdmin.role.name}`);
    console.log(`   - Permisos: ${finalAdmin.role.rolePermissions.length}`);
    console.log(`   - Activo: ${finalAdmin.isActive ? 'Sí' : 'No'}`);

    // Verificar permisos críticos para sidebar
    const criticalPerms = ['dashboard:view', 'inventory:view', 'users:view', 'settings:view'];
    console.log('\n🎯 Permisos críticos para sidebar:');
    
    criticalPerms.forEach(permKey => {
      const [resource, action] = permKey.split(':');
      const hasIt = finalAdmin.role.rolePermissions.some(rp => 
        rp.permission.resource === resource && rp.permission.action === action
      );
      console.log(`   ${hasIt ? '✅' : '❌'} ${permKey}`);
    });

    console.log('\n🎉 Sistema de administrador configurado correctamente');
    console.log('💡 Credenciales: alesierraalta@gmail.com / admin123');
    console.log('🔐 El usuario tiene acceso completo a todas las funciones');

  } catch (error) {
    console.error('❌ Error al configurar usuario administrador:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupAdminWithPermissions(); 