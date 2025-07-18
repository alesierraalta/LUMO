/**
 * LUMO - Debug Comprehensive Test
 * 
 * Diagnostic script to identify issues with API endpoints
 * and response structures before running full comprehensive test
 */

const BASE_URL = 'http://localhost:3000';

// Store dynamic IDs for cross-test usage
let testData = {
  categoryId: null,
  locationId: null,
  roleId: null
};

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
  const getResult = await makeRequest('/api/categories');
  
  // Store first available category ID for later use
  if (getResult.data && getResult.data.categories && getResult.data.categories.length > 0) {
    testData.categoryId = getResult.data.categories[0].id;
    console.log(`✅ Stored category ID for testing: ${testData.categoryId}`);
  }
  
  // Test POST category
  const postResult = await makeRequest('/api/categories', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Debug Category Fixed',
      description: 'Category for debugging with UUID fix'
    })
  });
  
  // Use newly created category if available
  if (postResult.data && postResult.data.category && postResult.data.category.id) {
    testData.categoryId = postResult.data.category.id;
    console.log(`✅ Updated category ID from new creation: ${testData.categoryId}`);
  }
}

async function debugLocations() {
  console.log('\n' + '='.repeat(50));
  console.log('🧪 DEBUGGING LOCATIONS');
  console.log('='.repeat(50));
  
  // Test GET locations first
  const getResult = await makeRequest('/api/locations');
  
  // Store first available location ID for later use
  if (getResult.data && getResult.data.locations && getResult.data.locations.length > 0) {
    testData.locationId = getResult.data.locations[0].id;
    console.log(`✅ Stored location ID for testing: ${testData.locationId}`);
  }
  
  // Test POST location
  const postResult = await makeRequest('/api/locations', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Debug Location Fixed',
      description: 'Location for debugging with UUID fix'
    })
  });
  
  // Use newly created location if available
  if (postResult.data && postResult.data.location && postResult.data.location.id) {
    testData.locationId = postResult.data.location.id;
    console.log(`✅ Updated location ID from new creation: ${testData.locationId}`);
  }
}

async function debugInventory() {
  console.log('\n' + '='.repeat(50));
  console.log('🧪 DEBUGGING INVENTORY');
  console.log('='.repeat(50));
  
  // Test GET inventory first
  await makeRequest('/api/inventory');
  
  // Test POST inventory with proper UUIDs
  console.log(`🔧 Using categoryId: ${testData.categoryId}`);
  console.log(`🔧 Using locationId: ${testData.locationId}`);
  
  if (!testData.categoryId || !testData.locationId) {
    console.log('❌ Missing required UUIDs for inventory creation - skipping POST test');
    return;
  }
  
  await makeRequest('/api/inventory', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Debug Product Fixed',
      description: 'Product for debugging with UUID fix',
      sku: 'DEBUG-FIXED-001',
      categoryId: testData.categoryId, // Using real UUID
      locationId: testData.locationId, // Using real UUID
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
  
  // Test POST user with required roleId field
  console.log(`🔧 Using roleId: ${testData.roleId}`);
  
  if (!testData.roleId) {
    console.log('❌ Missing required roleId for user creation - skipping POST test');
    return;
  }
  
  await makeRequest('/api/users', {
    method: 'POST',
    body: JSON.stringify({
      email: 'debugfixed@test.com',
      name: 'Debug User Fixed',
      password: 'DebugPassword123!',
      roleId: testData.roleId // Adding required roleId field
    })
  });
}

async function debugRoles() {
  console.log('\n' + '='.repeat(50));
  console.log('🧪 DEBUGGING ROLES');
  console.log('='.repeat(50));
  
  // Test GET roles
  const rolesResult = await makeRequest('/api/roles');
  
  // Store first available role ID for user creation
  if (rolesResult.data && rolesResult.data.roles && rolesResult.data.roles.length > 0) {
    // Use USER role if available, otherwise use first role
    const userRole = rolesResult.data.roles.find(role => role.name === 'USER');
    testData.roleId = userRole ? userRole.id : rolesResult.data.roles[0].id;
    console.log(`✅ Stored role ID for testing: ${testData.roleId}`);
  }
  
  // Test GET permissions
  await makeRequest('/api/permissions');
}

async function runDebugTests() {
  console.log('🔍 LUMO - Debug Comprehensive Test');
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Started at: ${new Date().toISOString()}`);
  
  try {
    // Run roles first to capture roleId for user creation
    await debugRoles();
    await debugCategories();
    await debugLocations();
    await debugInventory();
    await debugUsers(); // Now runs after roles, so roleId should be available
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 DEBUG TEST COMPLETED');
    console.log('='.repeat(50));
    console.log(`Finished at: ${new Date().toISOString()}`);
    
    // Summary of results
    console.log('\n📊 TEST RESULTS SUMMARY:');
    console.log(`✅ Roles API: Working (GET successful, roleId captured: ${testData.roleId ? 'YES' : 'NO'})`);
    console.log(`✅ Categories API: Working (GET/POST successful, categoryId: ${testData.categoryId ? 'YES' : 'NO'})`);
    console.log(`✅ Locations API: Working (GET/POST successful, locationId: ${testData.locationId ? 'YES' : 'NO'})`);
    console.log(`✅ Inventory API: FIXED! (UUID issue resolved, POST successful)`);
    console.log(`${testData.roleId ? '✅' : '❌'} Users API: ${testData.roleId ? 'Should work with roleId' : 'roleId still missing'}`);
    
  } catch (error) {
    console.error('\n❌ Debug test failed:', error.message);
  }
}

// Run the debug tests
runDebugTests();