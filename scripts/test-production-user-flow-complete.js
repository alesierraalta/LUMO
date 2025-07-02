#!/usr/bin/env node

/**
 * LUMO Production User Flow Complete Testing
 * Tests ALL user creation, roles and permissions in production Choreo environment
 */

console.log('🌐 LUMO Production User Flow Complete Testing');
console.log('==============================================');

const PRODUCTION_URL = 'https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev';

const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  scenarios: [],
  adminToken: null,
  testUsers: []
};

async function testCompleteUserFlow() {
  console.log(`\n🎯 Testing Production Environment: ${PRODUCTION_URL}`);
  console.log('📋 Testing Complete User Creation, Roles & Permissions Flow\n');
  
  const scenarios = [
    {
      name: 'Health Check',
      description: 'Verify production server is responding',
      critical: true,
      test: async () => {
        const response = await fetch(`${PRODUCTION_URL}/api/health`);
        const data = await response.json();
        return {
          success: response.status === 200,
          data: data,
          details: `Status: ${response.status}, Service: ${data?.service || 'Unknown'}`
        };
      }
    },
    {
      name: 'Admin Authentication',
      description: 'Login with admin credentials and get token',
      critical: true,
      test: async () => {
        const response = await fetch(`${PRODUCTION_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'alesierraalta@gmail.com',
            password: 'admin123'
          })
        });
        
        const data = await response.json();
        
        if (response.status === 200 && data.success && data.token) {
          testResults.adminToken = data.token;
        }
        
        return {
          success: response.status === 200 && data.success,
          data: data,
          details: `Status: ${response.status}, Success: ${data?.success}, Token: ${data?.token ? 'Received' : 'Missing'}`
        };
      }
    },
    {
      name: 'Admin Permissions Verification',
      description: 'Verify admin can access user management',
      critical: true,
      test: async () => {
        if (!testResults.adminToken) {
          return {
            success: false,
            data: null,
            details: 'No admin token available'
          };
        }
        
        const response = await fetch(`${PRODUCTION_URL}/api/users`, {
          headers: { 'Authorization': `Bearer ${testResults.adminToken}` }
        });
        
        const data = await response.json();
        
        return {
          success: response.status === 200,
          data: data,
          details: `Status: ${response.status}, Users Count: ${Array.isArray(data) ? data.length : 'N/A'}`
        };
      }
    },
    {
      name: 'User Registration Test 1',
      description: 'Create new user with USER role',
      critical: true,
      test: async () => {
        const testEmail = `prod-user-${Date.now()}@example.com`;
        const testPassword = 'TestUser123!';
        
        const response = await fetch(`${PRODUCTION_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testEmail,
            password: testPassword,
            name: 'Production Test User'
          })
        });
        
        const data = await response.json();
        
        if (response.status === 201 && data.success) {
          testResults.testUsers.push({
            id: data.user.id,
            email: testEmail,
            password: testPassword,
            role: data.user.role
          });
        }
        
        return {
          success: response.status === 201 && data.success,
          data: data,
          details: `Status: ${response.status}, Success: ${data?.success}, Email: ${testEmail}, Role: ${data?.user?.role}`
        };
      }
    },
    {
      name: 'User Registration Test 2',
      description: 'Create second user for role testing',
      critical: true,
      test: async () => {
        const testEmail = `prod-admin-${Date.now()}@example.com`;
        const testPassword = 'TestAdmin123!';
        
        const response = await fetch(`${PRODUCTION_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testEmail,
            password: testPassword,
            name: 'Production Test Admin'
          })
        });
        
        const data = await response.json();
        
        if (response.status === 201 && data.success) {
          testResults.testUsers.push({
            id: data.user.id,
            email: testEmail,
            password: testPassword,
            role: data.user.role
          });
        }
        
        return {
          success: response.status === 201 && data.success,
          data: data,
          details: `Status: ${response.status}, Success: ${data?.success}, Email: ${testEmail}, Role: ${data?.user?.role}`
        };
      }
    },
    {
      name: 'Role Assignment Test',
      description: 'Assign ADMIN role to second user',
      critical: true,
      test: async () => {
        if (!testResults.adminToken || testResults.testUsers.length < 2) {
          return {
            success: false,
            data: null,
            details: 'Prerequisites not met (need admin token and 2 test users)'
          };
        }
        
        const userToPromote = testResults.testUsers[1];
        
        // First get available roles
        const rolesResponse = await fetch(`${PRODUCTION_URL}/api/roles`, {
          headers: { 'Authorization': `Bearer ${testResults.adminToken}` }
        });
        
        if (rolesResponse.status !== 200) {
          return {
            success: false,
            data: null,
            details: 'Could not fetch roles list'
          };
        }
        
        const roles = await rolesResponse.json();
        const adminRole = roles.find(role => role.name === 'ADMIN');
        
        if (!adminRole) {
          return {
            success: false,
            data: roles,
            details: 'ADMIN role not found in roles list'
          };
        }
        
        // Assign ADMIN role
        const assignResponse = await fetch(`${PRODUCTION_URL}/api/users/${userToPromote.id}/role`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testResults.adminToken}` 
          },
          body: JSON.stringify({
            roleId: adminRole.id
          })
        });
        
        const assignData = await assignResponse.json();
        
        return {
          success: assignResponse.status === 200 && assignData.success,
          data: assignData,
          details: `Status: ${assignResponse.status}, Success: ${assignData?.success}, User: ${userToPromote.email}, Role: ADMIN`
        };
      }
    },
    {
      name: 'New Admin Login Test',
      description: 'Login with newly promoted admin user',
      critical: true,
      test: async () => {
        if (testResults.testUsers.length < 2) {
          return {
            success: false,
            data: null,
            details: 'No promoted admin user available'
          };
        }
        
        const newAdmin = testResults.testUsers[1];
        
        const response = await fetch(`${PRODUCTION_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: newAdmin.email,
            password: newAdmin.password
          })
        });
        
        const data = await response.json();
        
        return {
          success: response.status === 200 && data.success,
          data: data,
          details: `Status: ${response.status}, Success: ${data?.success}, User: ${newAdmin.email}, Role: ${data?.user?.role}`
        };
      }
    },
    {
      name: 'Permission Validation Test',
      description: 'Verify permission checking works correctly',
      critical: true,
      test: async () => {
        if (!testResults.adminToken) {
          return {
            success: false,
            data: null,
            details: 'No admin token for permission test'
          };
        }
        
        const response = await fetch(`${PRODUCTION_URL}/api/auth/check-permissions`, {
          headers: { 'Authorization': `Bearer ${testResults.adminToken}` }
        });
        
        const data = await response.json();
        
        return {
          success: response.status === 200 && data.valid,
          data: data,
          details: `Status: ${response.status}, Valid: ${data?.valid}, Role: ${data?.user?.role || 'Unknown'}`
        };
      }
    },
    {
      name: 'User Access Control Test',
      description: 'Test regular user cannot access admin functions',
      critical: true,
      test: async () => {
        if (testResults.testUsers.length < 1) {
          return {
            success: false,
            data: null,
            details: 'No regular user available for test'
          };
        }
        
        const regularUser = testResults.testUsers[0];
        
        // Login as regular user
        const loginResponse = await fetch(`${PRODUCTION_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: regularUser.email,
            password: regularUser.password
          })
        });
        
        if (loginResponse.status !== 200) {
          return {
            success: false,
            data: null,
            details: 'Could not login as regular user'
          };
        }
        
        const loginData = await loginResponse.json();
        const userToken = loginData.token;
        
        // Try to access admin endpoint (should fail)
        const adminResponse = await fetch(`${PRODUCTION_URL}/api/users`, {
          headers: { 'Authorization': `Bearer ${userToken}` }
        });
        
        // Success means the access was properly denied (403/401)
        const accessDenied = adminResponse.status === 403 || adminResponse.status === 401;
        
        return {
          success: accessDenied,
          data: { status: adminResponse.status, userRole: loginData.user?.role },
          details: `Login: OK, Admin Access: ${accessDenied ? 'DENIED (Good)' : 'ALLOWED (Bad)'}, Status: ${adminResponse.status}`
        };
      }
    },
    {
      name: 'Invalid Credentials Test',
      description: 'Verify invalid login is rejected',
      critical: false,
      test: async () => {
        const response = await fetch(`${PRODUCTION_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'invalid@example.com',
            password: 'wrongpassword'
          })
        });
        
        const data = await response.json();
        
        return {
          success: response.status === 401 && !data.success,
          data: data,
          details: `Status: ${response.status}, Success: ${data?.success}, Expected: 401 with failure`
        };
      }
    },
    {
      name: 'Invalid Token Test',
      description: 'Verify invalid JWT token is rejected',
      critical: false,
      test: async () => {
        const response = await fetch(`${PRODUCTION_URL}/api/auth/check-permissions`, {
          headers: { 'Authorization': 'Bearer invalid.jwt.token' }
        });
        
        const data = await response.json();
        
        return {
          success: response.status === 401 && !data.valid,
          data: data,
          details: `Status: ${response.status}, Valid: ${data?.valid}, Expected: 401 with invalid`
        };
      }
    },
    {
      name: 'Complete User Journey Test',
      description: 'End-to-end user lifecycle validation',
      critical: true,
      test: async () => {
        // This test validates the complete flow worked
        const criticalTests = testResults.scenarios.filter(s => s.critical && s.success !== undefined);
        const criticalPassed = criticalTests.filter(s => s.success).length;
        const criticalTotal = criticalTests.length;
        
        const journeyComplete = criticalPassed === criticalTotal;
        
        return {
          success: journeyComplete,
          data: {
            criticalPassed,
            criticalTotal,
            testUsers: testResults.testUsers.length,
            adminToken: !!testResults.adminToken
          },
          details: `Critical Tests: ${criticalPassed}/${criticalTotal}, Users Created: ${testResults.testUsers.length}, Admin Token: ${!!testResults.adminToken}`
        };
      }
    }
  ];
  
  console.log(`🧪 Running ${scenarios.length} Production Test Scenarios...\n`);
  
  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    testResults.total++;
    
    try {
      const criticalFlag = scenario.critical ? '🔴 CRITICAL' : '🟡 OPTIONAL';
      console.log(`🔄 [${i + 1}/${scenarios.length}] ${scenario.name} ${criticalFlag}`);
      console.log(`   📝 ${scenario.description}`);
      
      const startTime = Date.now();
      const result = await scenario.test();
      const duration = Date.now() - startTime;
      
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`   ${status} (${duration}ms)`);
      console.log(`   📊 ${result.details}`);
      
      if (result.success) {
        testResults.passed++;
      } else {
        testResults.failed++;
        if (scenario.critical) {
          console.log(`   🚨 CRITICAL TEST FAILED!`);
        }
        if (result.data && typeof result.data === 'object') {
          console.log(`   🔍 Data:`, JSON.stringify(result.data, null, 2).substring(0, 300) + '...');
        }
      }
      
      testResults.scenarios.push({
        name: scenario.name,
        success: result.success,
        duration: duration,
        details: result.details,
        critical: scenario.critical
      });
      
      console.log('');
      
      // Longer delay for critical tests
      const delay = scenario.critical ? 2000 : 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
    } catch (error) {
      testResults.failed++;
      const errorMsg = `Error: ${error.message}`;
      console.log(`   ❌ FAIL (${errorMsg})`);
      
      if (scenario.critical) {
        console.log(`   🚨 CRITICAL TEST ERROR!`);
      }
      
      console.log('');
      
      testResults.scenarios.push({
        name: scenario.name,
        success: false,
        duration: 0,
        details: errorMsg,
        critical: scenario.critical
      });
    }
  }
  
  generateProductionSummary();
  return evaluateOverallSuccess();
}

function evaluateOverallSuccess() {
  const criticalTests = testResults.scenarios.filter(s => s.critical);
  const criticalPassed = criticalTests.filter(s => s.success);
  const criticalFailed = criticalTests.filter(s => !s.success);
  
  // All critical tests must pass
  const criticalSuccess = criticalFailed.length === 0;
  
  return {
    overall: criticalSuccess && testResults.failed <= 2, // Allow up to 2 non-critical failures
    critical: criticalSuccess,
    criticalPassed: criticalPassed.length,
    criticalTotal: criticalTests.length,
    criticalFailed: criticalFailed.length
  };
}

function generateProductionSummary() {
  console.log('📈 PRODUCTION COMPLETE TEST SUMMARY');
  console.log('===================================');
  console.log(`🎯 Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  const evaluation = evaluateOverallSuccess();
  
  console.log('\n🔴 CRITICAL TESTS ANALYSIS:');
  console.log(`✅ Critical Passed: ${evaluation.criticalPassed}`);
  console.log(`❌ Critical Failed: ${evaluation.criticalFailed}`);
  console.log(`📊 Critical Success Rate: ${((evaluation.criticalPassed / evaluation.criticalTotal) * 100).toFixed(1)}%`);
  
  if (evaluation.overall) {
    console.log('\n🎉 PRODUCTION USER FLOW: ✅ FULLY FUNCTIONAL');
    console.log('✅ All critical user flow functionality working');
    console.log('🚀 User creation, roles, and permissions system operational');
    console.log('🔒 Authentication and authorization properly enforced');
    console.log('📊 System ready for production users');
  } else {
    console.log('\n⚠️ PRODUCTION USER FLOW: ❌ CRITICAL ISSUES');
    console.log('🚨 Critical functionality not working correctly');
    console.log('🔧 Immediate fixes required before user access');
    console.log('📋 Review failed critical tests');
  }
  
  console.log('\n📋 DETAILED TEST RESULTS:');
  testResults.scenarios.forEach((scenario, index) => {
    const status = scenario.success ? '✅' : '❌';
    const critical = scenario.critical ? '🔴' : '🟡';
    console.log(`${status} ${critical} [${index + 1}] ${scenario.name} (${scenario.duration}ms)`);
    console.log(`    ${scenario.details}`);
  });
  
  console.log('\n👥 TEST USERS CREATED:');
  testResults.testUsers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email} (${user.role}) - ID: ${user.id}`);
  });
  
  // Save comprehensive report
  const fs = require('fs');
  const path = require('path');
  
  const reportPath = path.join(__dirname, '..', 'test-results', 'production-complete-user-flow-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  
  const report = {
    timestamp: new Date().toISOString(),
    environment: 'production',
    url: PRODUCTION_URL,
    summary: testResults,
    evaluation: evaluation,
    testUsers: testResults.testUsers,
    recommendations: generateDetailedRecommendations(evaluation)
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Complete report saved: ${reportPath}`);
}

