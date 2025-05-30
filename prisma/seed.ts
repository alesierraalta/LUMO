import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seeder...");
  
  // Crear roles básicos
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Acceso completo a todas las funcionalidades',
    },
  });
  
  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      description: 'Usuario estándar del sistema',
    },
  });
  
  const viewerRole = await prisma.role.upsert({
    where: { name: 'viewer' },
    update: {},
    create: {
      name: 'viewer',
      description: 'Acceso de solo lectura a la aplicación',
    },
  });
  
  // Crear rol de operador (no puede acceder a inventario)
  const operatorRole = await prisma.role.upsert({
    where: { name: 'operator' },
    update: {},
    create: {
      name: 'operator',
      description: 'Operador con acceso limitado, sin inventario',
    },
  });
  
  // Crear permisos de páginas/módulos
  const accessDashboardPermission = await prisma.permission.upsert({
    where: { name: 'page:dashboard' },
    update: {},
    create: {
      name: 'page:dashboard',
      description: 'Permite acceder a la página Dashboard',
      resource: 'page',
      action: 'dashboard',
    },
  });

  const accessInventoryPermission = await prisma.permission.upsert({
    where: { name: 'page:inventory' },
    update: {},
    create: {
      name: 'page:inventory',
      description: 'Permite acceder a la página Inventory',
      resource: 'page',
      action: 'inventory',
    },
  });

  const accessSettingsPermission = await prisma.permission.upsert({
    where: { name: 'page:settings' },
    update: {},
    create: {
      name: 'page:settings',
      description: 'Permite acceder a la página Settings',
      resource: 'page',
      action: 'settings',
    },
  });

  const accessUserManagementPermission = await prisma.permission.upsert({
    where: { name: 'page:user-management' },
    update: {},
    create: {
      name: 'page:user-management',
      description: 'Permite acceder a la página User Management',
      resource: 'page',
      action: 'user-management',
    },
  });
  
  // Crear permisos básicos (mantener los existentes)
  const readInventoryPermission = await prisma.permission.upsert({
    where: { name: 'inventory:read' },
    update: {},
    create: {
      name: 'inventory:read',
      description: 'Permite leer datos de inventario',
      resource: 'inventory',
      action: 'read',
    },
  });
  
  const writeInventoryPermission = await prisma.permission.upsert({
    where: { name: 'inventory:write' },
    update: {},
    create: {
      name: 'inventory:write',
      description: 'Permite escribir datos de inventario',
      resource: 'inventory',
      action: 'write',
    },
  });

  const readSalesPermission = await prisma.permission.upsert({
    where: { name: 'sales:read' },
    update: {},
    create: {
      name: 'sales:read',
      description: 'Permite leer datos de ventas',
      resource: 'sales',
      action: 'read',
    },
  });

  const writeSalesPermission = await prisma.permission.upsert({
    where: { name: 'sales:write' },
    update: {},
    create: {
      name: 'sales:write',
      description: 'Permite escribir datos de ventas',
      resource: 'sales',
      action: 'write',
    },
  });

  const manageUsersPermission = await prisma.permission.upsert({
    where: { name: 'users:manage' },
    update: {},
    create: {
      name: 'users:manage',
      description: 'Permite gestionar usuarios del sistema',
      resource: 'users',
      action: 'manage',
    },
  });
  
  // Asignar permisos a roles
  // Admin tiene TODOS los permisos (páginas + acciones)
  const adminPermissions = [
    accessDashboardPermission.id,
    accessInventoryPermission.id,
    accessSettingsPermission.id,
    accessUserManagementPermission.id,
    readInventoryPermission.id,
    writeInventoryPermission.id,
    readSalesPermission.id,
    writeSalesPermission.id,
    manageUsersPermission.id,
  ];

  for (const permissionId of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: { 
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId,
      },
    });
  }

  // User tiene acceso a dashboard, inventory y settings (sin user management)
  const userPermissions = [
    accessDashboardPermission.id,
    accessInventoryPermission.id,
    accessSettingsPermission.id,
    readInventoryPermission.id,
    writeInventoryPermission.id,
    readSalesPermission.id,
  ];

  for (const permissionId of userPermissions) {
    await prisma.rolePermission.upsert({
      where: { 
        roleId_permissionId: {
          roleId: userRole.id,
          permissionId,
        },
      },
      update: {},
      create: {
        roleId: userRole.id,
        permissionId,
      },
    });
  }
  
  // Viewer solo tiene acceso a dashboard y settings (SIN inventory)
  const viewerPermissions = [
    accessDashboardPermission.id,
    accessSettingsPermission.id,
    readSalesPermission.id,
  ];

  for (const permissionId of viewerPermissions) {
    await prisma.rolePermission.upsert({
      where: { 
        roleId_permissionId: {
          roleId: viewerRole.id,
          permissionId,
        },
      },
      update: {},
      create: {
        roleId: viewerRole.id,
        permissionId,
      },
    });
  }

  // Operator tiene acceso a dashboard y settings (SIN inventory)
  const operatorPermissions = [
    accessDashboardPermission.id,
    accessSettingsPermission.id,
    readSalesPermission.id,
  ];

  for (const permissionId of operatorPermissions) {
    await prisma.rolePermission.upsert({
      where: { 
        roleId_permissionId: {
          roleId: operatorRole.id,
          permissionId,
        },
      },
    update: {},
      create: {
        roleId: operatorRole.id,
        permissionId,
      },
    });
  }

  // Crear usuario admin root (SIEMPRE PRESENTE)
  const rootAdminPasswordHash = await bcrypt.hash('admin123', 12);
  const rootAdminUser = await prisma.user.upsert({
    where: { email: 'alesierraalta@gmail.com' },
    update: {
      // Asegurar que siempre tenga rol de admin
      roleId: adminRole.id,
      isActive: true,
      isEmailVerified: true,
    },
    create: {
      email: 'alesierraalta@gmail.com',
      passwordHash: rootAdminPasswordHash,
      firstName: 'Alejandro',
      lastName: 'Sierra',
      roleId: adminRole.id,
      isActive: true,
      isEmailVerified: true,
    },
  });

  // Crear usuarios de prueba para demostrar permisos
  const demoPasswordHash = await bcrypt.hash('demo123', 12);

  // Usuario con rol Viewer (sin acceso a inventario)
  const viewerUser = await prisma.user.upsert({
    where: { email: 'viewer@demo.com' },
    update: {
      roleId: viewerRole.id,
      isActive: true,
      isEmailVerified: true,
    },
    create: {
      email: 'viewer@demo.com',
      passwordHash: demoPasswordHash,
      firstName: 'Demo',
      lastName: 'Viewer',
      roleId: viewerRole.id,
      isActive: true,
      isEmailVerified: true,
    },
  });

  // Usuario con rol Operator (sin acceso a inventario)
  const operatorUser = await prisma.user.upsert({
    where: { email: 'operator@demo.com' },
    update: {
      roleId: operatorRole.id,
      isActive: true,
      isEmailVerified: true,
    },
    create: {
      email: 'operator@demo.com',
      passwordHash: demoPasswordHash,
      firstName: 'Demo',
      lastName: 'Operator',
      roleId: operatorRole.id,
      isActive: true,
      isEmailVerified: true,
    },
  });

  // Usuario con rol User (con acceso a inventario pero sin user management)
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@demo.com' },
    update: {
      roleId: userRole.id,
      isActive: true,
      isEmailVerified: true,
    },
    create: {
      email: 'user@demo.com',
      passwordHash: demoPasswordHash,
      firstName: 'Demo',
      lastName: 'User',
      roleId: userRole.id,
      isActive: true,
      isEmailVerified: true,
    },
  });

  // Crear categorías por defecto
  const electronicsCategory = await prisma.category.upsert({
    where: { name: 'Electronics' },
    update: {},
    create: {
      name: 'Electronics',
      description: 'Electronic devices and components',
    },
  });

  const furnitureCategory = await prisma.category.upsert({
    where: { name: 'Furniture' },
    update: {},
    create: {
      name: 'Furniture',
      description: 'Office and home furniture',
    },
  });

  // Crear ubicaciones por defecto
  const warehouseLocation = await prisma.location.upsert({
    where: { name: 'Main Warehouse' },
    update: {},
    create: {
      name: 'Main Warehouse',
      description: 'Primary storage facility',
      isActive: true,
    },
  });

  const storeLocation = await prisma.location.upsert({
    where: { name: 'Store Front' },
    update: {},
    create: {
      name: 'Store Front',
      description: 'Retail store location',
      isActive: true,
    },
  });
  
  console.log("Seeder completado con éxito!");
  console.log("✅ Usuario admin root creado: alesierraalta@gmail.com / admin123");
  console.log("✅ Usuarios demo creados:");
  console.log("  - viewer@demo.com / demo123 (Viewer - Sin inventario)");
  console.log("  - operator@demo.com / demo123 (Operator - Sin inventario)");
  console.log("  - user@demo.com / demo123 (User - Con inventario, sin admin)");
  console.log("✅ Roles y permisos de páginas configurados correctamente.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 