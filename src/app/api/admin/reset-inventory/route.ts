import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-supabase';

/**
 * DELETE /api/admin/reset-inventory
 * 
 * Deletes ALL products, categories, locations, and stock movements from the database.
 * This is a destructive operation that resets the inventory to 0.
 *
 * Order of deletion (respecting foreign key constraints):
 * 1. Stock movements (references inventory items)
 * 2. Inventory items/products (references categories and locations)
 * 3. Categories (referenced by inventory items)
 * 4. Locations (referenced by inventory items)
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Starting inventory reset operation...');

    // Get counts before deletion for reporting
    const initialCounts = {
      stockMovements: await db.stockMovement.count(),
      inventoryItems: await db.inventoryItem.count(),
      categories: await db.category.count(),
      locations: await db.location.count()
    };

    console.log('📊 Initial counts:', initialCounts);

    // Step 1: Delete all stock movements
    console.log('🗑️ Step 1: Deleting all stock movements...');
    await db.stockMovement.deleteMany({ deleteAll: true });
    const remainingStockMovements = await db.stockMovement.count();
    console.log(`✅ Stock movements deleted. Remaining: ${remainingStockMovements}`);

    // Step 2: Delete all inventory items/products
    console.log('🗑️ Step 2: Deleting all inventory items...');
    await db.inventoryItem.deleteMany({ deleteAll: true });
    const remainingInventoryItems = await db.inventoryItem.count();
    console.log(`✅ Inventory items deleted. Remaining: ${remainingInventoryItems}`);

    // Step 3: Delete all categories
    console.log('🗑️ Step 3: Deleting all categories...');
    await db.category.deleteMany({ deleteAll: true });
    const remainingCategories = await db.category.count();
    console.log(`✅ Categories deleted. Remaining: ${remainingCategories}`);

    // Step 4: Delete all locations
    console.log('🗑️ Step 4: Deleting all locations...');
    await db.location.deleteMany({ deleteAll: true });
    const remainingLocations = await db.location.count();
    console.log(`✅ Locations deleted. Remaining: ${remainingLocations}`);

    // Final verification - all counts should be 0
    const finalCounts = {
      stockMovements: await db.stockMovement.count(),
      inventoryItems: await db.inventoryItem.count(),
      categories: await db.category.count(),
      locations: await db.location.count()
    };

    console.log('📊 Final counts:', finalCounts);

    const response = {
      success: true,
      message: 'Inventory reset completed successfully',
      deletedCounts: {
        stockMovements: initialCounts.stockMovements,
        inventoryItems: initialCounts.inventoryItems,
        categories: initialCounts.categories,
        locations: initialCounts.locations
      },
      finalCounts,
      timestamp: new Date().toISOString()
    };

    console.log('✅ Inventory reset operation completed:', response);

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('❌ Inventory reset operation failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to reset inventory',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * GET /api/admin/reset-inventory
 * 
 * Returns current inventory counts without performing any deletions.
 * Useful for checking the current state before resetting.
 */
export async function GET(request: NextRequest) {
  try {
    const counts = {
      stockMovements: await db.stockMovement.count(),
      inventoryItems: await db.inventoryItem.count(),
      categories: await db.category.count(),
      locations: await db.location.count()
    };

    return NextResponse.json({
      success: true,
      message: 'Current inventory counts',
      counts,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Failed to get inventory counts:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to get inventory counts',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}