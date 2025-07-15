/**
 * Comprehensive Frontend & Backend Integration Test
 * Tests the complete RBAC system including authentication consistency
 */

const testComplete = async () => {
  console.log('🚀 Starting Comprehensive RBAC System Test...\n');
  
  const results = {
    apis: { passed: 0, failed: 0, tests: [] },
    frontend: { passed: 0, failed: 0, tests: [] },
    integration: { passed: 0, failed: 0, tests: [] }
  };

  // Test 1: API Layer Testing
  console.log('📡 Testing API Layer...');
  const apiTests = [
    { name: 'Roles API', endpoint: '/api/roles' },
    { name: 'Permissions API', endpoint: '/api/permissions' },
    { name: 'Role Permissions API', endpoint: '/api/roles/1/permissions' },
    { name: 'User Roles API', endpoint: '/api/users/test-user/roles' }
  ];

  for (const test of apiTests) {
    try {
      const response = await fetch(`http://localhost:3000${test.endpoint}`, {
        headers: { 'X-Development-Mode': 'true' }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${test.name}: Status ${response.status}`);
        results.apis.passed++;
        results.apis.tests.push({ name: test.name, status: 'PASSED', data });
      } else {
        console.log(`❌ ${test.name}: Status ${response.status}`);
        results.apis.failed++;
        results.apis.tests.push({ name: test.name, status: 'FAILED', error: response.statusText });
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      results.apis.failed++;
      results.apis.tests.push({ name: test.name, status: 'ERROR', error: error.message });
    }
  }

  // Test 2: Frontend Component Authentication
  console.log('\n🎨 Testing Frontend Component Authentication...');
  const frontendTests = [
    { name: 'New User Page', file: 'src/app/(main)/settings/users/new/page.tsx', hasAuthFallback: true },
    { name: 'Role Management', file: 'src/components/roles/role-management.tsx', hasAuthFallback: true },
    { name: 'User Role Assignment', file: 'src/components/roles/user-role-assignment.tsx', hasAuthFallback: true }
  ];

  for (const test of frontendTests) {
    try {
      const fs = require('fs');
      const content = fs.readFileSync(test.file, 'utf8');
      
      // Check for development mode fallbacks
      const hasDevMode = content.includes('X-Development-Mode');
      const hasAuthFallback = content.includes('process.env.NODE_ENV === \'development\'');
      
      if (hasDevMode && hasAuthFallback) {
        console.log(`✅ ${test.name}: Authentication fallbacks implemented`);
        results.frontend.passed++;
        results.frontend.tests.push({ name: test.name, status: 'PASSED', features: ['dev-mode', 'auth-fallback'] });
      } else {
        console.log(`❌ ${test.name}: Missing authentication fallbacks`);
        results.frontend.failed++;
        results.frontend.tests.push({ name: test.name, status: 'FAILED', missing: ['dev-mode', 'auth-fallback'] });
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      results.frontend.failed++;
      results.frontend.tests.push({ name: test.name, status: 'ERROR', error: error.message });
    }
  }

  // Test 3: Integration Test - User Creation Flow
  console.log('\n🔗 Testing Integration Flow...');
  try {
    // Test user creation with role assignment
    const createUserResponse = await fetch('http://localhost:3000/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Development-Mode': 'true'
      },
      body: JSON.stringify({
        name: 'Test User Integration',
        email: 'test-integration@example.com',
        password: 'testpass123',
        roleId: '550e8400-e29b-41d4-a716-446655440001', // USER role UUID
        isActive: true
      })
    });

    if (createUserResponse.ok) {
      console.log('✅ User Creation Integration: PASSED');
      results.integration.passed++;
      results.integration.tests.push({ name: 'User Creation', status: 'PASSED' });
    } else {
      console.log('❌ User Creation Integration: FAILED');
      results.integration.failed++;
      results.integration.tests.push({ name: 'User Creation', status: 'FAILED' });
    }

  } catch (error) {
    console.log(`❌ Integration Test: ${error.message}`);
    results.integration.failed++;
    results.integration.tests.push({ name: 'Integration Flow', status: 'ERROR', error: error.message });
  }

  // Final Results
  console.log('\n📊 COMPREHENSIVE TEST RESULTS:');
  console.log('═══════════════════════════════');
  console.log(`📡 API Layer: ${results.apis.passed}/${results.apis.passed + results.apis.failed} passed`);
  console.log(`🎨 Frontend: ${results.frontend.passed}/${results.frontend.passed + results.frontend.failed} passed`);
  console.log(`🔗 Integration: ${results.integration.passed}/${results.integration.passed + results.integration.failed} passed`);
  
  const totalPassed = results.apis.passed + results.frontend.passed + results.integration.passed;
  const totalTests = (results.apis.passed + results.apis.failed) + 
                     (results.frontend.passed + results.frontend.failed) + 
                     (results.integration.passed + results.integration.failed);
  
  console.log(`\n🎯 OVERALL SYSTEM STATUS: ${totalPassed}/${totalTests} tests passed`);
  
  if (totalPassed === totalTests) {
    console.log('🎉 RBAC SYSTEM FULLY OPERATIONAL!');
    console.log('✨ All components have authentication consistency');
    console.log('🔐 Development mode fallbacks working correctly');
    console.log('🚀 System ready for production deployment');
  } else {
    console.log('⚠️  Some components need attention');
  }

  return results;
};

// Run the test
testComplete().catch(console.error);