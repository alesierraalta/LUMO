/**
 * Simple API Test for Stock Adjustment
 * Tests the API endpoints directly without browser automation
 */

const fetch = require('node-fetch');

async function testStockAdjustmentAPI() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('🚀 Testing stock adjustment API endpoints...');
    
    // Wait for server to be ready
    console.log('⏳ Waiting for server to be ready...');
    let serverReady = false;
    let attempts = 0;
    
    while (!serverReady && attempts < 30) {
      try {
        const response = await fetch(`${baseUrl}/api/health`);
        if (response.ok) {
          serverReady = true;
        }
      } catch (error) {
        // Server not ready yet
      }
      
      if (!serverReady) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
        console.log(`⏳ Attempt ${attempts}/30...`);
      }
    }
    
    if (!serverReady) {
      throw new Error('Server did not start within expected time');
    }
    
    console.log('✅ Server is ready!');
    
    // First, get a list of inventory items to test with
    console.log('📋 Fetching inventory items...');
    const inventoryResponse = await fetch(`${baseUrl}/api/inventory`);
    
    if (!inventoryResponse.ok) {
      throw new Error(`Failed to fetch inventory: ${inventoryResponse.status}`);
    }
    
    const inventoryData = await inventoryResponse.json();
    
    if (!inventoryData.items || inventoryData.items.length === 0) {
      throw new Error('No inventory items found for testing');
    }
    
    const testItem = inventoryData.items[0];
    console.log(`📦 Testing with item: ${testItem.name} (ID: ${testItem.id})`);
    console.log(`📊 Initial stock: ${testItem.currentStock}`);
    
    // Test 1: Add Stock
    console.log('\n🔄 TEST 1: Adding stock via API...');
    const addQuantity = 10;
    
    const addStockResponse = await fetch(`${baseUrl}/api/inventory/${testItem.id}/add-stock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quantity: addQuantity,
        notes: 'API test - adding stock'
      })
    });
    
    const addStockResult = await addStockResponse.json();
    console.log(`📡 Add stock response (${addStockResponse.status}):`, addStockResult);
    
    if (addStockResponse.ok && addStockResult.success) {
      console.log('✅ Add stock API call successful');
      console.log(`📊 New stock level: ${addStockResult.item.currentStock}`);
      
      const expectedStock = testItem.currentStock + addQuantity;
      if (addStockResult.item.currentStock === expectedStock) {
        console.log('✅ Stock level correctly updated in database');
      } else {
        console.log(`❌ Stock level mismatch. Expected: ${expectedStock}, Got: ${addStockResult.item.currentStock}`);
      }
    } else {
      console.log('❌ Add stock API call failed');
    }
    
    // Test 2: Remove Stock
    console.log('\n🔄 TEST 2: Removing stock via API...');
    const removeQuantity = 5;
    
    const removeStockResponse = await fetch(`${baseUrl}/api/inventory/${testItem.id}/remove-stock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quantity: removeQuantity,
        notes: 'API test - removing stock'
      })
    });
    
    const removeStockResult = await removeStockResponse.json();
    console.log(`📡 Remove stock response (${removeStockResponse.status}):`, removeStockResult);
    
    if (removeStockResponse.ok && removeStockResult.success) {
      console.log('✅ Remove stock API call successful');
      console.log(`📊 New stock level: ${removeStockResult.item.currentStock}`);
      
      const expectedStock = (testItem.currentStock + addQuantity) - removeQuantity;
      if (removeStockResult.item.currentStock === expectedStock) {
        console.log('✅ Stock level correctly updated in database');
      } else {
        console.log(`❌ Stock level mismatch. Expected: ${expectedStock}, Got: ${removeStockResult.item.currentStock}`);
      }
    } else {
      console.log('❌ Remove stock API call failed');
    }
    
    // Final verification - fetch the item again to confirm persistence
    console.log('\n🔍 Final verification - fetching item again...');
    const finalResponse = await fetch(`${baseUrl}/api/inventory/${testItem.id}`);
    
    if (finalResponse.ok) {
      const finalItem = await finalResponse.json();
      console.log(`📊 Final stock level from database: ${finalItem.currentStock}`);
      
      const expectedFinalStock = testItem.currentStock + addQuantity - removeQuantity;
      if (finalItem.currentStock === expectedFinalStock) {
        console.log('✅ DATABASE PERSISTENCE TEST PASSED');
      } else {
        console.log(`❌ DATABASE PERSISTENCE TEST FAILED. Expected: ${expectedFinalStock}, Got: ${finalItem.currentStock}`);
      }
    } else {
      console.log('❌ Failed to fetch item for final verification');
    }
    
    console.log('\n📋 TEST SUMMARY:');
    console.log(`Initial stock: ${testItem.currentStock}`);
    console.log(`Added: ${addQuantity}`);
    console.log(`Removed: ${removeQuantity}`);
    console.log(`Expected final: ${testItem.currentStock + addQuantity - removeQuantity}`);
    
    console.log('\n🎉 API stock adjustment test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testStockAdjustmentAPI();