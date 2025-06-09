const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function hashPassword(password) {
  return await bcrypt.hash(password, 12);
}

async function main() {
  console.log('🌱 Seeding development database...');

  // 1. Create development users with different roles
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@lumo.dev' },
    update: {
      password: await hashPassword('admin123'),
      role: 'ADMIN',
      isActive: true
    },
    create: {
      email: 'admin@lumo.dev',
      password: await hashPassword('admin123'),
      name: 'Admin User',
      role: 'ADMIN',
      isActive: true
    }
  });

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@lumo.dev' },
    update: {
      password: await hashPassword('manager123'),
      role: 'MANAGER',
      isActive: true
    },
    create: {
      email: 'manager@lumo.dev',
      password: await hashPassword('manager123'),
      name: 'Manager User',
      role: 'MANAGER',
      isActive: true
    }
  });

  const testUser = await prisma.user.upsert({
    where: { email: 'user@lumo.dev' },
    update: {
      password: await hashPassword('user123'),
      role: 'USER',
      isActive: true
    },
    create: {
      email: 'user@lumo.dev',
      password: await hashPassword('user123'),
      name: 'Test User',
      role: 'USER',
      isActive: true
    }
  });

  console.log(`✅ Created users: ${adminUser.email}, ${managerUser.email}, ${testUser.email}`);

  // 2. Create sample categories
  const electronics = await prisma.category.upsert({
    where: { name: 'Electronics' },
    update: {},
    create: {
      name: 'Electronics',
      description: 'Electronic devices and gadgets',
      createdById: adminUser.id
    }
  });

  const clothing = await prisma.category.upsert({
    where: { name: 'Clothing' },
    update: {},
    create: {
      name: 'Clothing',
      description: 'Apparel and accessories',
      createdById: adminUser.id
    }
  });

  const books = await prisma.category.upsert({
    where: { name: 'Books' },
    update: {},
    create: {
      name: 'Books',
      description: 'Books and educational materials',
      createdById: adminUser.id
    }
  });

  console.log(`✅ Created categories: ${electronics.name}, ${clothing.name}, ${books.name}`);

  // 3. Create sample locations
  const warehouse = await prisma.location.upsert({
    where: { name: 'Main Warehouse' },
    update: {},
    create: {
      name: 'Main Warehouse',
      description: 'Primary storage facility',
      isActive: true
    }
  });

  const storefront = await prisma.location.upsert({
    where: { name: 'Storefront' },
    update: {},
    create: {
      name: 'Storefront',
      description: 'Retail store location',
      isActive: true
    }
  });

  console.log(`✅ Created locations: ${warehouse.name}, ${storefront.name}`);

  // 4. Create sample inventory items
  const laptop = await prisma.inventoryItem.upsert({
    where: { sku: 'LAPTOP001' },
    update: {},
    create: {
      name: 'Dell Laptop i5',
      description: 'Dell Inspiron laptop with Intel i5 processor',
      sku: 'LAPTOP001',
      barcode: '123456789012',
      currentStock: 10,
      minLevel: 2,
      maxLevel: 20,
      cost: 450.00,
      price: 699.99,
      isActive: true,
      categoryId: electronics.id,
      locationId: warehouse.id,
      createdById: adminUser.id
    }
  });

  const tshirt = await prisma.inventoryItem.upsert({
    where: { sku: 'TSHIRT001' },
    update: {},
    create: {
      name: 'Basic T-Shirt',
      description: 'Cotton basic t-shirt in various sizes',
      sku: 'TSHIRT001',
      barcode: '234567890123',
      currentStock: 50,
      minLevel: 10,
      maxLevel: 100,
      cost: 8.00,
      price: 19.99,
      isActive: true,
      categoryId: clothing.id,
      locationId: storefront.id,
      createdById: adminUser.id
    }
  });

  const book = await prisma.inventoryItem.upsert({
    where: { sku: 'BOOK001' },
    update: {},
    create: {
      name: 'JavaScript Guide',
      description: 'Complete guide to modern JavaScript development',
      sku: 'BOOK001',
      barcode: '345678901234',
      currentStock: 25,
      minLevel: 5,
      maxLevel: 50,
      cost: 20.00,
      price: 39.99,
      isActive: true,
      categoryId: books.id,
      locationId: warehouse.id,
      createdById: adminUser.id
    }
  });

  console.log(`✅ Created inventory items: ${laptop.name}, ${tshirt.name}, ${book.name}`);

  // 5. Create sample stock movements
  await prisma.stockMovement.create({
    data: {
      type: 'IN',
      quantity: 10,
      previousStock: 0,
      newStock: 10,
      cost: 450.00,
      reason: 'Initial stock',
      notes: 'Initial inventory setup',
      inventoryItemId: laptop.id,
      locationId: warehouse.id,
      createdById: adminUser.id
    }
  });

  await prisma.stockMovement.create({
    data: {
      type: 'IN',
      quantity: 50,
      previousStock: 0,
      newStock: 50,
      cost: 8.00,
      reason: 'Initial stock',
      notes: 'Initial inventory setup',
      inventoryItemId: tshirt.id,
      locationId: storefront.id,
      createdById: adminUser.id
    }
  });

  console.log('✅ Created sample stock movements');

  // 6. Create a sample sale
  const sale = await prisma.sale.create({
    data: {
      total: 59.98,
      tax: 4.80,
      discount: 0,
      status: 'COMPLETED',
      notes: 'Sample sale for testing',
      createdById: managerUser.id,
      items: {
        create: [
          {
            quantity: 2,
            price: 19.99,
            total: 39.98,
            inventoryItemId: tshirt.id
          },
          {
            quantity: 1,
            price: 19.99,
            total: 19.99,
            inventoryItemId: book.id
          }
        ]
      }
    },
    include: {
      items: true
    }
  });

  console.log(`✅ Created sample sale with ${sale.items.length} items`);

  console.log('\n🎉 Development database seeded successfully!');
  console.log('\n👥 Test users created:');
  console.log('   - admin@lumo.dev / admin123 (ADMIN role)');
  console.log('   - manager@lumo.dev / manager123 (MANAGER role)');
  console.log('   - user@lumo.dev / user123 (USER role)');
  console.log('\n📦 Sample data created:');
  console.log('   - 3 categories (Electronics, Clothing, Books)');
  console.log('   - 2 locations (Main Warehouse, Storefront)');
  console.log('   - 3 inventory items with stock');
  console.log('   - Stock movements and a sample sale');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 