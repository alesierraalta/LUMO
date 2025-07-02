#!/usr/bin/env node

/**
 * LUMO Production User Flow Testing Script
 * Tests user creation, roles and permissions in production environment
 */

console.log('🌐 LUMO Production User Flow Testing');
console.log('====================================');

const PRODUCTION_URL = 'https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev';

const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  scenarios: []
};

async function testProductionUserFlow() {
  console.log(`\n🎯 Testing Production Environment: ${PRODUCTION_URL}`);
  
  const scenarios = [
    {
      name: 'Health Check',
      description: 'Verify production server is responding',
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
      name: 'Login with Admin Credentials',
      description: 'Test admin login functionality',
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
        return {
          success: response.status === 200 && data.success,
          data: data,
          details: `Status: ${response.status}, Success: ${data?.success}, User: ${data?.user?.email || 'None'}`
        };
      }
    },
    {
      name: 'Verify Admin Permissions',
      description: 'Test admin access to user management',
      test: async () => {
        // First login to get token
        const loginResponse = await fetch(`${PRODUCTION_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'alesierraalta@gmail.com',
            password: 'admin123'
          })
        });
        
        if (loginResponse.status !== 200) {
          return {
            success: false,
            data: null,
            details: 'Failed to login for permission test'
          };
        }
        
        const loginData = await loginResponse.json();
        const token = loginData.token;
        
        // Test access to users endpoint
        const usersResponse = await fetch(`${PRODUCTION_URL}/api/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const usersData = await usersResponse.json();
        
        return {
          success: usersResponse.status === 200,
          data: usersData,
          details: `Status: ${usersResponse.status}, Users Count: ${Array.isArray(usersData) ? usersData.length : 'N/A'}`
        };
      }
    },
    {
      name: 'Test User Registration',
      description: 'Verify new user registration works',
      test: async () => {
        const testEmail = `prod-test-${Date.now()}@example.com`;
        const response = await fetch(`${PRODUCTION_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testEmail,
            password: 'TestPassword123!',
            name: 'Production Test User'
          })
        });
        
        const data = await response.json();
        
        return {
          success: response.status === 201 && data.success,
          data: data,
          details: `Status: ${response.status}, Success: ${data?.success}, Email: ${testEmail}`
        };
      }
    },
    {
      name: 'Test Role Management',
      description: 'Verify role assignment functionality',
      test: async () => {
        // Login as admin
        const loginResponse = await fetch(`${PRODUCTION_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'alesierraalta@gmail.com',
            password: 'admin123'
          })
        });
        
        if (loginResponse.status !== 200) {
          return {
            success: false,
            data: null,
            details: 'Failed to login for role test'
          };
        }
        
        const loginData = await loginResponse.json();
        const token = loginData.token;
        
        // Get roles list
        const rolesResponse = await fetch(`${PRODUCTION_URL}/api/roles`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const rolesData = await rolesResponse.json();
        
        return {
          success: rolesResponse.status === 200,
          data: rolesData,
          details: `Status: ${rolesResponse.status}, Roles Count: ${Array.isArray(rolesData) ? rolesData.length : 'N/A'}`
        };
      }
    },
    {
      name: 'Test Permission Validation',
      description: 'Verify permission checking works correctly',
      test: async () => {
        // Login as admin
        const loginResponse = await fetch(`${PRODUCTION_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'alesierraalta@gmail.com',
            password: 'admin123'
          })
        });
        
        if (loginResponse.status !== 200) {
          return {
            success: false,
            data: null,
            details: 'Failed to login for permission validation test'
          };
        }
        
        const loginData = await loginResponse.json();
        const token = loginData.token;
        
        // Test permission check endpoint
        const permissionResponse = await fetch(`${PRODUCTION_URL}/api/auth/check-permissions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const permissionData = await permissionResponse.json();
        
        return {
          success: permissionResponse.status === 200 && permissionData.valid,
          data: permissionData,
          details: `Status: ${permissionResponse.status}, Valid: ${permissionData?.valid}, Role: ${permissionData?.user?.role || 'Unknown'}`
        };
      }
    }
  ];
  
  console.log(`\n🧪 Running ${scenarios.length} Production Test Scenarios...\n`);
  
  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    testResults.total++;
    
    try {
      console.log(`🔄 [${i + 1}/${scenarios.length}] ${scenario.name}`);
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
        console.log(`   🔍 Error Data:`, result.data);
      }
      
      testResults.scenarios.push({
        name: scenario.name,
        success: result.success,
        duration: duration,
        details: result.details,
        data: result.data
      });
      
      console.log('');
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      testResults.failed++;
      console.log(`   ❌ FAIL (Error: ${error.message})`);
      console.log('');
      
      testResults.scenarios.push({
        name: scenario.name,
        success: false,
        duration: 0,
        details: `Error: ${error.message}`,
        data: null
      });
    }
  }
  
  // Generate summary
  generateProductionTestSummary();
  
  return testResults.failed === 0;
}

function generateProductionTestSummary() {
  console.log('📈 PRODUCTION TEST SUMMARY');
  console.log('==========================');
  console.log(`🎯 Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 ALL PRODUCTION TESTS PASSED!');
    console.log('✅ User flow system is working correctly in production');
    console.log('🚀 System is ready for users');
  } else {
    console.log('\n⚠️ SOME TESTS FAILED');
    console.log('❌ Production issues detected');
    console.log('🔧 Immediate action required');
  }
  
  console.log('\n📋 DETAILED RESULTS:');
  testResults.scenarios.forEach((scenario, index) => {
    const status = scenario.success ? '✅' : '❌';
    console.log(`${status} [${index + 1}] ${scenario.name} (${scenario.duration}ms)`);
    console.log(`    ${scenario.details}`);
  });
  
  // Save results
  const fs = require('fs');
  const path = require('path');
  
  const reportPath = path.join(__dirname, '..', 'test-results', 'production-user-flow-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  
  const report = {
    timestamp: new Date().toISOString(),
    environment: 'production',
    url: PRODUCTION_URL,
    summary: testResults,
    recommendations: generateRecommendations()
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved: ${reportPath}`);
}

function generateRecommendations() {
  const recommendations = [];
  
  if (testResults.failed === 0) {
    recommendations.push('🎯 Production user flow is fully functional');
    recommendations.push('📊 Monitor user registration and login metrics');
    recommendations.push('🔒 Review security settings periodically');
    recommendations.push('📈 Consider implementing user analytics');
  } else {
    recommendations.push('🚨 Fix failing production tests immediately');
    recommendations.push('🔍 Check database connectivity and configuration');
    recommendations.push('🛠️ Verify API endpoints are responding correctly');
    recommendations.push('📋 Review server logs for errors');
    recommendations.push('⚡ Test in staging environment first');
  }
  
  return recommendations;
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting Production User Flow Testing...');
    
    const success = await testProductionUserFlow();
    
    console.log('\n🏁 Production Testing Complete!');
    
    if (success) {
      console.log('\n🎯 PRODUCTION STATUS: ✅ HEALTHY');
      console.log('🚀 User flow system is production-ready');
      console.log('📊 All critical functionality verified');
    } else {
      console.log('\n🎯 PRODUCTION STATUS: ❌ ISSUES DETECTED');
      console.log('🔧 Immediate attention required');
      console.log('📋 Check detailed report for specific issues');
    }
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Fatal error during production testing:', error);
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

module.exports = { testProductionUserFlow }; 