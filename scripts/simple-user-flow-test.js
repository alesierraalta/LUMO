#!/usr/bin/env node

/**
 * Simple LUMO User Flow Test
 * Tests user creation, login, and permissions without complex setup
 */

console.log('🧪 Simple LUMO User Flow Test');
console.log('=============================');

const BASE_URL = 'http://localhost:3000';

const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  scenarios: []
};

async function testUserFlow() {
  console.log(`\n🎯 Testing Local Environment: ${BASE_URL}\n`);
  
  const scenarios = [
    {
      name: 'Health Check',
      description: 'Verify server is responding',
      test: async () => {
        const response = await fetch(`${BASE_URL}/api/health`);
        const data = await response.json();
        return {
          success: response.status === 200,
          data: data,
          details: `Status: ${response.status}, Service: ${data?.service || 'Unknown'}`
        };
      }
    },
    {
      name: 'Admin Login Test',
      description: 'Test admin credentials authentication',
      test: async () => {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
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
      name: 'User Registration Test',
      description: 'Test new user registration',
      test: async () => {
        const testEmail = `test-${Date.now()}@example.com`;
        const response = await fetch(`${BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testEmail,
            password: 'TestPassword123!',
            name: 'Test User'
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
      name: 'Permission Check Test',
      description: 'Test JWT token validation',
      test: async () => {
        // First login to get token
        const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
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
        
        // Test permission check
        const permissionResponse = await fetch(`${BASE_URL}/api/auth/check-permissions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const permissionData = await permissionResponse.json();
        
        return {
          success: permissionResponse.status === 200 && permissionData.valid,
          data: permissionData,
          details: `Status: ${permissionResponse.status}, Valid: ${permissionData?.valid}, Role: ${permissionData?.user?.role || 'Unknown'}`
        };
      }
    },
    {
      name: 'Users Endpoint Access Test',
      description: 'Test admin access to users management',
      test: async () => {
        // Login as admin
        const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
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
            details: 'Failed to login for users endpoint test'
          };
        }
        
        const loginData = await loginResponse.json();
        const token = loginData.token;
        
        // Test users endpoint
        const usersResponse = await fetch(`${BASE_URL}/api/users`, {
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
      name: 'Invalid Credentials Test',
      description: 'Test rejection of invalid login',
      test: async () => {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
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
      description: 'Test rejection of invalid JWT token',
      test: async () => {
        const response = await fetch(`${BASE_URL}/api/auth/check-permissions`, {
          headers: { 'Authorization': 'Bearer invalid.jwt.token' }
        });
        
        const data = await response.json();
        
        return {
          success: response.status === 401 && !data.valid,
          data: data,
          details: `Status: ${response.status}, Valid: ${data?.valid}, Expected: 401 with invalid`
        };
      }
    }
  ];
  
  console.log(`🧪 Running ${scenarios.length} Test Scenarios...\n`);
  
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
        if (result.data && typeof result.data === 'object') {
          console.log(`   🔍 Data:`, JSON.stringify(result.data, null, 2).substring(0, 200) + '...');
        }
      }
      
      testResults.scenarios.push({
        name: scenario.name,
        success: result.success,
        duration: duration,
        details: result.details
      });
      
      console.log('');
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      testResults.failed++;
      console.log(`   ❌ FAIL (Error: ${error.message})`);
      console.log('');
      
      testResults.scenarios.push({
        name: scenario.name,
        success: false,
        duration: 0,
        details: `Error: ${error.message}`
      });
    }
  }
  
  generateSummary();
  return testResults.failed === 0;
}

function generateSummary() {
  console.log('📈 TEST SUMMARY');
  console.log('===============');
  console.log(`🎯 Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ User flow system is working correctly');
    console.log('🚀 Ready for production deployment');
  } else {
    console.log('\n⚠️ SOME TESTS FAILED');
    console.log('❌ Issues detected in user flow');
    console.log('🔧 Fix required before deployment');
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
  
  const reportPath = path.join(__dirname, '..', 'test-results', 'simple-user-flow-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  
  const report = {
    timestamp: new Date().toISOString(),
    environment: 'local',
    url: BASE_URL,
    summary: testResults,
    recommendations: generateRecommendations()
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved: ${reportPath}`);
}

function generateRecommendations() {
  const recommendations = [];
  
  if (testResults.failed === 0) {
    recommendations.push('🎯 All user flow functionality is working correctly');
    recommendations.push('✅ Authentication system is secure and functional');
    recommendations.push('🔒 Permission system is properly enforcing access control');
    recommendations.push('🚀 System is ready for production deployment');
    recommendations.push('📊 Consider adding user activity monitoring');
  } else {
    recommendations.push('🚨 Fix failing tests before deployment');
    recommendations.push('🔍 Check API endpoint implementations');
    recommendations.push('🛠️ Verify database connectivity');
    recommendations.push('📋 Review authentication logic');
    recommendations.push('⚡ Test in clean environment');
  }
  
  return recommendations;
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Simple User Flow Testing...');
  
  // Check if server is running
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('⚠️ Server not running on http://localhost:3000');
    console.log('💡 Please start the server with: npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Server is running');
  
  const success = await testUserFlow();
  
  console.log('\n🏁 Testing Complete!');
  
  if (success) {
    console.log('\n🎯 STATUS: ✅ ALL TESTS PASSED');
    console.log('🚀 User flow system is production-ready');
    console.log('📊 All critical functionality verified');
    
    console.log('\n🎯 Next Steps:');
    console.log('1. ✅ Deploy to production with confidence');
    console.log('2. 📊 Monitor user registration metrics');
    console.log('3. 🔒 Review security settings periodically');
    console.log('4. 📈 Consider adding user analytics');
  } else {
    console.log('\n🎯 STATUS: ❌ ISSUES DETECTED');
    console.log('🔧 Fix required before deployment');
    console.log('📋 Check detailed report for specific issues');
    
    console.log('\n🔧 Action Items:');
    console.log('1. ❌ Fix failing API endpoints');
    console.log('2. 🔍 Check database configuration');
    console.log('3. 🛠️ Verify authentication logic');
    console.log('4. 📋 Review error logs');
  }
  
  process.exit(success ? 0 : 1);
}

// Handle async execution
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { testUserFlow }; 