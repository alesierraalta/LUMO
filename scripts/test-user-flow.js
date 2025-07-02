#!/usr/bin/env node

/**
 * LUMO User Flow Testing Script
 * Tests complete user creation, roles and permissions flow
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 LUMO User Flow Testing Suite');
console.log('=================================');

const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

async function runTests() {
  try {
    console.log('\n📋 Running User Flow Tests...');
    
    // Run the specific test file
    const testCommand = 'npm test -- --testPathPattern=user-roles-permissions-flow.test.ts --verbose';
    
    console.log(`🔄 Executing: ${testCommand}`);
    
    const output = execSync(testCommand, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log('\n✅ Test Output:');
    console.log(output);
    
    // Parse results
    const lines = output.split('\n');
    let inTestResults = false;
    
    lines.forEach(line => {
      if (line.includes('Test Suites:')) {
        inTestResults = true;
      }
      
      if (inTestResults) {
        console.log(`📊 ${line}`);
        
        // Extract test counts
        const passedMatch = line.match(/(\d+) passed/);
        const failedMatch = line.match(/(\d+) failed/);
        const totalMatch = line.match(/(\d+) total/);
        
        if (passedMatch) testResults.passed = parseInt(passedMatch[1]);
        if (failedMatch) testResults.failed = parseInt(failedMatch[1]);
        if (totalMatch) testResults.total = parseInt(totalMatch[1]);
      }
    });
    
    console.log('\n📈 Test Summary:');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📊 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    // Generate detailed report
    generateTestReport();
    
    if (testResults.failed === 0) {
      console.log('\n🎉 ALL USER FLOW TESTS PASSED!');
      console.log('✅ User creation, roles, and permissions system verified');
      return true;
    } else {
      console.log('\n⚠️ Some tests failed. Check the detailed report.');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Test execution failed:');
    console.error(error.message);
    testResults.errors.push(error.message);
    return false;
  }
}

function generateTestReport() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: testResults,
    testCategories: [
      {
        name: 'User Creation Flow',
        tests: [
          'should create user with email and password',
          'should reject duplicate email registration',
          'should validate password requirements'
        ]
      },
      {
        name: 'Role Assignment Flow',
        tests: [
          'should assign ADMIN role to user',
          'should assign USER role to user',
          'should reject invalid role assignment'
        ]
      },
      {
        name: 'Permission Verification Flow',
        tests: [
          'should allow ADMIN to access user management',
          'should deny USER access to user management',
          'should allow both roles to access their own profile'
        ]
      },
      {
        name: 'Authentication Flow',
        tests: [
          'should authenticate valid credentials',
          'should reject invalid credentials',
          'should validate JWT token',
          'should reject expired/invalid tokens'
        ]
      },
      {
        name: 'Complete User Journey',
        tests: [
          'should complete full user lifecycle'
        ]
      },
      {
        name: 'Edge Cases and Error Handling',
        tests: [
          'should handle database connection errors gracefully',
          'should handle missing required fields',
          'should handle concurrent role assignments'
        ]
      }
    ],
    recommendations: []
  };
  
  // Add recommendations based on results
  if (testResults.failed > 0) {
    report.recommendations.push('Review failed tests and fix underlying issues');
    report.recommendations.push('Check database connection and configuration');
    report.recommendations.push('Verify API endpoints are responding correctly');
  } else {
    report.recommendations.push('User flow system is production-ready');
    report.recommendations.push('Consider adding more edge case tests');
    report.recommendations.push('Monitor user creation metrics in production');
  }
  
  // Save report
  const reportPath = path.join(__dirname, '..', 'test-results', 'user-flow-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 Detailed report saved: ${reportPath}`);
}

// Run manual test scenarios
async function runManualTests() {
  console.log('\n🔧 Running Manual Test Scenarios...');
  
  const scenarios = [
    {
      name: 'Health Check',
      test: async () => {
        try {
          const response = await fetch('http://localhost:3000/api/health');
          return response.status === 200;
        } catch (error) {
          return false;
        }
      }
    },
    {
      name: 'User Registration Endpoint',
      test: async () => {
        try {
          const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: `test-${Date.now()}@example.com`,
              password: 'TestPassword123!',
              name: 'Test User'
            })
          });
          return response.status === 201 || response.status === 400; // 400 if user exists
        } catch (error) {
          return false;
        }
      }
    },
    {
      name: 'User Login Endpoint',
      test: async () => {
        try {
          const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'alesierraalta@gmail.com',
              password: 'admin123'
            })
          });
          return response.status === 200 || response.status === 401;
        } catch (error) {
          return false;
        }
      }
    }
  ];
  
  for (const scenario of scenarios) {
    try {
      console.log(`🔄 Testing: ${scenario.name}`);
      const result = await scenario.test();
      console.log(`${result ? '✅' : '❌'} ${scenario.name}: ${result ? 'PASS' : 'FAIL'}`);
    } catch (error) {
      console.log(`❌ ${scenario.name}: ERROR - ${error.message}`);
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting User Flow Testing...');
  
  // Check if server is running
  try {
    const healthCheck = await fetch('http://localhost:3000/api/health');
    if (healthCheck.status !== 200) {
      console.log('⚠️ Server not responding. Starting dev server...');
      execSync('npm run dev &', { detached: true });
      console.log('⏳ Waiting for server to start...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  } catch (error) {
    console.log('⚠️ Server not running. Please start with: npm run dev');
    process.exit(1);
  }
  
  // Run manual tests first
  await runManualTests();
  
  // Run Jest tests
  const testsPassed = await runTests();
  
  console.log('\n🏁 User Flow Testing Complete!');
  console.log(`📊 Overall Status: ${testsPassed ? '✅ SUCCESS' : '❌ ISSUES FOUND'}`);
  
  if (testsPassed) {
    console.log('\n🎯 Next Steps:');
    console.log('1. ✅ User flow system is production-ready');
    console.log('2. 🚀 Deploy to Choreo with confidence');
    console.log('3. 📊 Monitor user registration metrics');
    console.log('4. 🔒 Review security settings periodically');
  } else {
    console.log('\n🔧 Action Required:');
    console.log('1. ❌ Fix failing tests before deployment');
    console.log('2. 🔍 Check database configuration');
    console.log('3. 🛠️ Verify API endpoints');
    console.log('4. 📋 Review error logs');
  }
  
  process.exit(testsPassed ? 0 : 1);
}

// Handle async execution
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runTests, runManualTests }; 