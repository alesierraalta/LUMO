import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding the database...');

  // Clear existing data
  await prisma.rolePermission.deleteMany({}).catch(() => console.log('No rolePermissions to delete'));
  await prisma.permission.deleteMany({}).catch(() => console.log('No permissions to delete'));
  await prisma.user.deleteMany({}).catch(() => console.log('No users to delete'));
  await prisma.role.deleteMany({}).catch(() => console.log('No roles to delete'));
  await prisma.stockMovement.deleteMany({}).catch(() => console.log('No stockMovements to delete'));
  await prisma.inventoryItem.deleteMany({}).catch(() => console.log('No inventoryItems to delete'));
  await prisma.category.deleteMany({}).catch(() => console.log('No categories to delete'));

  // Create roles
  console.log('Creating roles...');
  const adminRole = await prisma.role.create({
    data: {
      name: 'admin',
      description: 'Administrator with full system access',
    },
  });

  const managerRole = await prisma.role.create({
    data: {
      name: 'manager',
      description: 'Manager with access to inventory and reports',
    },
  });

  const operatorRole = await prisma.role.create({
    data: {
      name: 'operator',
      description: 'Operator with basic inventory operations',
    },
  });

  const viewerRole = await prisma.role.create({
    data: {
      name: 'viewer',
      description: 'Viewer with read-only access',
    },
  });

  // Create permissions
  console.log('Creating permissions...');
  const permissions = await Promise.all([
    // Inventory permissions
    prisma.permission.create({
      data: { name: 'inventory:create', description: 'Create inventory items', resource: 'inventory', action: 'create' },
    }),
    prisma.permission.create({
      data: { name: 'inventory:read', description: 'View inventory items', resource: 'inventory', action: 'read' },
    }),
    prisma.permission.create({
      data: { name: 'inventory:update', description: 'Update inventory items', resource: 'inventory', action: 'update' },
    }),
    prisma.permission.create({
      data: { name: 'inventory:delete', description: 'Delete inventory items', resource: 'inventory', action: 'delete' },
    }),
    prisma.permission.create({
      data: { name: 'inventory:adjust', description: 'Adjust inventory stock', resource: 'inventory', action: 'adjust' },
    }),

    // Category permissions
    prisma.permission.create({
      data: { name: 'category:create', description: 'Create categories', resource: 'category', action: 'create' },
    }),
    prisma.permission.create({
      data: { name: 'category:read', description: 'View categories', resource: 'category', action: 'read' },
    }),
    prisma.permission.create({
      data: { name: 'category:update', description: 'Update categories', resource: 'category', action: 'update' },
    }),
    prisma.permission.create({
      data: { name: 'category:delete', description: 'Delete categories', resource: 'category', action: 'delete' },
    }),

    // Report permissions
    prisma.permission.create({
      data: { name: 'report:sales', description: 'View sales reports', resource: 'report', action: 'sales' },
    }),
    prisma.permission.create({
      data: { name: 'report:margins', description: 'View margin reports', resource: 'report', action: 'margins' },
    }),
    prisma.permission.create({
      data: { name: 'report:low-stock', description: 'View low stock reports', resource: 'report', action: 'low-stock' },
    }),

    // User permissions
    prisma.permission.create({
      data: { name: 'user:create', description: 'Create users', resource: 'user', action: 'create' },
    }),
    prisma.permission.create({
      data: { name: 'user:read', description: 'View users', resource: 'user', action: 'read' },
    }),
    prisma.permission.create({
      data: { name: 'user:update', description: 'Update users', resource: 'user', action: 'update' },
    }),
    prisma.permission.create({
      data: { name: 'user:delete', description: 'Delete users', resource: 'user', action: 'delete' },
    }),
    prisma.permission.create({
      data: { name: 'user:assign-roles', description: 'Assign roles to users', resource: 'user', action: 'assign-roles' },
    }),
  ]);

  // Assign permissions to roles
  console.log('Assigning permissions to roles...');
  // Admin: All permissions
  await Promise.all(
    permissions.map((permission) =>
      prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      })
    )
  );

  // Manager: All except user management
  await Promise.all(
    permissions
      .filter((p) => !p.name.startsWith('user:'))
      .map((permission) =>
        prisma.rolePermission.create({
          data: {
            roleId: managerRole.id,
            permissionId: permission.id,
          },
        })
      )
  );

  // Operator: Basic inventory operations, no delete
  const operatorPermissions = permissions.filter(
    (p) =>
      (p.name.startsWith('inventory:') && p.name !== 'inventory:delete') ||
      (p.name.startsWith('category:') && p.name !== 'category:delete') ||
      p.name === 'report:low-stock'
  );
  
  await Promise.all(
    operatorPermissions.map((permission) =>
      prisma.rolePermission.create({
        data: {
          roleId: operatorRole.id,
          permissionId: permission.id,
        },
      })
    )
  );

  // Viewer: Read-only permissions
  const viewerPermissions = permissions.filter(
    (p) => p.name.endsWith(':read') || p.name.startsWith('report:')
  );
  
  await Promise.all(
    viewerPermissions.map((permission) =>
      prisma.rolePermission.create({
        data: {
          roleId: viewerRole.id,
          permissionId: permission.id,
        },
      })
    )
  );

  // Create some categories
  console.log('Creating categories...');
  const electronicsCategory = await prisma.category.create({
    data: {
      name: 'Electrónica',
      description: 'Productos electrónicos y gadgets',
    },
  });

  const officeCategory = await prisma.category.create({
    data: {
      name: 'Oficina',
      description: 'Artículos de oficina y papelería',
    },
  });

  // Crear fechas diferentes para cada producto
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  // Create some inventory items
  console.log('Creating inventory items...');
  await prisma.inventoryItem.create({
    data: {
      name: 'Monitor 24"',
      description: 'Monitor LED 24 pulgadas Full HD',
      sku: 'MON-24-001',
      price: 199.99,
      cost: 149.99,
      margin: 33.34,
      quantity: 15,
      minStockLevel: 5,
      location: 'Almacén A1',
      categoryId: electronicsCategory.id,
      lastUpdated: now, // Fecha actual
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.inventoryItem.create({
    data: {
      name: 'Teclado Mecánico',
      description: 'Teclado mecánico RGB para gaming',
      sku: 'TEC-MEC-001',
      price: 89.99,
      cost: 59.99,
      margin: 50.01,
      quantity: 30,
      minStockLevel: 10,
      location: 'Almacén A2',
      categoryId: electronicsCategory.id,
      lastUpdated: yesterday, // Ayer
      createdAt: yesterday,
      updatedAt: yesterday,
    },
  });

  await prisma.inventoryItem.create({
    data: {
      name: 'Cuaderno A4',
      description: 'Cuaderno de 100 hojas A4 cuadriculado',
      sku: 'PAP-A4-001',
      price: 4.99,
      cost: 2.49,
      margin: 100.40,
      quantity: 100,
      minStockLevel: 20,
      location: 'Almacén B1',
      categoryId: officeCategory.id,
      lastUpdated: twoDaysAgo, // Hace dos días
      createdAt: twoDaysAgo,
      updatedAt: twoDaysAgo,
    },
  });

  await prisma.inventoryItem.create({
    data: {
      name: 'Bolígrafos (pack 10)',
      description: 'Pack de 10 bolígrafos de tinta azul',
      sku: 'PAP-BOL-010',
      price: 9.99,
      cost: 5.99,
      margin: 66.78,
      quantity: 50,
      minStockLevel: 15,
      location: 'Almacén B2',
      categoryId: officeCategory.id,
      lastUpdated: threeDaysAgo, // Hace tres días
      createdAt: threeDaysAgo,
      updatedAt: threeDaysAgo,
    },
  });

  // Create a few stock movements
  console.log('Creating stock movements...');
  await prisma.stockMovement.create({
    data: {
      inventoryItemId: (await prisma.inventoryItem.findFirst({ where: { sku: 'MON-24-001' } }))!.id,
      quantity: 15,
      type: 'INITIAL',
      notes: 'Stock inicial',
      date: now,
    },
  });

  await prisma.stockMovement.create({
    data: {
      inventoryItemId: (await prisma.inventoryItem.findFirst({ where: { sku: 'TEC-MEC-001' } }))!.id,
      quantity: 30,
      type: 'INITIAL',
      notes: 'Stock inicial',
      date: yesterday,
    },
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 