function generateDetailedRecommendations(evaluation) {
  const recommendations = [];
  
  if (evaluation.overall) {
    recommendations.push('🎯 Production user flow system is fully operational');
    recommendations.push('✅ User registration, authentication, and role management working correctly');
    recommendations.push('🔒 Permission system properly enforcing access control');
    recommendations.push('👥 System ready to onboard production users');
    recommendations.push('📊 Monitor user registration and login metrics');
    recommendations.push('🔄 Set up automated user flow monitoring');
    recommendations.push('📈 Consider implementing user analytics and activity tracking');
  } else {
    recommendations.push('🚨 CRITICAL: Fix failing tests immediately before allowing user access');
    recommendations.push('🔍 Investigate authentication and authorization failures');
    recommendations.push('🛠️ Verify database connectivity and user table integrity');
    recommendations.push('📋 Check API endpoint implementations for user management');
    recommendations.push('🔒 Review JWT token generation and validation');
    recommendations.push('⚡ Test role assignment and permission checking logic');
    recommendations.push('🧪 Re-run tests after fixes to verify resolution');
  }
  
  return recommendations;
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting Complete Production User Flow Testing...');
    console.log('🎯 Target: User Creation, Roles & Permissions Validation');
    console.log('🌐 Environment: Choreo Production');
    
    const result = await testCompleteUserFlow();
    
    console.log('\n🏁 Complete Production Testing Finished!');
    
    if (result.overall) {
      console.log('\n🎯 FINAL STATUS: ✅ PRODUCTION READY');
      console.log('🚀 Complete user flow system verified and operational');
      console.log('👥 Ready for production user onboarding');
      console.log('🔒 Security and permissions properly enforced');
    } else {
      console.log('\n🎯 FINAL STATUS: ❌ CRITICAL ISSUES DETECTED');
      console.log('🚨 Production user flow has critical failures');
      console.log('🔧 Immediate fixes required before user access');
      console.log('📋 Review detailed report for specific issues');
    }
    
    process.exit(result.overall ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Fatal error during complete production testing:', error);
    process.exit(1);
  }
}

// Handle async execution
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { testCompleteUserFlow }; 