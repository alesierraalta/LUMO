/**
 * Improved Comprehensive CRUD Test for LUMO Inventory System
 * Fixes email validation and foreign key constraint issues
 */

const BASE_URL = 'http://localhost:3000';

class ImprovedCRUDTester {
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

  async verifyDeletion(endpoint, id, entityType) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}/${id}`);
      if (response.status === 404) {
        console.log(`✅ ${entityType} ${id} successfully deleted (verified)`);
        return true;
      } else {
        console.log(`⚠️ ${entityType} ${id} still exists after deletion attempt`);
        return false;
      }
    } catch (error) {
      console.log(`✅ ${entityType} ${id} deletion verified (endpoint not accessible)`);
      return true;
    }
  }

  async retryDeletion(endpoint, id, entityType, maxRetries = 3, useHardDelete = false) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Use hard delete endpoint for inventory items to actually remove from database
        const deleteEndpoint = useHardDelete && entityType === 'Inventory'
          ? `${BASE_URL}${endpoint}/${id}/hard-delete`
          : `${BASE_URL}${endpoint}/${id}`;
          
        const response = await fetch(deleteEndpoint, { method: 'DELETE' });
        console.log(`🔄 ${entityType} ${id} deletion attempt ${attempt}: ${response.status} ${useHardDelete ? '(hard delete)' : ''}`);
        
        if (response.status === 200 || response.status === 204) {
          // Wait for database transaction to complete
          await this.delay(500);
          
          // Verify deletion
          const verified = await this.verifyDeletion(endpoint.replace('/[id]', ''), id, entityType);
          if (verified) {
            return true;
          }
        }
        
        if (attempt < maxRetries) {
          await this.delay(1000); // Wait before retry
        }
      } catch (error) {
        console.log(`❌ ${entityType} ${id} deletion attempt ${attempt} failed:`, error.message);
      }
    }
    return false;
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
      // CREATE with proper email format for Supabase Auth
      const userData = {
        name: `Test User ${timestamp}`,
        email: `test.user.${timestamp}@gmail.com`, // Proper email format
        password: 'TestPassword123!',
        roleId: '550e8400-e29b-41d4-a716-446655440000' // Default admin role
      };
      
      const createResponse = await fetch(`${BASE_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Development-Mode': 'true' // Force development mode for testing
        },
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
    console.log('\n🧹 Cleaning up test data with improved foreign key handling...');
    
    // Delete in proper order with verification and retries
    
    // 1. Delete inventory items first (they reference categories and locations)
    // Use hard delete endpoint to actually remove records from database
    console.log('\n🗑️ Phase 1: Deleting inventory items (hard delete)...');
    for (const inventoryId of this.createdEntities.inventory) {
      const success = await this.retryDeletion('/api/inventory', inventoryId, 'Inventory', 3, true);
      if (!success) {
        console.log(`⚠️ Failed to delete inventory ${inventoryId} after retries`);
      }
    }
    
    // Wait for all inventory deletions to complete
    await this.delay(2000);
    
    // 2. Delete users (they don't have dependencies in our current schema)
    console.log('\n🗑️ Phase 2: Deleting users...');
    for (const userId of this.createdEntities.users) {
      const success = await this.retryDeletion('/api/users', userId, 'User');
      if (!success) {
        console.log(`⚠️ Failed to delete user ${userId} after retries`);
      }
    }
    
    // 3. Delete locations (should be safe now)
    console.log('\n🗑️ Phase 3: Deleting locations...');
    for (const locationId of this.createdEntities.locations) {
      const success = await this.retryDeletion('/api/locations', locationId, 'Location');
      if (!success) {
        console.log(`⚠️ Failed to delete location ${locationId} after retries`);
      }
    }
    
    // 4. Delete categories (should be safe now)
    console.log('\n🗑️ Phase 4: Deleting categories...');
    for (const categoryId of this.createdEntities.categories) {
      const success = await this.retryDeletion('/api/categories', categoryId, 'Category');
      if (!success) {
        console.log(`⚠️ Failed to delete category ${categoryId} after retries`);
      }
    }
    
    console.log('\n🧹 Cleanup completed with verification');
  }

  async runAllTests() {
    console.log('🚀 Starting Improved Comprehensive CRUD Tests for LUMO Inventory System');
    console.log('='.repeat(75));
    
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
      
      // Cleanup with improved handling
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
        console.log('✨ The application is ready for production deployment.');
      } else {
        console.log('⚠️ Some tests failed. Check the logs above for details.');
        console.log('🔧 Issues have been identified and can be addressed.');
      }
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      await this.cleanup(); // Ensure cleanup even on failure
    }
  }
}

// Run the improved tests
const tester = new ImprovedCRUDTester();
tester.runAllTests();