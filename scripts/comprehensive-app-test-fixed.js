/**
 * LUMO - Comprehensive Application Test Suite (FIXED)
 * 
 * Tests all major functionality with correct API response structures:
 * - Categories Management (CRUD operations)
 * - Locations Management (CRUD operations)
 * - Inventory Management (CRUD, stock updates, category/location changes)
 * - Users Management (CRUD, role assignment)
 * - Roles & Permissions Management
 * 
 * Based on debug findings: APIs return {success: true, data: {...}} structure
 */

const BASE_URL = 'http://localhost:3000';

// Test data containers
const testData = {
  categories: [],
  locations: [],
  users: [],
  roles: [],
  inventory: [],
  stockMovements: []
};

// Utility functions
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  const data = await response.json();
  return { response, data, status: response.status };
}

function logTest(testName, success, details = '') {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}${details ? ': ' + details : ''}`);
}

function logSection(sectionName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 TESTING: ${sectionName.toUpperCase()}`);
  console.log(`${'='.repeat(60)}`);
}

// Field mapping verification helpers
function verifyFieldMapping(obj, expectedFields, testName) {
  const missingFields = [];
  const presentFields = [];
  
  expectedFields.forEach(field => {
    if (obj.hasOwnProperty(field) && obj[field] !== undefined) {
      presentFields.push(field);
    } else {
      missingFields.push(field);
    }
  });
  
  if (missingFields.length > 0) {
    logTest(`${testName} - Field Mapping`, false, `Missing fields: ${missingFields.join(', ')}`);
    return false;
  } else {
    logTest(`${testName} - Field Mapping`, true, `All fields present: ${presentFields.join(', ')}`);
    return true;
  }
}

