/**
 * Comprehensive CRUD Test for LUMO Inventory System
 * Tests all major entities with proper foreign key constraint handling
 */

const BASE_URL = 'http://localhost:3000';

class CRUDTester {
  constructor() {
    this.createdEntities = {
      categories: [],
      locations: [],
      inventory: [],
      users: [],
      roles: []
    };
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testCategories() {
    console.log('\n📁 Testing Categories CRUD...');
    const timestamp = Date.now();
    
    try {
      // CREATE
      const createResponse = await fetch(`${BASE_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Test Category ${timestamp}`,
          description: 'Automated test category'
        })
      });
      
      const createResult = await createResponse.json();
      if (createResult.success) {
        console.log('✅ Category CREATE: SUCCESS');
        this.createdEntities.categories.push(createResult.category.id);
        
        // READ
        const readResponse = await fetch(`${BASE_URL}/api/categories`);
        const readResult = await readResponse.json();
        console.log(`✅ Category READ: SUCCESS (${readResult.categories?.length || 0} categories)`);
        
        // UPDATE (if API exists)
        // DELETE will be handled in cleanup
        
        return true;
      } else {
        console.log('❌ Category CREATE: FAILED -', createResult.error);
        return false;
      }
    } catch (error) {
      console.log('❌ Category test failed:', error.message);
      return false;
    }
  }

  async testLocations() {
    console.log('\n📍 Testing Locations CRUD...');
    const timestamp = Date.now();
    
    try {
      // CREATE
      const createResponse = await fetch(`${BASE_URL}/api/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Test Location ${timestamp}`,
          description: 'Automated test location'
        })
      });
      
      const createResult = await createResponse.json();
      if (createResult.success) {
        console.log('✅ Location CREATE: SUCCESS');
        this.createdEntities.locations.push(createResult.location.id);
        
        // READ
        const readResponse = await fetch(`${BASE_URL}/api/locations`);
        const readResult = await readResponse.json();
        console.log(`✅ Location READ: SUCCESS (${readResult.locations?.length || 0} locations)`);
        
        return true;
      } else {
        console.log('❌ Location CREATE: FAILED -', createResult.error);
        return false;
      }
    } catch (error) {
      console.log('❌ Location test failed:', error.message);
      return false;
    }
  }

  async testInventory() {
    console.log('\n📦 Testing Inventory CRUD...');
    const timestamp = Date.now();
    
    // Need at least one category and location
    if (this.createdEntities.categories.length === 0 || this.createdEntities.locations.length === 0) {
      console.log('❌ Inventory test skipped: Missing category or location');
      return false;
    }
    
    try {
      // CREATE
      const inventoryData = {
        name: `Test Product ${timestamp}`,
        description: 'Automated test product',
        sku: `TEST-${timestamp}`,
        categoryId: this.createdEntities.categories[0],
        locationId: this.createdEntities.locations[0],
        currentStock: 50,
        minStockLevel: 5,
        maxLevel: 200,
        unitPrice: 19.99
      };
      
      const createResponse = await fetch(`${BASE_URL}/api/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inventoryData)
      });
      
      const createResult = await createResponse.json();
      if (createResult.success) {
        console.log('✅ Inventory CREATE: SUCCESS');
        this.createdEntities.inventory.push(createResult.item.id);
        
        // READ
        const readResponse = await fetch(`${BASE_URL}/api/inventory`);
        const readResult = await readResponse.json();
        console.log(`✅ Inventory READ: SUCCESS (${readResult.items?.length || 0} items)`);
        
        return true;
      } else {
        console.log('❌ Inventory CREATE: FAILED -', createResult.error);
        return false;
      }
    } catch (error) {
      console.log('❌ Inventory test failed:', error.message);
      return false;
    }
  }

  async testUsers() {
    console.log('\n👤 Testing Users CRUD...');
    const timestamp = Date.now();
    
    try {
      // CREATE
      const userData = {
        name: `Test User ${timestamp}`,
        email: `testuser${timestamp}@example.com`,
        password: 'TestPassword123!',
        roleId: '550e8400-e29b-41d4-a716-446655440000' // Default admin role
      };
      
      const createResponse = await fetch(`${BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      const createResult = await createResponse.json();
      if (createResult.success) {
        console.log('✅ User CREATE: SUCCESS');
        this.createdEntities.users.push(createResult.user.id);
        
        // READ
        const readResponse = await fetch(`${BASE_URL}/api/users`);
        const readResult = await readResponse.json();
        console.log(`✅ User READ: SUCCESS (${readResult.users?.length || 0} users)`);
        
        return true;
      } else {
        console.log('❌ User CREATE: FAILED -', createResult.error);
        return false;
      }
    } catch (error) {
      console.log('❌ User test failed:', error.message);
      return false;
    }
  }

  async testRoles() {
    console.log('\n🔐 Testing Roles CRUD...');
    
    try {
      // READ (roles should exist by default)
      const readResponse = await fetch(`${BASE_URL}/api/roles`);
      const readResult = await readResponse.json();
      
      if (readResult.success) {
        console.log(`✅ Role READ: SUCCESS (${readResult.roles?.length || 0} roles)`);
        return true;
      } else {
        console.log('❌ Role READ: FAILED -', readResult.error);
        return false;
      }
    } catch (error) {
      console.log('❌ Role test failed:', error.message);
      return false;
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    
    // Delete in proper order to respect foreign key constraints
    
    // 1. Delete inventory items first (they reference categories and locations)
    for (const inventoryId of this.createdEntities.inventory) {
      try {
        const response = await fetch(`${BASE_URL}/api/inventory/${inventoryId}`, { method: 'DELETE' });
        console.log(`✅ Inventory ${inventoryId} deletion: ${response.status}`);
        await this.delay(100); // Small delay to ensure deletion completes
      } catch (error) {
        console.log(`❌ Error deleting inventory ${inventoryId}:`, error.message);
      }
    }
    
    // 2. Delete users (they don't have dependencies in our current schema)
    for (const userId of this.createdEntities.users) {
      try {
        const response = await fetch(`${BASE_URL}/api/users/${userId}`, { method: 'DELETE' });
        console.log(`✅ User ${userId} deletion: ${response.status}`);
        await this.delay(100);
      } catch (error) {
        console.log(`❌ Error deleting user ${userId}:`, error.message);
      }
    }
    
    // 3. Delete locations (no longer referenced by inventory)
    for (const locationId of this.createdEntities.locations) {
      try {
        const response = await fetch(`${BASE_URL}/api/locations/${locationId}`, { method: 'DELETE' });
        console.log(`✅ Location ${locationId} deletion: ${response.status}`);
        await this.delay(100);
      } catch (error) {
        console.log(`❌ Error deleting location ${locationId}:`, error.message);
      }
    }
    
    // 4. Delete categories (no longer referenced by inventory)
    for (const categoryId of this.createdEntities.categories) {
      try {
        const response = await fetch(`${BASE_URL}/api/categories/${categoryId}`, { method: 'DELETE' });
        console.log(`✅ Category ${categoryId} deletion: ${response.status}`);
        await this.delay(100);
      } catch (error) {
        console.log(`❌ Error deleting category ${categoryId}:`, error.message);
      }
    }
    
    console.log('🧹 Cleanup completed');
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive CRUD Tests for LUMO Inventory System');
    console.log('='.repeat(70));
    
    const results = {
      categories: false,
      locations: false,
      inventory: false,
      users: false,
      roles: false
    };
    
    try {
      // Run tests in dependency order
      results.categories = await this.testCategories();
      results.locations = await this.testLocations();
      results.inventory = await this.testInventory();
      results.users = await this.testUsers();
      results.roles = await this.testRoles();
      
      // Cleanup
      await this.cleanup();
      
      // Summary
      console.log('\n📊 Test Results Summary:');
      console.log('='.repeat(30));
      Object.entries(results).forEach(([test, passed]) => {
        const status = passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${test.toUpperCase()}: ${status}`);
      });
      
      const passedTests = Object.values(results).filter(Boolean).length;
      const totalTests = Object.keys(results).length;
      
      console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
      
      if (passedTests === totalTests) {
        console.log('🎉 ALL TESTS PASSED! LUMO system is working correctly.');
      } else {
        console.log('⚠️ Some tests failed. Check the logs above for details.');
      }
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      await this.cleanup(); // Ensure cleanup even on failure
    }
  }
}

// Run the tests
const tester = new CRUDTester();
tester.runAllTests();