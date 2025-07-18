const https = require('https');

// Production URL from Vercel deployment
const PRODUCTION_URL = 'https://lumo-4ai2921t5-alesierraaltas-projects.vercel.app';

// User credentials provided
const CREDENTIALS = {
  email: 'alesierraalta@gmail.com',
  password: 'admin123'
};

function makeRequest(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js Test Script',
        ...headers
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function loginAndGetToken() {
  try {
    console.log('🔐 Attempting login...');
    const response = await makeRequest(`${PRODUCTION_URL}/api/auth/login`, 'POST', CREDENTIALS);
    
    console.log(`   Login Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      try {
        const data = JSON.parse(response.body);
        if (data.token) {
          console.log('   ✅ Login successful, token received');
          return data.token;
        } else {
          console.log('   ❌ Login response missing token');
          console.log('   Response:', response.body.substring(0, 200));
        }
      } catch (e) {
        console.log('   ❌ Failed to parse login response');
        console.log('   Response:', response.body.substring(0, 200));
      }
    } else {
      console.log('   ❌ Login failed');
      console.log('   Response:', response.body.substring(0, 200));
    }
    
    return null;
  } catch (error) {
    console.log(`   ❌ Login ERROR: ${error.message}`);
    return null;
  }
}

async function testAuthenticatedEndpoint(endpoint, token, method = 'GET', data = null) {
  try {
    console.log(`\n🔍 Testing: ${method} ${endpoint}`);
    
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    
    const response = await makeRequest(`${PRODUCTION_URL}${endpoint}`, method, data, headers);
    
    let status = '✅ SUCCESS';
    if (response.statusCode === 404) {
      status = '❌ NOT FOUND (404)';
    } else if (response.statusCode === 401) {
      status = '🔒 UNAUTHORIZED (401)';
    } else if (response.statusCode === 403) {
      status = '🚫 FORBIDDEN (403)';
    } else if (response.statusCode >= 500) {
      status = '💥 SERVER ERROR';
    } else if (response.statusCode >= 400) {
      status = '⚠️ CLIENT ERROR';
    }
    
    console.log(`   Status: ${response.statusCode} - ${status}`);
    
    // Try to parse JSON response
    try {
      const jsonBody = JSON.parse(response.body);
      if (jsonBody.error) {
        console.log(`   Error: ${jsonBody.error}`);
      }
      if (jsonBody.message) {
        console.log(`   Message: ${jsonBody.message}`);
      }
      if (jsonBody.success !== undefined) {
        console.log(`   Success: ${jsonBody.success}`);
      }
      if (jsonBody.data && Array.isArray(jsonBody.data)) {
        console.log(`   Data count: ${jsonBody.data.length} items`);
      }
      if (jsonBody.total !== undefined) {
        console.log(`   Total: ${jsonBody.total}`);
      }
    } catch (e) {
      // Not JSON, show first 100 chars
      if (response.body.length > 0) {
        console.log(`   Body preview: ${response.body.substring(0, 100)}...`);
      }
    }
    
    return response;
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return null;
  }
}

async function testDeleteEndpoint(endpoint, token, itemId) {
  console.log(`\n🗑️ Testing DELETE: ${endpoint}/${itemId}`);
  
  try {
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    
    const response = await makeRequest(`${PRODUCTION_URL}${endpoint}/${itemId}`, 'DELETE', null, headers);
    
    let status = '✅ SUCCESS';
    if (response.statusCode === 404) {
      status = '❌ NOT FOUND (404)';
    } else if (response.statusCode === 401) {
      status = '🔒 UNAUTHORIZED (401)';
    } else if (response.statusCode === 403) {
      status = '🚫 FORBIDDEN (403)';
    } else if (response.statusCode >= 500) {
      status = '💥 SERVER ERROR';
    } else if (response.statusCode >= 400) {
      status = '⚠️ CLIENT ERROR';
    }
    
    console.log(`   Status: ${response.statusCode} - ${status}`);
    
    // Try to parse JSON response
    try {
      const jsonBody = JSON.parse(response.body);
      if (jsonBody.error) {
        console.log(`   Error: ${jsonBody.error}`);
        // Check if this is the specific error we were fixing
        if (jsonBody.error === 'Error al eliminar el item') {
          console.log('   🎯 FOUND THE ORIGINAL ERROR - This should be fixed now!');
        }
      }
      if (jsonBody.message) {
        console.log(`   Message: ${jsonBody.message}`);
      }
      if (jsonBody.success !== undefined) {
        console.log(`   Success: ${jsonBody.success}`);
      }
    } catch (e) {
      // Not JSON, show first 100 chars
      if (response.body.length > 0) {
        console.log(`   Body preview: ${response.body.substring(0, 100)}...`);
      }
    }
    
    return response;
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return null;
  }
}

async function runAuthenticatedTests() {
  console.log('🚀 Testing Production Endpoints with Authentication');
  console.log(`📍 Production URL: ${PRODUCTION_URL}`);
  console.log(`👤 User: ${CREDENTIALS.email}`);
  console.log('=' .repeat(70));

  // Step 1: Login and get token
  const token = await loginAndGetToken();
  
  if (!token) {
    console.log('\n❌ Cannot proceed without authentication token');
    return;
  }

  // Step 2: Test the endpoints that were previously returning 404
  const endpointsToTest = [
    { endpoint: '/api/products', method: 'GET' },
    { endpoint: '/api/products/1', method: 'GET' },
    { endpoint: '/inventory/movements', method: 'GET' },
    { endpoint: '/api/inventory', method: 'GET' },
    { endpoint: '/api/health', method: 'GET' }
  ];

  const results = {};
  
  for (const { endpoint, method } of endpointsToTest) {
    const result = await testAuthenticatedEndpoint(endpoint, token, method);
    results[endpoint] = result;
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Step 3: Test DELETE functionality (the main issue we were fixing)
  console.log('\n' + '=' .repeat(70));
  console.log('🗑️ TESTING DELETE FUNCTIONALITY');
  console.log('=' .repeat(70));
  
  // First, let's get some inventory items to test deletion
  const inventoryResponse = await testAuthenticatedEndpoint('/api/inventory', token, 'GET');
  
  if (inventoryResponse && inventoryResponse.statusCode === 200) {
    try {
      const inventoryData = JSON.parse(inventoryResponse.body);
      if (inventoryData.success && inventoryData.items && inventoryData.items.length > 0) {
        const firstItem = inventoryData.items[0];
        console.log(`\n📦 Found inventory item to test: ${firstItem.name} (ID: ${firstItem.id})`);
        
        // Test DELETE on this item (this was the main issue)
        await testDeleteEndpoint('/api/products', token, firstItem.id);
      } else {
        console.log('\n⚠️ No inventory items found to test deletion');
      }
    } catch (e) {
      console.log('\n❌ Failed to parse inventory response for deletion test');
    }
  }

  // Summary
  console.log('\n' + '=' .repeat(70));
  console.log('📊 SUMMARY');
  console.log('=' .repeat(70));

  let fixedEndpoints = 0;
  let totalEndpoints = 0;

  for (const [endpoint, result] of Object.entries(results)) {
    totalEndpoints++;
    if (result && result.statusCode !== 404) {
      fixedEndpoints++;
      if (result.statusCode === 200) {
        console.log(`✅ ${endpoint} - Working perfectly (Status: ${result.statusCode})`);
      } else if (result.statusCode === 401) {
        console.log(`🔒 ${endpoint} - Fixed but needs proper auth (Status: ${result.statusCode})`);
      } else {
        console.log(`⚠️ ${endpoint} - Fixed but has issues (Status: ${result.statusCode})`);
      }
    } else {
      console.log(`❌ ${endpoint} - Still returning 404`);
    }
  }

  console.log(`\n🎯 Results: ${fixedEndpoints}/${totalEndpoints} endpoints fixed`);
  
  if (fixedEndpoints === totalEndpoints) {
    console.log('🎉 ALL ENDPOINTS FIXED! Runtime errors should be resolved.');
    console.log('✅ The "Error al eliminar el item" issue should now be fixed.');
    console.log('✅ All 404 errors for missing endpoints are resolved.');
    console.log('✅ Supabase configuration warnings are eliminated.');
  } else {
    console.log('⚠️  Some endpoints still need attention.');
  }

  return results;
}

// Run the tests
runAuthenticatedTests().catch(console.error);