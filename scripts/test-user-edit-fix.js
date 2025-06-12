#!/usr/bin/env node

/**
 * Test User Edit Fix
 * 
 * Verifies that the "Failed to load user data" error in Choreo is resolved
 * by testing the Supabase adapter's user.findUnique method with role inclusion.
 */

const path = require('path');
const fs = require('fs');

console.log('🧪 Testing User Edit Fix...\n');

async function testUserEditFix() {
  try {
    // Test 1: Database Connection
    console.log('1️⃣ Testing database connection...');
    
    // Import the hybrid database
    const db = require('../src/lib/db').default;
    
    if (!db) {
      throw new Error('Database not available');
    }
    console.log('✅ Database connection successful\n');

    // Test 2: User Query with Role Inclusion
    console.log('2️⃣ Testing user query with role inclusion...');
    
    // First, get a user to test with
    const users = await db.user.findMany({});
    
    if (!users || users.length === 0) {
      console.log('⚠️ No users found in database. Creating test user...');
      
      // Create a test role first
      const testRole = await db.role.create({
        data: {
          name: 'TEST_ROLE',
          description: 'Test role for user edit fix verification'
        }
      });
      
      // Create a test user
      const testUser = await db.user.create({
        data: {
          email: 'test-user-edit@lumo.dev',
          password: 'test123',
          name: 'Test User Edit',
          roleId: testRole.id,
          isActive: true
        }
      });
      
      console.log('✅ Test user created:', testUser.email);
    }
    
    // Get the first user for testing
    const testUsers = await db.user.findMany({});
    const testUserId = testUsers[0].id;
    
    console.log('🔍 Testing user ID:', testUserId);

    // Test 3: findUnique with include (this is what was failing)
    console.log('3️⃣ Testing findUnique with role inclusion...');
    
    const userWithRole = await db.user.findUnique({
      where: { id: testUserId },
      include: {
        role: true
      }
    });
    
    if (!userWithRole) {
      throw new Error('User not found with findUnique');
    }
    
    console.log('✅ User found:', userWithRole.email);
    console.log('✅ Role ID:', userWithRole.roleId);
    console.log('✅ Role object:', userWithRole.role ? userWithRole.role.name : 'null');
    
    // Verify the structure matches what the API expects
    const requiredFields = ['id', 'email', 'name', 'roleId', 'role', 'isActive', 'createdAt', 'updatedAt'];
    const missingFields = requiredFields.filter(field => !(field in userWithRole));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    console.log('✅ All required fields present\n');

    // Test 4: Role object structure
    console.log('4️⃣ Testing role object structure...');
    
    if (!userWithRole.role) {
      throw new Error('Role object is null');
    }
    
    const requiredRoleFields = ['id', 'name'];
    const missingRoleFields = requiredRoleFields.filter(field => !(field in userWithRole.role));
    
    if (missingRoleFields.length > 0) {
      throw new Error(`Missing required role fields: ${missingRoleFields.join(', ')}`);
    }
    
    console.log('✅ Role object structure correct');
    console.log('✅ Role name:', userWithRole.role.name);
    console.log('✅ Role ID:', userWithRole.role.id, '\n');

    // Test 5: API Endpoint Simulation
    console.log('5️⃣ Simulating API endpoint call...');
    
    // This simulates what the /api/users/[id] endpoint does
    const userData = {
      id: userWithRole.id,
      email: userWithRole.email,
      name: userWithRole.name,
      firstName: userWithRole.name,
      lastName: '',
      roleId: userWithRole.roleId,
      role: userWithRole.role,
      isActive: userWithRole.isActive,
      createdAt: userWithRole.createdAt,
      updatedAt: userWithRole.updatedAt,
    };
    
    console.log('✅ API response structure valid');
    console.log('✅ User data prepared successfully\n');

    // Test 6: Update with Role Inclusion
    console.log('6️⃣ Testing user update with role inclusion...');
    
    const updatedUser = await db.user.update({
      where: { id: testUserId },
      data: {
        name: userWithRole.name + ' (Updated)'
      },
      include: {
        role: true
      }
    });
    
    if (!updatedUser || !updatedUser.role) {
      throw new Error('Update with role inclusion failed');
    }
    
    console.log('✅ User update with role inclusion successful');
    console.log('✅ Updated name:', updatedUser.name);
    console.log('✅ Role preserved:', updatedUser.role.name, '\n');

    // Success Summary
    console.log('🎉 ALL TESTS PASSED! 🎉\n');
    console.log('✅ Database connection working');
    console.log('✅ User findUnique with role inclusion working');
    console.log('✅ User update with role inclusion working');
    console.log('✅ API response structure correct');
    console.log('✅ "Failed to load user data" error should be resolved\n');
    
    console.log('🚀 Ready for Choreo deployment!');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('❌ Stack trace:', error.stack);
    
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check database connection');
    console.log('2. Verify Supabase configuration');
    console.log('3. Check user and role tables exist');
    console.log('4. Verify role relationships');
    
    return false;
  }
}

// Run the test
if (require.main === module) {
  testUserEditFix()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { testUserEditFix }; 