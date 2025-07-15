/**
 * LUMO - Comprehensive Application Test Suite
 * 
 * Tests all major functionality following the successful pattern from inventory location/category testing:
 * - Inventory Management (CRUD, stock updates, category/location changes)
 * - Categories Management (CRUD operations)
 * - Locations Management (CRUD operations)
 * - Users Management (CRUD, role assignment)
 * - Roles & Permissions Management
 * - Stock Movements (entries, exits, transfers)
 * 
 * Focus: Field mapping verification and API response validation
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
        name: 'Test Category',
        description: 'Category created by comprehensive test'
      })
    });
    
    if (createResult.status === 201 && createResult.data.id) {
      testData.categories.push(createResult.data);
      logTest('Create Category', true, `ID: ${createResult.data.id}`);
      
      // Verify field mapping for created category
      verifyFieldMapping(createResult.data, ['id', 'name', 'description', 'createdAt'], 'Create Category Response');
    } else {
      logTest('Create Category', false, `Status: ${createResult.status}`);
      return;
    }
    
    // Test 2: Read Categories
    console.log('\n📖 Testing Categories Retrieval...');
    const readResult = await makeRequest('/api/categories');
    
    if (readResult.status === 200 && Array.isArray(readResult.data)) {
      logTest('Read Categories', true, `Found ${readResult.data.length} categories`);
      
      // Verify field mapping for category list
      if (readResult.data.length > 0) {
        verifyFieldMapping(readResult.data[0], ['id', 'name', 'description'], 'Categories List Response');
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
        name: 'Updated Test Category',
        description: 'Updated by comprehensive test'
      })
    });
    
    if (updateResult.status === 200) {
      logTest('Update Category', true, `Updated category ${categoryId}`);
      
      // Verify field mapping for updated category
      verifyFieldMapping(updateResult.data, ['id', 'name', 'description', 'updatedAt'], 'Update Category Response');
      
      // Verify the update actually worked
      if (updateResult.data.name === 'Updated Test Category') {
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
        name: 'Test Location',
        description: 'Location created by comprehensive test'
      })
    });
    
    if (createResult.status === 201 && createResult.data.id) {
      testData.locations.push(createResult.data);
      logTest('Create Location', true, `ID: ${createResult.data.id}`);
      
      // Verify field mapping for created location
      verifyFieldMapping(createResult.data, ['id', 'name', 'description', 'createdAt'], 'Create Location Response');
    } else {
      logTest('Create Location', false, `Status: ${createResult.status}`);
      return;
    }
    
    // Test 2: Read Locations
    console.log('\n📖 Testing Locations Retrieval...');
    const readResult = await makeRequest('/api/locations');
    
    if (readResult.status === 200 && Array.isArray(readResult.data)) {
      logTest('Read Locations', true, `Found ${readResult.data.length} locations`);
      
      // Verify field mapping for location list
      if (readResult.data.length > 0) {
        verifyFieldMapping(readResult.data[0], ['id', 'name', 'description'], 'Locations List Response');
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
        name: 'Updated Test Location',
        description: 'Updated by comprehensive test'
      })
    });
    
    if (updateResult.status === 200) {
      logTest('Update Location', true, `Updated location ${locationId}`);
      
      // Verify field mapping for updated location
      verifyFieldMapping(updateResult.data, ['id', 'name', 'description', 'updatedAt'], 'Update Location Response');
      
      // Verify the update actually worked
      if (updateResult.data.name === 'Updated Test Location') {
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
        name: 'Test Product',
        description: 'Product created by comprehensive test',
        sku: 'TEST-001',
        categoryId: categoryId,
        locationId: locationId,
        quantity: 100,
        minStock: 10,
        maxStock: 500,
        unitPrice: 25.99
      })
    });
    
    if (createResult.status === 201 && createResult.data.id) {
      testData.inventory.push(createResult.data);
      logTest('Create Inventory Item', true, `ID: ${createResult.data.id}`);
      
      // Verify field mapping for created inventory item
      verifyFieldMapping(createResult.data, [
        'id', 'name', 'description', 'sku', 'categoryId', 'locationId', 
        'quantity', 'minStock', 'maxStock', 'unitPrice', 'createdAt'
      ], 'Create Inventory Response');
      
      // Verify foreign key relationships
      if (createResult.data.categoryId === categoryId) {
        logTest('Category Relationship', true, 'Category ID correctly assigned');
      } else {
        logTest('Category Relationship', false, `Expected ${categoryId}, got ${createResult.data.categoryId}`);
      }
      
      if (createResult.data.locationId === locationId) {
        logTest('Location Relationship', true, 'Location ID correctly assigned');
      } else {
        logTest('Location Relationship', false, `Expected ${locationId}, got ${createResult.data.locationId}`);
      }
      
    } else {
      logTest('Create Inventory Item', false, `Status: ${createResult.status}`);
      return;
    }
    
    // Test 2: Read Inventory Items
    console.log('\n📖 Testing Inventory Retrieval...');
    const readResult = await makeRequest('/api/inventory');
    
    if (readResult.status === 200 && Array.isArray(readResult.data)) {
      logTest('Read Inventory', true, `Found ${readResult.data.length} items`);
      
      // Verify field mapping for inventory list
      if (readResult.data.length > 0) {
        verifyFieldMapping(readResult.data[0], [
          'id', 'name', 'sku', 'quantity', 'categoryId', 'locationId'
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
        name: 'New Test Category',
        description: 'For testing category changes'
      })
    });
    
    const newLocationResult = await makeRequest('/api/locations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Test Location',
        description: 'For testing location changes'
      })
    });
    
    if (newCategoryResult.status === 201 && newLocationResult.status === 201) {
      testData.categories.push(newCategoryResult.data);
      testData.locations.push(newLocationResult.data);
      
      const newCategoryId = newCategoryResult.data.id;
      const newLocationId = newLocationResult.data.id;
      
      const updateResult = await makeRequest(`/api/inventory/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated Test Product',
          categoryId: newCategoryId,
          locationId: newLocationId,
          quantity: 150
        })
      });
      
      if (updateResult.status === 200) {
        logTest('Update Inventory Item', true, `Updated item ${itemId}`);
        
        // Verify field mapping for updated inventory item
        verifyFieldMapping(updateResult.data, [
          'id', 'name', 'categoryId', 'locationId', 'quantity', 'updatedAt'
        ], 'Update Inventory Response');
        
        // Verify the category change worked
        if (updateResult.data.categoryId === newCategoryId) {
          logTest('Category Change Verification', true, 'Category updated correctly');
        } else {
          logTest('Category Change Verification', false, `Expected ${newCategoryId}, got ${updateResult.data.categoryId}`);
        }
        
        // Verify the location change worked (this was the original issue we fixed)
        if (updateResult.data.locationId === newLocationId) {
          logTest('Location Change Verification', true, 'Location updated correctly');
        } else {
          logTest('Location Change Verification', false, `Expected ${newLocationId}, got ${updateResult.data.locationId}`);
        }
        
      } else {
        logTest('Update Inventory Item', false, `Status: ${updateResult.status}`);
      }
    }
    
    // Test 4: Stock Update
    console.log('\n📊 Testing Stock Update...');
    const stockUpdateResult = await makeRequest(`/api/inventory/${itemId}/stock`, {
      method: 'PUT',
      body: JSON.stringify({
        quantity: 200,
        reason: 'Comprehensive test stock update'
      })
    });
    
    if (stockUpdateResult.status === 200) {
      logTest('Stock Update', true, `Stock updated to 200`);
      
      // Verify the stock was actually updated
      const verifyResult = await makeRequest(`/api/inventory/${itemId}`);
      if (verifyResult.status === 200 && verifyResult.data.quantity === 200) {
        logTest('Stock Update Verification', true, 'Stock quantity verified');
      } else {
        logTest('Stock Update Verification', false, `Expected 200, got ${verifyResult.data?.quantity}`);
      }
    } else {
      logTest('Stock Update', false, `Status: ${stockUpdateResult.status}`);
    }
    
  } catch (error) {
    logTest('Inventory Management', false, error.message);
  }
}

// ==========================================
// USERS TESTING
// ==========================================
async function testUsersManagement() {
  logSection('Users Management');
  
  try {
    // Test 1: Create User
    console.log('\n📝 Testing User Creation...');
    const createResult = await makeRequest('/api/users', {
      method: 'POST',
      body: JSON.stringify({
        email: 'testuser@comprehensive.test',
        name: 'Test User',
        password: 'TestPassword123!'
      })
    });
    
    if (createResult.status === 201 && createResult.data.id) {
      testData.users.push(createResult.data);
      logTest('Create User', true, `ID: ${createResult.data.id}`);
      
      // Verify field mapping for created user
      verifyFieldMapping(createResult.data, ['id', 'email', 'name', 'createdAt'], 'Create User Response');
      
      // Verify password is not returned
      if (!createResult.data.hasOwnProperty('password')) {
        logTest('Password Security', true, 'Password not returned in response');
      } else {
        logTest('Password Security', false, 'Password returned in response - security issue!');
      }
      
    } else {
      logTest('Create User', false, `Status: ${createResult.status}`);
      return;
    }
    
    // Test 2: Read Users
    console.log('\n📖 Testing Users Retrieval...');
    const readResult = await makeRequest('/api/users');
    
    if (readResult.status === 200 && Array.isArray(readResult.data)) {
      logTest('Read Users', true, `Found ${readResult.data.length} users`);
      
      // Verify field mapping for users list
      if (readResult.data.length > 0) {
        verifyFieldMapping(readResult.data[0], ['id', 'email', 'name'], 'Users List Response');
      }
    } else {
      logTest('Read Users', false, `Status: ${readResult.status}`);
    }
    
    // Test 3: Update User
    console.log('\n✏️ Testing User Update...');
    const userId = testData.users[0].id;
    const updateResult = await makeRequest(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Test User',
        email: 'updated.testuser@comprehensive.test'
      })
    });
    
    if (updateResult.status === 200) {
      logTest('Update User', true, `Updated user ${userId}`);
      
      // Verify field mapping for updated user
      verifyFieldMapping(updateResult.data, ['id', 'name', 'email', 'updatedAt'], 'Update User Response');
      
      // Verify the update actually worked
      if (updateResult.data.name === 'Updated Test User') {
        logTest('User Update Verification', true, 'Name updated correctly');
      } else {
        logTest('User Update Verification', false, 'Name not updated');
      }
    } else {
      logTest('Update User', false, `Status: ${updateResult.status}`);
    }
    
  } catch (error) {
    logTest('Users Management', false, error.message);
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
    
    if (rolesResult.status === 200 && Array.isArray(rolesResult.data)) {
      testData.roles = rolesResult.data;
      logTest('Read Roles', true, `Found ${rolesResult.data.length} roles`);
      
      // Verify field mapping for roles list
      if (rolesResult.data.length > 0) {
        verifyFieldMapping(rolesResult.data[0], ['id', 'name', 'description'], 'Roles List Response');
      }
    } else {
      logTest('Read Roles', false, `Status: ${rolesResult.status}`);
      return;
    }
    
    // Test 2: Read Permissions
    console.log('\n📖 Testing Permissions Retrieval...');
    const permissionsResult = await makeRequest('/api/permissions');
    
    if (permissionsResult.status === 200 && Array.isArray(permissionsResult.data)) {
      logTest('Read Permissions', true, `Found ${permissionsResult.data.length} permissions`);
      
      // Verify field mapping for permissions list
      if (permissionsResult.data.length > 0) {
        verifyFieldMapping(permissionsResult.data[0], ['id', 'name', 'description'], 'Permissions List Response');
      }
    } else {
      logTest('Read Permissions', false, `Status: ${permissionsResult.status}`);
    }
    
    // Test 3: Assign Role to User
    if (testData.users.length > 0 && testData.roles.length > 0) {
      console.log('\n👤 Testing Role Assignment...');
      const userId = testData.users[0].id;
      const roleId = testData.roles[0].id;
      
      const assignResult = await makeRequest(`/api/users/${userId}/roles`, {
        method: 'POST',
        body: JSON.stringify({
          roleId: roleId
        })
      });
      
      if (assignResult.status === 200) {
        logTest('Assign Role to User', true, `Assigned role ${roleId} to user ${userId}`);
        
        // Verify the assignment worked
        const verifyResult = await makeRequest(`/api/users/${userId}/roles`);
        if (verifyResult.status === 200 && Array.isArray(verifyResult.data)) {
          const hasRole = verifyResult.data.some(role => role.id === roleId);
          if (hasRole) {
            logTest('Role Assignment Verification', true, 'Role assignment verified');
          } else {
            logTest('Role Assignment Verification', false, 'Role not found in user roles');
          }
        }
      } else {
        logTest('Assign Role to User', false, `Status: ${assignResult.status}`);
      }
    }
    
  } catch (error) {
    logTest('Roles Management', false, error.message);
  }
}

// ==========================================
// STOCK MOVEMENTS TESTING
// ==========================================
async function testStockMovements() {
  logSection('Stock Movements');
  
  try {
    if (testData.inventory.length === 0) {
      logTest('Stock Movements Prerequisites', false, 'Need inventory items first');
      return;
    }
    
    const itemId = testData.inventory[0].id;
    
    // Test 1: Stock Entry
    console.log('\n📈 Testing Stock Entry...');
    const entryResult = await makeRequest('/api/stock-movements', {
      method: 'POST',
      body: JSON.stringify({
        itemId: itemId,
        type: 'entry',
        quantity: 50,
        reason: 'Comprehensive test stock entry'
      })
    });
    
    if (entryResult.status === 201 && entryResult.data.id) {
      testData.stockMovements.push(entryResult.data);
      logTest('Stock Entry', true, `Movement ID: ${entryResult.data.id}`);
      
      // Verify field mapping for stock movement
      verifyFieldMapping(entryResult.data, [
        'id', 'itemId', 'type', 'quantity', 'reason', 'createdAt'
      ], 'Stock Entry Response');
      
    } else {
      logTest('Stock Entry', false, `Status: ${entryResult.status}`);
    }
    
    // Test 2: Stock Exit
    console.log('\n📉 Testing Stock Exit...');
    const exitResult = await makeRequest('/api/stock-movements', {
      method: 'POST',
      body: JSON.stringify({
        itemId: itemId,
        type: 'exit',
        quantity: 25,
        reason: 'Comprehensive test stock exit'
      })
    });
    
    if (exitResult.status === 201 && exitResult.data.id) {
      testData.stockMovements.push(exitResult.data);
      logTest('Stock Exit', true, `Movement ID: ${exitResult.data.id}`);
      
      // Verify field mapping for stock movement
      verifyFieldMapping(exitResult.data, [
        'id', 'itemId', 'type', 'quantity', 'reason', 'createdAt'
      ], 'Stock Exit Response');
      
    } else {
      logTest('Stock Exit', false, `Status: ${exitResult.status}`);
    }
    
    // Test 3: Read Stock Movements
    console.log('\n📖 Testing Stock Movements Retrieval...');
    const readResult = await makeRequest(`/api/inventory/${itemId}/movements`);
    
    if (readResult.status === 200 && Array.isArray(readResult.data)) {
      logTest('Read Stock Movements', true, `Found ${readResult.data.length} movements`);
      
      // Verify field mapping for movements list
      if (readResult.data.length > 0) {
        verifyFieldMapping(readResult.data[0], [
          'id', 'type', 'quantity', 'reason', 'createdAt'
        ], 'Stock Movements List Response');
      }
    } else {
      logTest('Read Stock Movements', false, `Status: ${readResult.status}`);
    }
    
  } catch (error) {
    logTest('Stock Movements', false, error.message);
  }
}

// ==========================================
// CLEANUP FUNCTION
// ==========================================
async function cleanupTestData() {
  logSection('Cleanup Test Data');
  
  try {
    // Delete stock movements
    for (const movement of testData.stockMovements) {
      await makeRequest(`/api/stock-movements/${movement.id}`, { method: 'DELETE' });
    }
    logTest('Cleanup Stock Movements', true, `Deleted ${testData.stockMovements.length} movements`);
    
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
  console.log('🚀 LUMO - Comprehensive Application Test Suite');
  console.log('Following successful pattern from inventory location/category testing');
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Started at: ${new Date().toISOString()}\n`);
  
  try {
    // Run all test suites in logical order
    await testCategoriesManagement();
    await testLocationsManagement();
    await testInventoryManagement();
    await testUsersManagement();
    await testRolesManagement();
    await testStockMovements();
    
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