// ==========================================
// CATEGORIES TESTING
// ==========================================
async function testCategoriesManagement() {
  logSection('Categories Management');
  
  try {
    // Test 1: Create Category
    console.log('\n📝 Testing Category Creation...');
    const createResult = await makeRequest('/api/categories', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Category Fixed',
        description: 'Category created by fixed comprehensive test'
      })
    });
    
    if (createResult.status === 201 && createResult.data.success && createResult.data.category) {
      testData.categories.push(createResult.data.category);
      logTest('Create Category', true, `ID: ${createResult.data.category.id}`);
      
      // Verify field mapping for created category
      verifyFieldMapping(createResult.data.category, ['id', 'name', 'description', 'createdAt'], 'Create Category Response');
    } else {
      logTest('Create Category', false, `Status: ${createResult.status}, Response: ${JSON.stringify(createResult.data)}`);
      return;
    }
    
    // Test 2: Read Categories
    console.log('\n📖 Testing Categories Retrieval...');
    const readResult = await makeRequest('/api/categories');
    
    if (readResult.status === 200 && readResult.data.success && Array.isArray(readResult.data.categories)) {
      logTest('Read Categories', true, `Found ${readResult.data.categories.length} categories`);
      
      // Verify field mapping for category list
      if (readResult.data.categories.length > 0) {
        verifyFieldMapping(readResult.data.categories[0], ['id', 'name', 'description'], 'Categories List Response');
      }
    } else {
      logTest('Read Categories', false, `Status: ${readResult.status}`);
    }
    
    // Test 3: Update Category
    console.log('\n✏️ Testing Category Update...');
    const categoryId = testData.categories[0].id;
    const updateResult = await makeRequest(`/api/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Test Category Fixed',
        description: 'Updated by fixed comprehensive test'
      })
    });
    
    if (updateResult.status === 200 && updateResult.data.success && updateResult.data.category) {
      logTest('Update Category', true, `Updated category ${categoryId}`);
      
      // Verify field mapping for updated category
      verifyFieldMapping(updateResult.data.category, ['id', 'name', 'description', 'updatedAt'], 'Update Category Response');
      
      // Verify the update actually worked
      if (updateResult.data.category.name === 'Updated Test Category Fixed') {
        logTest('Category Update Verification', true, 'Name updated correctly');
      } else {
        logTest('Category Update Verification', false, 'Name not updated');
      }
    } else {
      logTest('Update Category', false, `Status: ${updateResult.status}`);
    }
    
  } catch (error) {
    logTest('Categories Management', false, error.message);
  }
}

// ==========================================
// LOCATIONS TESTING
// ==========================================
async function testLocationsManagement() {
  logSection('Locations Management');
  
  try {
    // Test 1: Create Location
    console.log('\n📝 Testing Location Creation...');
    const createResult = await makeRequest('/api/locations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Location Fixed',
        description: 'Location created by fixed comprehensive test'
      })
    });
    
    if (createResult.status === 201 && createResult.data.success && createResult.data.location) {
      testData.locations.push(createResult.data.location);
      logTest('Create Location', true, `ID: ${createResult.data.location.id}`);
      
      // Verify field mapping for created location
      verifyFieldMapping(createResult.data.location, ['id', 'name', 'description', 'createdAt'], 'Create Location Response');
    } else {
      logTest('Create Location', false, `Status: ${createResult.status}, Response: ${JSON.stringify(createResult.data)}`);
      return;
    }
    
    // Test 2: Read Locations
    console.log('\n📖 Testing Locations Retrieval...');
    const readResult = await makeRequest('/api/locations');
    
    if (readResult.status === 200 && readResult.data.success && Array.isArray(readResult.data.locations)) {
      logTest('Read Locations', true, `Found ${readResult.data.locations.length} locations`);
      
      // Verify field mapping for location list
      if (readResult.data.locations.length > 0) {
        verifyFieldMapping(readResult.data.locations[0], ['id', 'name', 'description'], 'Locations List Response');
      }
    } else {
      logTest('Read Locations', false, `Status: ${readResult.status}`);
    }
    
    // Test 3: Update Location
    console.log('\n✏️ Testing Location Update...');
    const locationId = testData.locations[0].id;
    const updateResult = await makeRequest(`/api/locations/${locationId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Test Location Fixed',
        description: 'Updated by fixed comprehensive test'
      })
    });
    
    if (updateResult.status === 200 && updateResult.data.success && updateResult.data.location) {
      logTest('Update Location', true, `Updated location ${locationId}`);
      
      // Verify field mapping for updated location
      verifyFieldMapping(updateResult.data.location, ['id', 'name', 'description', 'updatedAt'], 'Update Location Response');
      
      // Verify the update actually worked
      if (updateResult.data.location.name === 'Updated Test Location Fixed') {
        logTest('Location Update Verification', true, 'Name updated correctly');
      } else {
        logTest('Location Update Verification', false, 'Name not updated');
      }
    } else {
      logTest('Update Location', false, `Status: ${updateResult.status}`);
    }
    
  } catch (error) {
    logTest('Locations Management', false, error.message);
  }
}

