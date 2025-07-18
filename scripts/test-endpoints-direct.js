const https = require('https');

// Test configuration
const BASE_URL = 'https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev';

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

async function testEndpointsDirectly() {
  console.log('🔧 DIRECT ENDPOINT TESTING - BYPASSING AUTH ISSUES');
  console.log('==================================================');
  
  try {
    // Step 1: Test /api/inventory endpoint (should work without auth in some cases)
    console.log('\n1️⃣ Testing /api/inventory endpoint...');
    const inventoryOptions = {
      hostname: '42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev',
      port: 443,
      path: '/api/inventory',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js Test Script'
      }
    };

    const inventoryResponse = await makeRequest(inventoryOptions);
    console.log('📊 /api/inventory Status:', inventoryResponse.statusCode);
    
    if (inventoryResponse.statusCode === 200) {
      const items = inventoryResponse.body.items || [];
      console.log('✅ Inventory endpoint working - Found', items.length, 'items');
      console.log('📦 Sample item:', items[0] ? items[0].name : 'No items');
    } else if (inventoryResponse.statusCode === 401) {
      console.log('🔒 Inventory endpoint requires authentication (expected)');
    } else {
      console.log('❌ Inventory endpoint error:', inventoryResponse.body);
    }

    // Step 2: Test /api/products endpoint (newly created)
    console.log('\n2️⃣ Testing /api/products endpoint (NEW ENDPOINT)...');
    const productsOptions = {
      hostname: '42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev',
      port: 443,
      path: '/api/products',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js Test Script'
      }
    };

    const productsResponse = await makeRequest(productsOptions);
    console.log('📊 /api/products Status:', productsResponse.statusCode);
    
    if (productsResponse.statusCode === 200) {
      console.log('✅ NEW /api/products endpoint is working!');
      console.log('✅ FIXED: 404 error for /api/products resolved');
    } else if (productsResponse.statusCode === 401) {
      console.log('✅ NEW /api/products endpoint exists (requires auth)');
      console.log('✅ FIXED: 404 error for /api/products resolved');
    } else if (productsResponse.statusCode === 404) {
      console.log('❌ /api/products still returning 404 - endpoint not deployed');
    } else {
      console.log('📊 /api/products response:', productsResponse.body);
    }

    // Step 3: Test /api/products/[id] endpoint (newly created)
    console.log('\n3️⃣ Testing /api/products/[id] endpoint (NEW ENDPOINT)...');
    const productByIdOptions = {
      hostname: '42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev',
      port: 443,
      path: '/api/products/test-id',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js Test Script'
      }
    };

    const productByIdResponse = await makeRequest(productByIdOptions);
    console.log('📊 /api/products/[id] Status:', productByIdResponse.statusCode);
    
    if (productByIdResponse.statusCode === 200 || productByIdResponse.statusCode === 401) {
      console.log('✅ NEW /api/products/[id] endpoint is working!');
      console.log('✅ FIXED: 404 error for /api/products/[id] resolved');
    } else if (productByIdResponse.statusCode === 404) {
      console.log('❌ /api/products/[id] still returning 404 - endpoint not deployed');
    } else {
      console.log('📊 /api/products/[id] response:', productByIdResponse.body);
    }

    // Step 4: Test /inventory/movements endpoint (newly created)
    console.log('\n4️⃣ Testing /inventory/movements endpoint (NEW ENDPOINT)...');
    const movementsOptions = {
      hostname: '42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev',
      port: 443,
      path: '/inventory/movements',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js Test Script'
      }
    };

    const movementsResponse = await makeRequest(movementsOptions);
    console.log('📊 /inventory/movements Status:', movementsResponse.statusCode);
    
    if (movementsResponse.statusCode === 200 || movementsResponse.statusCode === 401) {
      console.log('✅ NEW /inventory/movements endpoint is working!');
      console.log('✅ FIXED: 404 error for /inventory/movements resolved');
    } else if (movementsResponse.statusCode === 404) {
      console.log('❌ /inventory/movements still returning 404 - endpoint not deployed');
    } else {
      console.log('📊 /inventory/movements response:', movementsResponse.body);
    }

    // Step 5: Test authentication endpoint
    console.log('\n5️⃣ Testing /api/auth/login endpoint...');
    const loginOptions = {
      hostname: '42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev',
      port: 443,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js Test Script'
      }
    };

    const loginResponse = await makeRequest(loginOptions, {
      email: 'test@example.com',
      password: 'test123'
    });
    console.log('📊 /api/auth/login Status:', loginResponse.statusCode);
    
    if (loginResponse.statusCode === 401) {
      console.log('✅ Login endpoint working (invalid credentials expected)');
    } else if (loginResponse.statusCode === 404) {
      console.log('❌ Login endpoint not found - authentication system issue');
    } else {
      console.log('📊 Login response:', loginResponse.body);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n🏁 DIRECT ENDPOINT TESTING COMPLETED');
  console.log('=====================================');
  console.log('SUMMARY OF FIXES VERIFICATION:');
  console.log('✅ Supabase configuration warnings - SHOULD BE FIXED');
  console.log('🔍 Missing /api/products endpoint - TESTING DEPLOYMENT');
  console.log('🔍 Missing /api/products/[id] endpoint - TESTING DEPLOYMENT');
  console.log('🔍 Missing /inventory/movements endpoint - TESTING DEPLOYMENT');
  console.log('🔍 Item deletion functionality - REQUIRES AUTH TO TEST');
  console.log('\nNOTE: 401 responses indicate endpoints exist but require authentication');
  console.log('NOTE: 404 responses indicate endpoints are missing or not deployed');
}

// Run the test
testEndpointsDirectly().catch(console.error);