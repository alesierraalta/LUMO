const https = require('https');

// Test configuration
const BASE_URL = 'https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev';
const TEST_CREDENTIALS = {
  email: 'alesierraalta@gmail.com',
  password: 'admin123'
};

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testInventoryDeletion() {
  console.log('🧪 Starting Inventory Deletion Test');
  console.log('=====================================');

  try {
    // Step 1: Login to get authentication token
    console.log('\n1️⃣ Logging in...');
    const loginOptions = {
      hostname: '42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev',
      port: 443,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const loginResponse = await makeRequest(loginOptions, TEST_CREDENTIALS);
    console.log('Login Status:', loginResponse.statusCode);
    console.log('Login Response:', loginResponse.body);

    if (loginResponse.statusCode !== 200) {
      throw new Error('Login failed');
    }

    const authToken = loginResponse.body.token;
    const cookies = loginResponse.headers['set-cookie'];
    console.log('✅ Login successful');
    console.log('Auth Token:', authToken ? 'Present' : 'Missing');
    console.log('Cookies:', cookies ? 'Present' : 'Missing');

    // Step 2: Get list of inventory items
    console.log('\n2️⃣ Getting inventory items...');
    const inventoryOptions = {
      hostname: '42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev',
      port: 443,
      path: '/api/products',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'Cookie': cookies ? cookies.join('; ') : ''
      }
    };

    const inventoryResponse = await makeRequest(inventoryOptions);
    console.log('Inventory Status:', inventoryResponse.statusCode);
    
    if (inventoryResponse.statusCode !== 200) {
      console.log('❌ Failed to get inventory items');
      console.log('Response:', inventoryResponse.body);
      return;
    }

    const items = inventoryResponse.body.data || inventoryResponse.body;
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
    const deleteOptions = {
      hostname: '42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev',
      port: 443,
      path: `/api/products/${activeItem.id}`,
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'Cookie': cookies ? cookies.join('; ') : ''
      }
    };

    console.log('DELETE URL:', `${BASE_URL}/api/products/${activeItem.id}`);
    console.log('Headers:', {
      'Authorization': authToken ? 'Bearer [TOKEN]' : 'Missing',
      'Cookie': cookies ? 'Present' : 'Missing'
    });

    const deleteResponse = await makeRequest(deleteOptions);
    console.log('\n🗑️ DELETE Response:');
    console.log('Status Code:', deleteResponse.statusCode);
    console.log('Response Body:', deleteResponse.body);

    if (deleteResponse.statusCode === 200) {
      console.log('✅ DELETE request successful');
      
      // Step 4: Verify the item was soft deleted
      console.log('\n4️⃣ Verifying soft delete...');
      const verifyOptions = {
        hostname: '42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev',
        port: 443,
        path: `/api/products/${activeItem.id}`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'Cookie': cookies ? cookies.join('; ') : ''
        }
      };

      const verifyResponse = await makeRequest(verifyOptions);
      console.log('Verify Status:', verifyResponse.statusCode);
      console.log('Verify Response:', verifyResponse.body);

      if (verifyResponse.statusCode === 200 && verifyResponse.body.isActive === false) {
        console.log('✅ Item successfully soft deleted (isActive = false)');
      } else if (verifyResponse.statusCode === 404) {
        console.log('✅ Item not found (hard deleted or filtered out)');
      } else {
        console.log('⚠️ Item deletion may not have worked as expected');
      }
    } else {
      console.log('❌ DELETE request failed');
      console.log('Error details:', deleteResponse.body);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }

  console.log('\n🏁 Test completed');
}

// Run the test
testInventoryDeletion().catch(console.error);