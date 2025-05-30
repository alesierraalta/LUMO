const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function hashPassword(password) {
  return await bcrypt.hash(password, 12);
}

async function main() {
  console.log('🌱 Seeding development database...');

  // 1. Crear roles básicos
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrador con acceso completo'
    }
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      description: 'Usuario estándar'
    }
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'manager' },
    update: {},
    create: {
      name: 'manager',
      description: 'Gerente con acceso a reportes'
    }
  });

  // 2. Crear permisos básicos
  const permissions = [
    { name: 'dashboard:read', description: 'Ver dashboard', resource: 'dashboard', action: 'read' },
    { name: 'inventory:read', description: 'Ver inventario', resource: 'inventory', action: 'read' },
    { name: 'inventory:write', description: 'Modificar inventario', resource: 'inventory', action: 'write' },
    { name: 'users:read', description: 'Ver usuarios', resource: 'users', action: 'read' },
    { name: 'users:write', description: 'Modificar usuarios', resource: 'users', action: 'write' },
    { name: 'reports:read', description: 'Ver reportes', resource: 'reports', action: 'read' },
    { name: 'settings:read', description: 'Ver configuración', resource: 'settings', action: 'read' },
    { name: 'settings:write', description: 'Modificar configuración', resource: 'settings', action: 'write' },
    { name: 'admin:all', description: 'Acceso completo de administrador', resource: 'admin', action: 'all' },
    // Permisos específicos para páginas (hasPageAccess)
    { name: 'page:dashboard', description: 'Acceso a página dashboard', resource: 'page', action: 'dashboard' },
    { name: 'page:inventory', description: 'Acceso a página inventory', resource: 'page', action: 'inventory' },
    { name: 'page:settings', description: 'Acceso a página settings', resource: 'page', action: 'settings' },
    { name: 'page:user-management', description: 'Acceso a página user-management', resource: 'page', action: 'user-management' }
  ];

  const createdPermissions = [];
  for (const perm of permissions) {
    const permission = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm
    });
    createdPermissions.push(permission);
  }

  // 3. Asignar permisos a roles
  // Admin tiene todos los permisos
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
  }

  // Manager tiene permisos limitados
  const managerPermissions = createdPermissions.filter(p => 
    ['dashboard:read', 'inventory:read', 'inventory:write', 'reports:read', 'page:dashboard', 'page:inventory'].includes(p.name)
  );
  for (const permission of managerPermissions) {
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

  // User solo lectura básica
  const userPermissions = createdPermissions.filter(p => 
    ['dashboard:read', 'inventory:read', 'page:dashboard', 'page:inventory'].includes(p.name)
  );
  for (const permission of userPermissions) {
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

  // 4. Crear usuarios de desarrollo
  const rootAdminUser = await prisma.user.upsert({
    where: { email: 'alesierraalta@gmail.com' },
    update: {
      passwordHash: await hashPassword('admin123'),
      roleId: adminRole.id,
      isActive: true,
      isEmailVerified: true
    },
    create: {
      email: 'alesierraalta@gmail.com',
      passwordHash: await hashPassword('admin123'),
      firstName: 'Alejandro',
      lastName: 'Sierra',
      roleId: adminRole.id,
      isActive: true,
      isEmailVerified: true
    }
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@lumo.dev' },
    update: {},
    create: {
      email: 'admin@lumo.dev',
      passwordHash: await hashPassword('admin123'),
      firstName: 'Admin',
      lastName: 'LUMO',
      roleId: adminRole.id,
      isActive: true,
      isEmailVerified: true
    }
  });

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@lumo.dev' },
    update: {},
    create: {
      email: 'manager@lumo.dev',
      passwordHash: await hashPassword('manager123'),
      firstName: 'Manager',
      lastName: 'LUMO',
      roleId: managerRole.id,
      isActive: true,
      isEmailVerified: true
    }
  });

  const testUser = await prisma.user.upsert({
    where: { email: 'user@lumo.dev' },
    update: {},
    create: {
      email: 'user@lumo.dev',
      passwordHash: await hashPassword('user123'),
      firstName: 'Usuario',
      lastName: 'Prueba',
      roleId: userRole.id,
      isActive: true,
      isEmailVerified: true
    }
  });

  // 5. Crear categorías de ejemplo
  const electronics = await prisma.category.upsert({
    where: { name: 'Electrónicos' },
    update: {},
    create: {
      name: 'Electrónicos',
      description: 'Dispositivos electrónicos y tecnología'
    }
  });

  const clothing = await prisma.category.upsert({
    where: { name: 'Ropa' },
    update: {},
    create: {
      name: 'Ropa',
      description: 'Ropa y accesorios'
    }
  });

  const home = await prisma.category.upsert({
    where: { name: 'Hogar' },
    update: {},
    create: {
      name: 'Hogar',
      description: 'Artículos para el hogar'
    }
  });

  // 6. Crear ubicaciones de ejemplo
  const warehouse = await prisma.location.upsert({
    where: { name: 'Almacén Principal' },
    update: {},
    create: {
      name: 'Almacén Principal',
      description: 'Almacén central de inventario'
    }
  });

  const store = await prisma.location.upsert({
    where: { name: 'Tienda' },
    update: {},
    create: {
      name: 'Tienda',
      description: 'Área de ventas al público'
    }
  });

  const backroom = await prisma.location.upsert({
    where: { name: 'Trastienda' },
    update: {},
    create: {
      name: 'Trastienda',
      description: 'Almacén de trastienda'
    }
  });

  // 7. Crear productos de ejemplo
  const products = [
    {
      name: 'Laptop Dell XPS 13',
      description: 'Laptop ultraportátil con procesador Intel i7',
      sku: 'DELL-XPS13-001',
      price: 1299.99,
      cost: 800.00,
      quantity: 15,
      minStockLevel: 5,
      categoryId: electronics.id,
      locationId: warehouse.id
    },
    {
      name: 'iPhone 15 Pro',
      description: 'Smartphone Apple con cámara profesional',
      sku: 'APPLE-IP15P-001',
      price: 999.99,
      cost: 650.00,
      quantity: 25,
      minStockLevel: 10,
      categoryId: electronics.id,
      locationId: store.id
    },
    {
      name: 'Camiseta Nike Dri-FIT',
      description: 'Camiseta deportiva de secado rápido',
      sku: 'NIKE-DRIFIT-001',
      price: 29.99,
      cost: 15.00,
      quantity: 50,
      minStockLevel: 20,
      categoryId: clothing.id,
      locationId: backroom.id
    },
    {
      name: 'Silla Ergonómica',
      description: 'Silla de oficina con soporte lumbar',
      sku: 'CHAIR-ERG-001',
      price: 199.99,
      cost: 120.00,
      quantity: 8,
      minStockLevel: 3,
      categoryId: home.id,
      locationId: warehouse.id
    },
    {
      name: 'Monitor 4K 27"',
      description: 'Monitor UHD 4K de 27 pulgadas',
      sku: 'MON-4K27-001',
      price: 399.99,
      cost: 250.00,
      quantity: 12,
      minStockLevel: 5,
      categoryId: electronics.id,
      locationId: warehouse.id
    }
  ];

  for (const productData of products) {
    const margin = ((productData.price - productData.cost) / productData.cost * 100);
    
    await prisma.inventoryItem.upsert({
      where: { sku: productData.sku },
      update: {},
      create: {
        ...productData,
        margin: margin,
        active: true
      }
    });
  }

  console.log('✅ Development database seeded successfully!');
  console.log('\n📋 Test Users Created:');
  console.log('  - alesierraalta@gmail.com / admin123 (Root Admin)');
  console.log('  - admin@lumo.dev / admin123 (Admin)');
  console.log('  - manager@lumo.dev / manager123 (Manager)');
  console.log('  - user@lumo.dev / user123 (User)');
  console.log('\n📦 Sample Data:');
  console.log('  - 3 Roles with permissions');
  console.log('  - 3 Categories');
  console.log('  - 3 Locations');
  console.log('  - 5 Sample products');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 