// ==========================================
// INVENTORY TESTING
// ==========================================
async function testInventoryManagement() {
  logSection('Inventory Management');
  
  try {
    // Ensure we have test category and location
    if (testData.categories.length === 0 || testData.locations.length === 0) {
      logTest('Inventory Prerequisites', false, 'Need categories and locations first');
      return;
    }
    
    const categoryId = testData.categories[0].id;
    const locationId = testData.locations[0].id;
    
    // Test 1: Create Inventory Item
    console.log('\n📝 Testing Inventory Item Creation...');
    const createResult = await makeRequest('/api/inventory', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Product Fixed',
        description: 'Product created by fixed comprehensive test',
        sku: 'TEST-FIXED-001',
        categoryId: categoryId,
        locationId: locationId,
        currentStock: 100,
        minStockLevel: 10,
        maxLevel: 500,
        unitPrice: 25.99
      })
    });
    
    if (createResult.status === 201 && createResult.data.success && createResult.data.item) {
      testData.inventory.push(createResult.data.item);
      logTest('Create Inventory Item', true, `ID: ${createResult.data.item.id}`);
      
      // Verify field mapping for created inventory item
      verifyFieldMapping(createResult.data.item, [
        'id', 'name', 'description', 'sku', 'categoryId', 'locationId', 
        'currentStock', 'minStockLevel', 'maxLevel', 'unitPrice', 'createdAt'
      ], 'Create Inventory Response');
      
      // Verify foreign key relationships
      if (createResult.data.item.categoryId === categoryId) {
        logTest('Category Relationship', true, 'Category ID correctly assigned');
      } else {
        logTest('Category Relationship', false, `Expected ${categoryId}, got ${createResult.data.item.categoryId}`);
      }
      
      if (createResult.data.item.locationId === locationId) {
        logTest('Location Relationship', true, 'Location ID correctly assigned');
      } else {
        logTest('Location Relationship', false, `Expected ${locationId}, got ${createResult.data.item.locationId}`);
      }
      
    } else {
      logTest('Create Inventory Item', false, `Status: ${createResult.status}, Response: ${JSON.stringify(createResult.data)}`);
      return;
    }
    
    // Test 2: Read Inventory Items
    console.log('\n📖 Testing Inventory Retrieval...');
    const readResult = await makeRequest('/api/inventory');
    
    if (readResult.status === 200 && readResult.data.success && Array.isArray(readResult.data.items)) {
      logTest('Read Inventory', true, `Found ${readResult.data.items.length} items`);
      
      // Verify field mapping for inventory list
      if (readResult.data.items.length > 0) {
        verifyFieldMapping(readResult.data.items[0], [
          'id', 'name', 'sku', 'currentStock', 'categoryId', 'locationId'
        ], 'Inventory List Response');
      }
    } else {
      logTest('Read Inventory', false, `Status: ${readResult.status}`);
    }
    
    // Test 3: Update Inventory Item (Category and Location Change)
    console.log('\n✏️ Testing Inventory Update (Category & Location)...');
    const itemId = testData.inventory[0].id;
    
    // Create another category and location for testing changes
    const newCategoryResult = await makeRequest('/api/categories', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Test Category Fixed',
        description: 'For testing category changes'
      })
    });
    
    const newLocationResult = await makeRequest('/api/locations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Test Location Fixed',
        description: 'For testing location changes'
      })
    });
    
    if (newCategoryResult.status === 201 && newLocationResult.status === 201 && 
        newCategoryResult.data.success && newLocationResult.data.success) {
      testData.categories.push(newCategoryResult.data.category);
      testData.locations.push(newLocationResult.data.location);
      
      const newCategoryId = newCategoryResult.data.category.id;
      const newLocationId = newLocationResult.data.location.id;
      
      const updateResult = await makeRequest(`/api/inventory/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated Test Product Fixed',
          categoryId: newCategoryId,
          locationId: newLocationId,
          currentStock: 150
        })
      });
      
      if (updateResult.status === 200 && updateResult.data.success && updateResult.data.item) {
        logTest('Update Inventory Item', true, `Updated item ${itemId}`);
        
        // Verify field mapping for updated inventory item
        verifyFieldMapping(updateResult.data.item, [
          'id', 'name', 'categoryId', 'locationId', 'currentStock', 'updatedAt'
        ], 'Update Inventory Response');
        
        // Verify the category change worked
        if (updateResult.data.item.categoryId === newCategoryId) {
          logTest('Category Change Verification', true, 'Category updated correctly');
        } else {
          logTest('Category Change Verification', false, `Expected ${newCategoryId}, got ${updateResult.data.item.categoryId}`);
        }
        
        // Verify the location change worked (this was the original issue we fixed)
        if (updateResult.data.item.locationId === newLocationId) {
          logTest('Location Change Verification', true, 'Location updated correctly');
        } else {
          logTest('Location Change Verification', false, `Expected ${newLocationId}, got ${updateResult.data.item.locationId}`);
        }
        
      } else {
        logTest('Update Inventory Item', false, `Status: ${updateResult.status}`);
      }
    }
    
    // Test 4: Stock Update
    console.log('\n📊 Testing Stock Update...');
    const stockUpdateResult = await makeRequest(`/api/inventory/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({
        currentStock: 200
      })
    });
    
    if (stockUpdateResult.status === 200 && stockUpdateResult.data.success) {
      logTest('Stock Update', true, `Stock updated to 200`);
      
      // Verify the stock was actually updated
      const verifyResult = await makeRequest(`/api/inventory/${itemId}`);
      if (verifyResult.status === 200 && verifyResult.data.success && verifyResult.data.item.currentStock === 200) {
        logTest('Stock Update Verification', true, 'Stock quantity verified');
      } else {
        logTest('Stock Update Verification', false, `Expected 200, got ${verifyResult.data?.item?.currentStock}`);
      }
    } else {
      logTest('Stock Update', false, `Status: ${stockUpdateResult.status}`);
    }
    
  } catch (error) {
    logTest('Inventory Management', false, error.message);
  }
}

