import { PrismaClient } from '@prisma/client';
import { serializeDecimal } from '../lib/utils';
import * as readline from 'readline';

const prisma = new PrismaClient();

/**
 * This script performs the following cleanup operations:
 * 1. Identifies products without inventory entries and creates them
 * 2. Identifies duplicate products and helps handle them 
 * 3. Shows a summary of the database state
 * 4. Automatically fixes duplicates if requested
 */

// Create readline interface for interactive questions
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

// Function to automatically merge duplicates
async function fixDuplicates(duplicateProducts: any[]) {
  console.log('\nStarting automatic duplicate fix process...');
  let fixedCount = 0;
  
  for (const { name, products } of duplicateProducts) {
    console.log(`\nProcessing duplicates for "${name}" (${products.length} entries found)`);
    
    // Sort products by creation date (keep the oldest) and inventory quantity (prefer ones with stock)
    const sortedProducts = [...products].sort((a, b) => {
      // First prioritize products with inventory
      const aHasInventory = a.inventory && a.inventory.quantity > 0;
      const bHasInventory = b.inventory && b.inventory.quantity > 0;
      
      if (aHasInventory && !bHasInventory) return -1;
      if (!aHasInventory && bHasInventory) return 1;
      
      // Then prioritize older products (assuming they're the original)
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
    
    // The product to keep is the first one after sorting
    const productToKeep = sortedProducts[0];
    const productsToMerge = sortedProducts.slice(1);
    
    console.log(`Keeping product: ID ${productToKeep.id}, SKU: ${productToKeep.sku}, Created: ${productToKeep.createdAt.toLocaleDateString()}`);
    console.log(`Merging ${productsToMerge.length} duplicate products into it...`);
    
    // Merge process
    for (const duplicate of productsToMerge) {
      try {
        // Begin transaction to ensure data integrity
        await prisma.$transaction(async (tx) => {
          // 1. Update any sales or inventory movements to reference the product we're keeping
          await tx.$executeRaw`
            UPDATE "sales_items" 
            SET "productId" = ${productToKeep.id}
            WHERE "productId" = ${duplicate.id}
          `;
          
          await tx.$executeRaw`
            UPDATE "inventory_movements" 
            SET "productId" = ${productToKeep.id}
            WHERE "productId" = ${duplicate.id}
          `;
          
          // 2. If the duplicate has inventory, merge it with the one we're keeping
          if (duplicate.inventory) {
            // If productToKeep doesn't have inventory yet, create it
            if (!productToKeep.inventory) {
              await tx.inventoryItem.create({
                data: {
                  productId: productToKeep.id,
                  quantity: duplicate.inventory.quantity,
                  minStockLevel: duplicate.inventory.minStockLevel
                }
              });
            } else {
              // Merge inventory quantities
              await tx.inventoryItem.update({
                where: { id: productToKeep.inventory.id },
                data: {
                  quantity: {
                    increment: duplicate.inventory.quantity
                  }
                }
              });
            }
            
            // Delete the duplicate's inventory
            await tx.inventoryItem.delete({
              where: { id: duplicate.inventory.id }
            });
          }
          
          // 3. Finally, delete the duplicate product
          await tx.product.delete({
            where: { id: duplicate.id }
          });
        });
        
        console.log(`✓ Successfully merged and removed duplicate ID: ${duplicate.id}`);
        fixedCount++;
      } catch (error) {
        console.error(`✗ Failed to merge duplicate ID: ${duplicate.id}`, error);
      }
    }
  }
  
  console.log(`\nDuplicate fix process completed. Successfully merged ${fixedCount} duplicate products.`);
  return fixedCount;
}

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
    const productsWithoutInventory = allProducts.filter((product: any) => !product.inventory);
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
      
      // Ask if user wants to automatically fix duplicates
      const autoFix = await question('\nDo you want to automatically fix duplicates? [y/N]: ');
      
      if (autoFix.toLowerCase() === 'y') {
        await fixDuplicates(duplicateProducts);
      } else {
        console.log('\nDuplicate products detected but not automatically removed.');
        console.log('To remove duplicates, use the following commands in the database:');
        console.log('Example: DELETE FROM products WHERE id = \'[duplicate-id-to-remove]\';');
      }
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
      
      // Ask if user wants to automatically fix orphaned records
      const autoFixOrphaned = await question('\nDo you want to automatically remove orphaned inventory records? [y/N]: ');
      
      if (autoFixOrphaned.toLowerCase() === 'y') {
        console.log('\nRemoving orphaned inventory records...');
        const ids = orphanedInventory.map(item => item.id);
        
        const result = await prisma.inventoryItem.deleteMany({
          where: {
            id: {
              in: ids
            }
          }
        });
        
        console.log(`Successfully removed ${result.count} orphaned inventory records.`);
      } else {
        console.log('\nTo clean up these orphaned records, run:');
        console.log('DELETE FROM inventory_items WHERE id IN (\'[orphaned-id-1]\', \'[orphaned-id-2]\', ...);');
      }
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
    console.log('1. Run this script periodically to maintain database integrity');
    console.log('2. Consider implementing database constraints to prevent data inconsistencies in the future');
  } catch (error) {
    console.error('Error during database cleanup:', error);
  } finally {
    rl.close();
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