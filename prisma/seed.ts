import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding the database...');

  // Create some categories
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

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 