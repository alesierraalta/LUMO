import { PrismaClient } from '@prisma/client';
import { serializeDecimal } from '../lib/utils';

const prisma = new PrismaClient();

/**
 * This script performs the following cleanup operations:
 * 1. Identifies products without inventory entries and creates them
 * 2. Identifies duplicate products and helps handle them 
 * 3. Shows a summary of the database state
 */
async function cleanupDatabase() {
  console.log('Starting database cleanup process...');
  
  try {
    // 1. Get all products
    const allProducts = await prisma.product.findMany({
      include: {
        inventory: true,
        category: true,
      },
    });
    
    console.log(`Found ${allProducts.length} total products in the database`);
    
    // 2. Identify products without inventory entries
    const productsWithoutInventory = allProducts.filter(product => !product.inventory);
    console.log(`Found ${productsWithoutInventory.length} products without inventory entries`);
    
    if (productsWithoutInventory.length > 0) {
      console.log('\nProducts missing inventory entries:');
      productsWithoutInventory.forEach(product => {
        console.log(`- ID: ${product.id}, Name: ${product.name}, SKU: ${product.sku}`);
      });
      
      // 3. Create missing inventory entries
      console.log('\nCreating missing inventory entries...');
      let createdCount = 0;
      
      for (const product of productsWithoutInventory) {
        await prisma.inventoryItem.create({
          data: {
            productId: product.id,
            quantity: 0,
            minStockLevel: 5,  // Default min stock level
          }
        });
        createdCount++;
      }
      
      console.log(`Created ${createdCount} new inventory entries`);
    }
    
    // 4. Identify possible duplicate products (same name, different IDs)
    const productsByName = allProducts.reduce((acc, product) => {
      if (!acc[product.name]) {
        acc[product.name] = [];
      }
      acc[product.name].push(product);
      return acc;
    }, {} as Record<string, typeof allProducts>);
    
    const duplicateProducts = Object.entries(productsByName)
      .filter(([_, products]) => products.length > 1)
      .map(([name, products]) => ({ name, products }));
    
    console.log(`\nFound ${duplicateProducts.length} product names with potential duplicates`);
    
    if (duplicateProducts.length > 0) {
      console.log('\nPotential duplicate products:');
      duplicateProducts.forEach(({ name, products }) => {
        console.log(`\nProduct name: "${name}" has ${products.length} entries:`);
        products.forEach(product => {
          const categoryName = product.category?.name || 'No category';
          const inventoryStatus = product.inventory 
            ? `Inventory: ${product.inventory.quantity} in stock, Min level: ${product.inventory.minStockLevel}` 
            : 'No inventory record';
          
          console.log(`- ID: ${product.id}`);
          console.log(`  SKU: ${product.sku}`);
          console.log(`  Category: ${categoryName}`);
          console.log(`  Price: $${Number(product.price).toFixed(2)}, Cost: $${Number(product.cost).toFixed(2)}, Margin: ${Number(product.margin).toFixed(2)}%`);
          console.log(`  ${inventoryStatus}`);
          console.log(`  Created: ${product.createdAt.toLocaleDateString()}`);
        });
      });
      
      console.log('\nDuplicate products detected but not automatically removed.');
      console.log('To remove duplicates, use the following commands in the database:');
      console.log('Example: DELETE FROM products WHERE id = \'[duplicate-id-to-remove]\';');
    }
    
    // 5. Check for orphaned inventory records (inventory records that don't have valid products)
    const orphanedInventory = await prisma.$queryRaw<{ id: string, "productId": string }[]>`
      SELECT i.id, i."productId" 
      FROM "inventory_items" i 
      LEFT JOIN "products" p ON i."productId" = p.id 
      WHERE p.id IS NULL
    `;
    
    console.log(`\nFound ${orphanedInventory.length} orphaned inventory records`);
    
    if (orphanedInventory.length > 0) {
      console.log('\nOrphaned inventory records:');
      orphanedInventory.forEach(item => {
        console.log(`- ID: ${item.id}, Product ID (invalid): ${item.productId}`);
      });
      
      console.log('\nTo clean up these orphaned records, run:');
      console.log('DELETE FROM inventory_items WHERE id IN (\'[orphaned-id-1]\', \'[orphaned-id-2]\', ...);');
    }
    
    // 6. Provide a data integrity summary
    console.log('\n--------- Database Integrity Summary ---------');
    console.log(`Total products: ${allProducts.length}`);
    console.log(`Products with inventory: ${allProducts.length - productsWithoutInventory.length}`);
    console.log(`Products missing inventory: ${productsWithoutInventory.length} (fixed: ${productsWithoutInventory.length})`);
    console.log(`Potential duplicate product names: ${duplicateProducts.length}`);
    console.log(`Orphaned inventory records: ${orphanedInventory.length}`);
    console.log('--------------------------------------------');
    
    // 7. Provide instructions for next steps
    console.log('\nDatabase cleanup process completed!');
    console.log('\nNext steps:');
    console.log('1. Review the list of duplicate products and decide which ones to keep');
    console.log('2. After reviewing duplicates, you may want to delete unnecessary duplicates manually');
    console.log('3. Review any orphaned inventory records and clean them up if needed');
    console.log('4. Consider implementing database constraints to prevent data inconsistencies in the future');
  } catch (error) {
    console.error('Error during database cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup function
cleanupDatabase()
  .then(() => console.log('Script execution completed.'))
  .catch(e => {
    console.error('Script execution failed:', e);
    process.exit(1);
  }); 