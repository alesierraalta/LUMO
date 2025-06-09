const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedPermissions() {
  console.log('🌱 Seeding permissions system...');

  try {
    // Crear permisos del sistema
    const permissions = [
      // Permisos de páginas principales
      { name: 'dashboard.view', description: 'Ver dashboard', resource: 'dashboard', action: 'view', category: 'page', isSystem: true },
      { name: 'inventory.view', description: 'Ver inventario', resource: 'inventory', action: 'view', category: 'page', isSystem: true },
      { name: 'inventory.create', description: 'Crear productos', resource: 'inventory', action: 'create', category: 'page', isSystem: true },
      { name: 'inventory.edit', description: 'Editar productos', resource: 'inventory', action: 'edit', category: 'page', isSystem: true },
      { name: 'inventory.delete', description: 'Eliminar productos', resource: 'inventory', action: 'delete', category: 'page', isSystem: true },
      
      // Permisos de ventas
      { name: 'sales.view', description: 'Ver ventas', resource: 'sales', action: 'view', category: 'page', isSystem: true },
      { name: 'sales.create', description: 'Crear ventas', resource: 'sales', action: 'create', category: 'page', isSystem: true },
      { name: 'sales.edit', description: 'Editar ventas', resource: 'sales', action: 'edit', category: 'page', isSystem: true },
      
      // Permisos de ubicaciones
      { name: 'locations.view', description: 'Ver ubicaciones', resource: 'locations', action: 'view', category: 'page', isSystem: true },
      { name: 'locations.create', description: 'Crear ubicaciones', resource: 'locations', action: 'create', category: 'page', isSystem: true },
      { name: 'locations.edit', description: 'Editar ubicaciones', resource: 'locations', action: 'edit', category: 'page', isSystem: true },
      
      // Permisos de categorías
      { name: 'categories.view', description: 'Ver categorías', resource: 'categories', action: 'view', category: 'page', isSystem: true },
      { name: 'categories.create', description: 'Crear categorías', resource: 'categories', action: 'create', category: 'page', isSystem: true },
      { name: 'categories.edit', description: 'Editar categorías', resource: 'categories', action: 'edit', category: 'page', isSystem: true },
      
      // Permisos de administración
      { name: 'users.view', description: 'Ver usuarios', resource: 'users', action: 'view', category: 'page', isSystem: true },
      { name: 'users.create', description: 'Crear usuarios', resource: 'users', action: 'create', category: 'page', isSystem: true },
      { name: 'users.edit', description: 'Editar usuarios', resource: 'users', action: 'edit', category: 'page', isSystem: true },
      { name: 'users.delete', description: 'Eliminar usuarios', resource: 'users', action: 'delete', category: 'page', isSystem: true },
      
      // Permisos de roles y permisos (solo admin)
      { name: 'permissions.view', description: 'Ver permisos', resource: 'permissions', action: 'view', category: 'page', isSystem: true },
      { name: 'permissions.manage', description: 'Gestionar permisos', resource: 'permissions', action: 'manage', category: 'page', isSystem: true },
      
      // Permisos de configuración
      { name: 'settings.view', description: 'Ver configuración', resource: 'settings', action: 'view', category: 'page', isSystem: true },
      { name: 'settings.edit', description: 'Editar configuración', resource: 'settings', action: 'edit', category: 'page', isSystem: true },
      
      // Permisos de reportes
      { name: 'reports.view', description: 'Ver reportes', resource: 'reports', action: 'view', category: 'page', isSystem: true },
      { name: 'reports.export', description: 'Exportar reportes', resource: 'reports', action: 'export', category: 'page', isSystem: true }
    ];

    console.log('📝 Creating permissions...');
    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission
      });
    }

    // Crear roles del sistema
    console.log('👥 Creating roles...');
    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: {
        name: 'ADMIN',
        description: 'Administrador con acceso completo al sistema',
        isSystem: true,
        isActive: true
      }
    });

    const managerRole = await prisma.role.upsert({
      where: { name: 'MANAGER' },
      update: {},
      create: {
        name: 'MANAGER',
        description: 'Gerente con acceso a inventario y ventas',
        isSystem: true,
        isActive: true
      }
    });

    const userRole = await prisma.role.upsert({
      where: { name: 'USER' },
      update: {},
      create: {
        name: 'USER',
        description: 'Usuario básico con permisos limitados',
        isSystem: true,
        isActive: true
      }
    });

    // Asignar todos los permisos al rol ADMIN
    console.log('🔐 Assigning permissions to ADMIN role...');
    const allPermissions = await prisma.permission.findMany();
    for (const permission of allPermissions) {
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
    }

    // Asignar permisos específicos al rol MANAGER
    console.log('🔐 Assigning permissions to MANAGER role...');
    const managerPermissions = [
      'dashboard.view', 'inventory.view', 'inventory.create', 'inventory.edit',
      'sales.view', 'sales.create', 'sales.edit',
      'locations.view', 'locations.create', 'locations.edit',
      'categories.view', 'categories.create', 'categories.edit',
      'reports.view', 'settings.view'
    ];

    for (const permissionName of managerPermissions) {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName }
      });
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: managerRole.id,
              permissionId: permission.id
            }
          },
          update: {},
          create: {
            roleId: managerRole.id,
            permissionId: permission.id
          }
        });
      }
    }

    // Asignar permisos básicos al rol USER
    console.log('🔐 Assigning permissions to USER role...');
    const userPermissions = [
      'dashboard.view', 'inventory.view',
      'sales.view', 'locations.view', 'categories.view',
      'settings.view'
    ];

    for (const permissionName of userPermissions) {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName }
      });
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: userRole.id,
              permissionId: permission.id
            }
          },
          update: {},
          create: {
            roleId: userRole.id,
            permissionId: permission.id
          }
        });
      }
    }

    // Actualizar usuarios existentes para usar el nuevo sistema de roles
    console.log('👤 Updating existing users...');
    const existingUsers = await prisma.user.findMany();
    
    for (const user of existingUsers) {
      let targetRole;
      // Si el usuario tiene el rol antiguo, asignar el nuevo rol correspondiente
      if (user.email.includes('admin') || user.email === 'admin@test.com') {
        targetRole = adminRole;
      } else {
        targetRole = userRole; // Por defecto, asignar rol USER
      }
      
      await prisma.user.update({
        where: { id: user.id },
        data: { roleId: targetRole.id }
      });
    }

    console.log('✅ Permissions system seeded successfully!');
    console.log(`📊 Created ${permissions.length} permissions`);
    console.log('📊 Created 3 roles: ADMIN, MANAGER, USER');
    console.log(`📊 Updated ${existingUsers.length} existing users`);

  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedPermissions();
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedPermissions }; 