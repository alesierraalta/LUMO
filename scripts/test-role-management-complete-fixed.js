/**
 * Comprehensive Role Management System Test - Fixed Version
 * Tests all role management APIs and functionality with real user
 */

const BASE_URL = 'http://localhost:3000';

// Test configuration - Using real user ID from database
const TEST_USER_ID = '5f493c59-420e-4a9b-afed-0b67bfa892d5'; // Real user from auth.users
const TEST_ROLE_IDS = {
  ADMIN: 'admin-role',
  MANAGER: 'manager-role', 
  USER: 'user-role'
};

// Helper function to make API requests
async function makeRequest(endpoint, method = 'GET', body = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Development-Mode': 'true'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  console.log(`📡 ${method} ${endpoint}`);
  
  try {
    const response = await fetch(url, options);
    
    // Check if response is empty
    const responseText = await response.text();
    let data;
    
    if (responseText.trim() === '') {
      data = {};
    } else {
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`❌ JSON Parse Error: ${parseError.message}`);
        console.error(`❌ Response text: "${responseText}"`);
        return { success: false, error: `JSON Parse Error: ${parseError.message}`, responseText };
      }
    }
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(data, null, 2));
    
    return { success: response.ok, status: response.status, data, responseText };
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test functions
async function testRolesAPI() {
  console.log('\n🔍 Testing Roles API (/api/roles)');
  console.log('=' + '='.repeat(50));
  
  const result = await makeRequest('/api/roles');
  
  if (result.success && result.data.roles) {
    console.log(`✅ Found ${result.data.roles.length} roles`);
    result.data.roles.forEach(role => {
      console.log(`  - ${role.name} (ID: ${role.id})`);
    });
    return result.data.roles;
  } else {
    console.error('❌ Failed to fetch roles');
    return [];
  }
}

async function testPermissionsAPI() {
  console.log('\n🔍 Testing Permissions API (/api/permissions)');
  console.log('=' + '='.repeat(50));
  
  const result = await makeRequest('/api/permissions');
  
  if (result.success && result.data.permissions) {
    console.log(`✅ Found ${result.data.permissions.length} permissions`);
    
    // Group by category
    const categories = {};
    result.data.permissions.forEach(perm => {
      if (!categories[perm.category]) categories[perm.category] = [];
      categories[perm.category].push(perm);
    });
    
    Object.entries(categories).forEach(([category, perms]) => {
      console.log(`  📁 ${category}: ${perms.length} permissions`);
      perms.forEach(perm => {
        console.log(`    - ${perm.resource}:${perm.action}`);
      });
    });
    
    return result.data.permissions;
  } else {
    console.error('❌ Failed to fetch permissions');
    return [];
  }
}

async function testRolePermissionsAPI(roles) {
  console.log('\n🔍 Testing Role Permissions API (/api/roles/[id]/permissions)');
  console.log('=' + '='.repeat(50));
  
  const results = {};
  
  for (const role of roles) {
    console.log(`\n🔍 Testing permissions for role: ${role.name}`);
    
    // Test GET
    const getResult = await makeRequest(`/api/roles/${role.id}/permissions`);
    if (getResult.success && getResult.data.permissions) {
      console.log(`✅ ${role.name} has ${getResult.data.permissions.length} permissions`);
      results[role.id] = getResult.data.permissions;
    } else {
      console.error(`❌ Failed to fetch permissions for ${role.name}`);
      if (getResult.error) {
        console.error(`❌ Error details: ${getResult.error}`);
      }
    }
  }
  
  return results;
}

