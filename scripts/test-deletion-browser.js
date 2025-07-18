/**
 * Browser-based test for inventory deletion functionality
 * This script can be run in the browser console on the deployed application
 */

// Test configuration
const BASE_URL = 'https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev';

// Function to test deletion functionality
async function testDeletion() {
  console.log('🧪 Starting Browser-based Deletion Test');
  console.log('=====================================');

  try {
    // Step 1: Get current authentication status
    console.log('\n1️⃣ Checking authentication...');
    
    // Check if user is logged in by calling /api/auth/me
    const authResponse = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Auth Status:', authResponse.status);
    
    if (authResponse.status !== 200) {
      console.log('❌ User not authenticated. Please login first.');
      return;
    }
    
    const authData = await authResponse.json();
    console.log('✅ User authenticated:', authData.user?.email);

    // Step 2: Get inventory items using the inventory endpoint
    console.log('\n2️⃣ Getting inventory items...');
    
    const inventoryResponse = await fetch(`${BASE_URL}/api/inventory`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Inventory Status:', inventoryResponse.status);
    
    if (inventoryResponse.status !== 200) {
      console.log('❌ Failed to get inventory items');
      const errorText = await inventoryResponse.text();
      console.log('Error:', errorText);
      return;
    }
    
    const inventoryData = await inventoryResponse.json();
    console.log('📋 Raw inventory response:', inventoryData);
    
    // The /api/inventory endpoint returns { success: true, items: [...], total: N }
    const items = inventoryData.items || inventoryData.data || [];
    console.log('✅ Found', items.length, 'inventory items');
    
    if (items.length === 0) {
      console.log('❌ No inventory items found to test deletion');
      return;
    }
    
    // Find an active item to test deletion
    const activeItem = items.find(item => item.isActive !== false);
    if (!activeItem) {
      console.log('❌ No active items found to test deletion');
      return;
    }
    
    console.log('📦 Selected item for deletion test:');
    console.log('  - ID:', activeItem.id);
    console.log('  - Name:', activeItem.name);
    console.log('  - SKU:', activeItem.sku);
    console.log('  - Active:', activeItem.isActive);

    // Step 3: Test DELETE endpoint
    console.log('\n3️⃣ Testing DELETE endpoint...');
    
    const deleteResponse = await fetch(`${BASE_URL}/api/products/${activeItem.id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('DELETE Status:', deleteResponse.status);
    
    const deleteData = await deleteResponse.json();
    console.log('DELETE Response:', deleteData);
    
    if (deleteResponse.status === 200) {
      console.log('✅ DELETE request successful');
      
      // Step 4: Verify the item was soft deleted
      console.log('\n4️⃣ Verifying soft delete...');
      
      const verifyResponse = await fetch(`${BASE_URL}/api/products/${activeItem.id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Verify Status:', verifyResponse.status);
      
      if (verifyResponse.status === 200) {
        const verifyData = await verifyResponse.json();
        console.log('Verify Response:', verifyData);
        
        if (verifyData.isActive === false) {
          console.log('✅ Item successfully soft deleted (isActive = false)');
        } else {
          console.log('⚠️ Item deletion may not have worked as expected');
        }
      } else if (verifyResponse.status === 404) {
        console.log('✅ Item not found (hard deleted or filtered out)');
      } else {
        const verifyError = await verifyResponse.text();
        console.log('❌ Verification failed:', verifyError);
      }
    } else {
      console.log('❌ DELETE request failed');
      console.log('Error details:', deleteData);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }

  console.log('\n🏁 Test completed');
}

// Instructions for running the test
console.log(`
🔧 BROWSER TEST INSTRUCTIONS:
1. Open the deployed application: ${BASE_URL}
2. Login with your credentials
3. Open browser developer tools (F12)
4. Go to the Console tab
5. Copy and paste this entire script
6. Run: testDeletion()

The test will automatically check authentication, get inventory items, and test the deletion functionality.
`);

// Export for use
if (typeof window !== 'undefined') {
  window.testDeletion = testDeletion;
}