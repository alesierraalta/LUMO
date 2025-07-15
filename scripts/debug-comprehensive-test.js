/**
 * LUMO - Debug Comprehensive Test
 * 
 * Diagnostic script to identify issues with API endpoints
 * and response structures before running full comprehensive test
 */

const BASE_URL = 'http://localhost:3000';

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`\n🔍 Making request to: ${url}`);
  console.log(`📤 Method: ${options.method || 'GET'}`);
  if (options.body) {
    console.log(`📤 Body: ${options.body}`);
  }
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    
    console.log(`📥 Status: ${response.status}`);
    console.log(`📥 Response:`, JSON.stringify(data, null, 2));
    
    return { response, data, status: response.status };
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { error: error.message, status: 0 };
  }
}

async function debugCategories() {
  console.log('\n' + '='.repeat(50));
  console.log('🧪 DEBUGGING CATEGORIES');
  console.log('='.repeat(50));
  
  // Test GET categories first
  await makeRequest('/api/categories');
  
  // Test POST category
  await makeRequest('/api/categories', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Debug Category',
      description: 'Category for debugging'
    })
  });
}

async function debugLocations() {
  console.log('\n' + '='.repeat(50));
  console.log('🧪 DEBUGGING LOCATIONS');
  console.log('='.repeat(50));
  
  // Test GET locations first
  await makeRequest('/api/locations');
  
  // Test POST location
  await makeRequest('/api/locations', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Debug Location',
      description: 'Location for debugging'
    })
  });
}

async function debugInventory() {
  console.log('\n' + '='.repeat(50));
  console.log('🧪 DEBUGGING INVENTORY');
  console.log('='.repeat(50));
  
  // Test GET inventory first
  await makeRequest('/api/inventory');
  
  // Test POST inventory (this will likely fail without category/location)
  await makeRequest('/api/inventory', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Debug Product',
      description: 'Product for debugging',
      sku: 'DEBUG-001',
      categoryId: 1, // Assuming ID 1 exists
      locationId: 1, // Assuming ID 1 exists
      quantity: 100,
      minStock: 10,
      maxStock: 500,
      unitPrice: 25.99
    })
  });
}

async function debugUsers() {
  console.log('\n' + '='.repeat(50));
  console.log('🧪 DEBUGGING USERS');
  console.log('='.repeat(50));
  
  // Test GET users first
  await makeRequest('/api/users');
  
  // Test POST user
  await makeRequest('/api/users', {
    method: 'POST',
    body: JSON.stringify({
      email: 'debug@test.com',
      name: 'Debug User',
      password: 'DebugPassword123!'
    })
  });
}

async function debugRoles() {
  console.log('\n' + '='.repeat(50));
  console.log('🧪 DEBUGGING ROLES');
  console.log('='.repeat(50));
  
  // Test GET roles
  await makeRequest('/api/roles');
  
  // Test GET permissions
  await makeRequest('/api/permissions');
}

async function runDebugTests() {
  console.log('🔍 LUMO - Debug Comprehensive Test');
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Started at: ${new Date().toISOString()}`);
  
  try {
    await debugCategories();
    await debugLocations();
    await debugInventory();
    await debugUsers();
    await debugRoles();
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 DEBUG TEST COMPLETED');
    console.log('='.repeat(50));
    console.log(`Finished at: ${new Date().toISOString()}`);
    
  } catch (error) {
    console.error('\n❌ Debug test failed:', error.message);
  }
}

// Run the debug tests
runDebugTests();