async function testUserRolesAPI(roles) {
  console.log('\n🔍 Testing User Roles API (/api/users/[id]/roles)');
  console.log('=' + '='.repeat(50));
  
  // Test GET - initial user roles
  console.log(`\n🔍 Getting initial roles for user: ${TEST_USER_ID}`);
  const initialResult = await makeRequest(`/api/users/${TEST_USER_ID}/roles`);
  
  if (initialResult.success) {
    console.log(`✅ User has ${initialResult.data.roles?.length || 0} initial roles`);
    if (initialResult.data.roles && initialResult.data.roles.length > 0) {
      initialResult.data.roles.forEach(role => {
        console.log(`  - ${role.name} (ID: ${role.id})`);
      });
    }
  } else {
    console.error('❌ Failed to get initial user roles');
    if (initialResult.error) {
      console.error(`❌ Error details: ${initialResult.error}`);
    }
    if (initialResult.responseText) {
      console.error(`❌ Response text: "${initialResult.responseText}"`);
    }
  }
  
  // Test PUT - assign roles
  console.log(`\n🔍 Assigning roles to user: ${TEST_USER_ID}`);
  const roleIds = roles.slice(0, 2).map(r => r.id); // Assign first 2 roles
  const assignResult = await makeRequest(`/api/users/${TEST_USER_ID}/roles`, 'PUT', {
    roleIds
  });
  
  if (assignResult.success) {
    console.log(`✅ Successfully assigned ${roleIds.length} roles to user`);
    console.log(`📝 Assigned roles: ${roleIds.join(', ')}`);
  } else {
    console.error('❌ Failed to assign roles to user');
    if (assignResult.error) {
      console.error(`❌ Error details: ${assignResult.error}`);
    }
    if (assignResult.responseText) {
      console.error(`❌ Response text: "${assignResult.responseText}"`);
    }
  }
  
  // Test GET - verify assignment
  console.log(`\n🔍 Verifying role assignment for user: ${TEST_USER_ID}`);
  const verifyResult = await makeRequest(`/api/users/${TEST_USER_ID}/roles`);
  
  if (verifyResult.success) {
    console.log(`✅ User now has ${verifyResult.data.roles?.length || 0} roles`);
    if (verifyResult.data.roles && verifyResult.data.roles.length > 0) {
      verifyResult.data.roles.forEach(role => {
        console.log(`  - ${role.name} (ID: ${role.id})`);
      });
    }
  } else {
    console.error('❌ Failed to verify role assignment');
    if (verifyResult.error) {
      console.error(`❌ Error details: ${verifyResult.error}`);
    }
    if (verifyResult.responseText) {
      console.error(`❌ Response text: "${verifyResult.responseText}"`);
    }
  }
}

async function testRolePermissionUpdate(roles, permissions) {
  console.log('\n🔍 Testing Role Permission Updates');
  console.log('=' + '='.repeat(50));
  
  if (roles.length === 0 || permissions.length === 0) {
    console.log('⚠️  Skipping permission update test - no roles or permissions found');
    return;
  }
  
  const testRole = roles[0]; // Use first role for testing
  const testPermissions = permissions.slice(0, 3); // Use first 3 permissions
  const permissionIds = testPermissions.map(p => p.id);
  
  console.log(`\n🔍 Updating permissions for role: ${testRole.name}`);
  console.log(`📝 Assigning permissions: ${testPermissions.map(p => p.resource + ':' + p.action).join(', ')}`);
  
  const updateResult = await makeRequest(`/api/roles/${testRole.id}/permissions`, 'PUT', {
    permissionIds
  });
  
  if (updateResult.success) {
    console.log('✅ Successfully updated role permissions');
    
    // Verify the update
    const verifyResult = await makeRequest(`/api/roles/${testRole.id}/permissions`);
    if (verifyResult.success) {
      console.log(`✅ Verified: Role now has ${verifyResult.data.permissions?.length || 0} permissions`);
    }
  } else {
    console.error('❌ Failed to update role permissions');
    if (updateResult.error) {
      console.error(`❌ Error details: ${updateResult.error}`);
    }
    if (updateResult.responseText) {
      console.error(`❌ Response text: "${updateResult.responseText}"`);
    }
  }
}

async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive Role Management System Test - Fixed Version');
  console.log('=' + '='.repeat(70));
  console.log(`📋 Using real user ID: ${TEST_USER_ID}`);
  
  try {
    // Test all APIs
    const roles = await testRolesAPI();
    const permissions = await testPermissionsAPI();
    const rolePermissions = await testRolePermissionsAPI(roles);
    
    // Test user role assignment
    await testUserRolesAPI(roles);
    
    // Test role permission updates
    await testRolePermissionUpdate(roles, permissions);
    
    console.log('\n🎉 Comprehensive Role Management Test Complete!');
    console.log('=' + '='.repeat(60));
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`✅ Roles API: ${roles.length} roles found`);
    console.log(`✅ Permissions API: ${permissions.length} permissions found`);
    console.log(`✅ Role-Permissions API: ${Object.keys(rolePermissions).length} roles tested`);
    console.log(`✅ User-Roles API: Assignment and retrieval tested with real user`);
    console.log(`✅ Permission Updates: Role permission modification tested`);
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
runComprehensiveTest();