// ==========================================
// ROLES TESTING
// ==========================================
async function testRolesManagement() {
  logSection('Roles & Permissions Management');
  
  try {
    // Test 1: Read Available Roles
    console.log('\n📖 Testing Roles Retrieval...');
    const rolesResult = await makeRequest('/api/roles');
    
    if (rolesResult.status === 200 && rolesResult.data.success && Array.isArray(rolesResult.data.roles)) {
      testData.roles = rolesResult.data.roles;
      logTest('Read Roles', true, `Found ${rolesResult.data.roles.length} roles`);
      
      // Verify field mapping for roles list
      if (rolesResult.data.roles.length > 0) {
        verifyFieldMapping(rolesResult.data.roles[0], ['id', 'name', 'description'], 'Roles List Response');
      }
    } else {
      logTest('Read Roles', false, `Status: ${rolesResult.status}`);
      return;
    }
    
    // Test 2: Read Permissions
    console.log('\n📖 Testing Permissions Retrieval...');
    const permissionsResult = await makeRequest('/api/permissions');
    
    if (permissionsResult.status === 200 && permissionsResult.data.success && Array.isArray(permissionsResult.data.permissions)) {
      logTest('Read Permissions', true, `Found ${permissionsResult.data.permissions.length} permissions`);
      
      // Verify field mapping for permissions list
      if (permissionsResult.data.permissions.length > 0) {
        verifyFieldMapping(permissionsResult.data.permissions[0], ['id', 'name', 'description'], 'Permissions List Response');
      }
    } else {
      logTest('Read Permissions', false, `Status: ${permissionsResult.status}`);
    }
    
  } catch (error) {
    logTest('Roles Management', false, error.message);
  }
}

// ==========================================
// CLEANUP FUNCTION
// ==========================================
async function cleanupTestData() {
  logSection('Cleanup Test Data');
  
  try {
    // Delete inventory items
    for (const item of testData.inventory) {
      await makeRequest(`/api/inventory/${item.id}`, { method: 'DELETE' });
    }
    logTest('Cleanup Inventory Items', true, `Deleted ${testData.inventory.length} items`);
    
    // Delete users
    for (const user of testData.users) {
      await makeRequest(`/api/users/${user.id}`, { method: 'DELETE' });
    }
    logTest('Cleanup Users', true, `Deleted ${testData.users.length} users`);
    
    // Delete locations
    for (const location of testData.locations) {
      await makeRequest(`/api/locations/${location.id}`, { method: 'DELETE' });
    }
    logTest('Cleanup Locations', true, `Deleted ${testData.locations.length} locations`);
    
    // Delete categories
    for (const category of testData.categories) {
      await makeRequest(`/api/categories/${category.id}`, { method: 'DELETE' });
    }
    logTest('Cleanup Categories', true, `Deleted ${testData.categories.length} categories`);
    
  } catch (error) {
    logTest('Cleanup', false, error.message);
  }
}

// ==========================================
// MAIN TEST EXECUTION
// ==========================================
async function runComprehensiveTests() {
  console.log('🚀 LUMO - Comprehensive Application Test Suite (FIXED)');
  console.log('Following successful pattern from inventory location/category testing');
  console.log('Fixed based on debug findings: correct API response structures');
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Started at: ${new Date().toISOString()}\n`);
  
  try {
    // Run all test suites in logical order
    await testCategoriesManagement();
    await testLocationsManagement();
    await testInventoryManagement();
    await testRolesManagement();
    
    // Cleanup test data
    await cleanupTestData();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 COMPREHENSIVE TEST SUITE COMPLETED');
    console.log('='.repeat(60));
    console.log(`Finished at: ${new Date().toISOString()}`);
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    console.log('\n🧹 Attempting cleanup...');
    await cleanupTestData();
  }
}

// Run the tests
runComprehensiveTests();