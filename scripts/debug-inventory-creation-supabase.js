/**
 * Debug Inventory Creation with Supabase
 * Test the exact inventory creation flow to identify the issue
 */

const BASE_URL = 'http://localhost:3000';

async function testInventoryCreation() {
  console.log('🔧 Testing Inventory Creation with Supabase');
  console.log('='.repeat(50));
  
  try {
    // First, create a test category
    console.log('\n1. Creating test category...');
    const timestamp = Date.now();
    const categoryResponse = await fetch(`${BASE_URL}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Debug Category ${timestamp}`,
        description: 'For debugging inventory creation'
      })
    });
    
    const categoryResult = await categoryResponse.json();
    console.log('Category response:', JSON.stringify(categoryResult, null, 2));
    
    if (!categoryResult.success) {
      console.error('❌ Failed to create category');
      return;
    }
    
    const categoryId = categoryResult.category.id;
    
    // Next, create a test location
    console.log('\n2. Creating test location...');
    const locationResponse = await fetch(`${BASE_URL}/api/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Debug Location ${timestamp}`,
        description: 'For debugging inventory creation'
      })
    });
    
    const locationResult = await locationResponse.json();
    console.log('Location response:', JSON.stringify(locationResult, null, 2));
    
    if (!locationResult.success) {
      console.error('❌ Failed to create location');
      return;
    }
    
    const locationId = locationResult.location.id;
    
    // Now test inventory creation
    console.log('\n3. Creating inventory item...');
    const inventoryData = {
      name: 'Debug Product',
      description: 'Product for debugging',
      sku: `DEBUG-${timestamp}`,
      categoryId: categoryId,
      locationId: locationId,
      currentStock: 100,
      minStockLevel: 10,
      maxLevel: 500,
      unitPrice: 25.99
    };
    
    console.log('Sending inventory data:', JSON.stringify(inventoryData, null, 2));
    
    const inventoryResponse = await fetch(`${BASE_URL}/api/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inventoryData)
    });
    
    console.log('Inventory response status:', inventoryResponse.status);
    console.log('Inventory response headers:', Object.fromEntries(inventoryResponse.headers.entries()));
    
    const inventoryResult = await inventoryResponse.json();
    console.log('Inventory response:', JSON.stringify(inventoryResult, null, 2));
    
    if (inventoryResult.success) {
      console.log('✅ Inventory creation successful!');
      console.log('Created item ID:', inventoryResult.item.id);
    } else {
      console.log('❌ Inventory creation failed');
      console.log('Error:', inventoryResult.error);
    }
    
    // Cleanup - Delete in proper order to respect foreign key constraints
    console.log('\n4. Cleaning up...');
    
    // 1. Delete inventory item first (it references category and location)
    if (inventoryResult.success && inventoryResult.item) {
      try {
        const deleteInventoryResponse = await fetch(`${BASE_URL}/api/inventory/${inventoryResult.item.id}`, { method: 'DELETE' });
        console.log(`✅ Inventory deletion status: ${deleteInventoryResponse.status}`);
      } catch (error) {
        console.error('❌ Error deleting inventory:', error.message);
      }
    }
    
    // 2. Delete location (no longer referenced by inventory)
    try {
      const deleteLocationResponse = await fetch(`${BASE_URL}/api/locations/${locationId}`, { method: 'DELETE' });
      console.log(`✅ Location deletion status: ${deleteLocationResponse.status}`);
    } catch (error) {
      console.error('❌ Error deleting location:', error.message);
    }
    
    // 3. Delete category (no longer referenced by inventory)
    try {
      const deleteCategoryResponse = await fetch(`${BASE_URL}/api/categories/${categoryId}`, { method: 'DELETE' });
      console.log(`✅ Category deletion status: ${deleteCategoryResponse.status}`);
    } catch (error) {
      console.error('❌ Error deleting category:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testInventoryCreation();