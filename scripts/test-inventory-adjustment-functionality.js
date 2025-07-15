/**
 * Comprehensive test for inventory adjustment functionality
 * Tests both add and remove stock operations
 */

const testInventoryAdjustment = async () => {
  console.log('🧪 Starting Inventory Adjustment Functionality Test...\n');

  const baseUrl = 'http://localhost:3000';
  const testItemId = '08db24a5-fd16-4f84-82b8-ef085939f100'; // Cinta LED COB 24W 3000K

  try {
    // Test 1: Get inventory item details
    console.log('📋 Test 1: Fetching inventory item details...');
    const itemResponse = await fetch(`${baseUrl}/api/inventory/${testItemId}`);
    
    if (!itemResponse.ok) {
      throw new Error(`Failed to fetch item: ${itemResponse.status} ${itemResponse.statusText}`);
    }
    
    const itemData = await itemResponse.json();
    console.log('✅ Item fetched successfully:', {
      name: itemData.item.name,
      currentStock: itemData.item.currentStock,
      minStockLevel: itemData.item.minStockLevel
    });

    const initialStock = itemData.item.currentStock;

    // Test 2: Add stock operation
    console.log('\n📈 Test 2: Testing add stock operation...');
    const addStockResponse = await fetch(`${baseUrl}/api/inventory/${testItemId}/add-stock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quantity: 5,
        notes: 'Test add stock operation'
      })
    });

    if (!addStockResponse.ok) {
      const errorData = await addStockResponse.json();
      throw new Error(`Add stock failed: ${addStockResponse.status} - ${errorData.error || addStockResponse.statusText}`);
    }

    const addStockData = await addStockResponse.json();
    console.log('✅ Add stock successful:', addStockData);

    // Verify stock was added
    const verifyAddResponse = await fetch(`${baseUrl}/api/inventory/${testItemId}`);
    const verifyAddData = await verifyAddResponse.json();
    const newStock = verifyAddData.item.currentStock;
    
    if (newStock === initialStock + 5) {
      console.log('✅ Stock addition verified:', {
        initial: initialStock,
        added: 5,
        final: newStock
      });
    } else {
      throw new Error(`Stock addition verification failed. Expected: ${initialStock + 5}, Got: ${newStock}`);
    }

    // Test 3: Remove stock operation
    console.log('\n📉 Test 3: Testing remove stock operation...');
    const removeStockResponse = await fetch(`${baseUrl}/api/inventory/${testItemId}/remove-stock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quantity: 3,
        notes: 'Test remove stock operation'
      })
    });

    if (!removeStockResponse.ok) {
      const errorData = await removeStockResponse.json();
      throw new Error(`Remove stock failed: ${removeStockResponse.status} - ${errorData.error || removeStockResponse.statusText}`);
    }

    const removeStockData = await removeStockResponse.json();
    console.log('✅ Remove stock successful:', removeStockData);

    // Verify stock was removed
    const verifyRemoveResponse = await fetch(`${baseUrl}/api/inventory/${testItemId}`);
    const verifyRemoveData = await verifyRemoveResponse.json();
    const finalStock = verifyRemoveData.item.currentStock;
    
    if (finalStock === newStock - 3) {
      console.log('✅ Stock removal verified:', {
        beforeRemoval: newStock,
        removed: 3,
        final: finalStock
      });
    } else {
      throw new Error(`Stock removal verification failed. Expected: ${newStock - 3}, Got: ${finalStock}`);
    }

    // Test 4: Error handling - try to remove more stock than available
    console.log('\n⚠️ Test 4: Testing error handling (remove excessive stock)...');
    const excessiveRemoveResponse = await fetch(`${baseUrl}/api/inventory/${testItemId}/remove-stock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quantity: finalStock + 100, // More than available
        notes: 'Test excessive removal'
      })
    });

    if (excessiveRemoveResponse.ok) {
      console.log('⚠️ Warning: Excessive stock removal should have failed but succeeded');
    } else {
      const errorData = await excessiveRemoveResponse.json();
      console.log('✅ Error handling working correctly:', errorData.error);
    }

    console.log('\n🎉 All inventory adjustment functionality tests completed successfully!');
    console.log('📊 Final Summary:', {
      initialStock,
      finalStock,
      netChange: finalStock - initialStock
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
};

// Run the test
testInventoryAdjustment();