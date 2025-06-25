#!/usr/bin/env node

/**
 * Choreo Environment Validation Script
 * Tests both dev and prod environment configurations
 */

console.log('🔍 [Validation] Testing Choreo environment configurations...');

const { detectChoreoEnvironment, configureEnvironment } = require('./choreo-env-detector');

// Test scenarios
const testScenarios = [
  {
    name: 'Choreo DEV Environment',
    env: {
      HOSTNAME: 'myapp-dev-12345.choreo.dev',
      CHOREO_ENVIRONMENT: 'dev',
      NODE_ENV: 'development'
    },
    expected: {
      environment: 'development',
      useStandalone: false,
      isChoreoDev: true
    }
  },
  {
    name: 'Choreo PROD Environment',
    env: {
      HOSTNAME: 'myapp-prod-67890.choreo.dev', 
      CHOREO_ENVIRONMENT: 'prod',
      NODE_ENV: 'production'
    },
    expected: {
      environment: 'production',
      useStandalone: true,
      isChoreoProd: true
    }
  },
  {
    name: 'Choreo STAGING Environment',
    env: {
      HOSTNAME: 'myapp-staging-11111.choreo.dev',
      CHOREO_ENVIRONMENT: 'staging',
      NODE_ENV: 'staging'
    },
    expected: {
      environment: 'staging', 
      useStandalone: true,
      isChoreoStaging: true
    }
  },
  {
    name: 'Fallback to NODE_ENV',
    env: {
      HOSTNAME: 'unknown-host',
      NODE_ENV: 'production'
    },
    expected: {
      environment: 'production',
      useStandalone: true
    }
  }
];

// Store original environment
const originalEnv = { ...process.env };

let allTestsPassed = true;
let testResults = [];

// Run tests
for (const scenario of testScenarios) {
  console.log(`\n🧪 [Test] ${scenario.name}`);
  
  // Set test environment
  Object.keys(scenario.env).forEach(key => {
    process.env[key] = scenario.env[key];
  });
  
  try {
    // Run detection
    const result = detectChoreoEnvironment();
    
    // Validate results
    let testPassed = true;
    const errors = [];
    
    Object.keys(scenario.expected).forEach(key => {
      if (result[key] !== scenario.expected[key]) {
        testPassed = false;
        errors.push(`Expected ${key}: ${scenario.expected[key]}, got: ${result[key]}`);
      }
    });
    
    if (testPassed) {
      console.log('   ✅ PASSED');
      testResults.push({ name: scenario.name, status: 'PASSED' });
    } else {
      console.log('   ❌ FAILED');
      errors.forEach(error => console.log(`      - ${error}`));
      testResults.push({ name: scenario.name, status: 'FAILED', errors });
      allTestsPassed = false;
    }
    
  } catch (error) {
    console.log('   ❌ ERROR:', error.message);
    testResults.push({ name: scenario.name, status: 'ERROR', error: error.message });
    allTestsPassed = false;
  }
  
  // Restore original environment
  Object.keys(process.env).forEach(key => {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  });
  Object.keys(originalEnv).forEach(key => {
    process.env[key] = originalEnv[key];
  });
}

// Test configuration function
console.log('\n🔧 [Test] Configuration Function');
try {
  const testConfig = {
    environment: 'production',
    useStandalone: true,
    isChoreo: true
  };
  
  const configured = configureEnvironment(testConfig);
  
  if (configured.environment === testConfig.environment) {
    console.log('   ✅ Configuration function works');
    testResults.push({ name: 'Configuration Function', status: 'PASSED' });
  } else {
    console.log('   ❌ Configuration function failed');
    testResults.push({ name: 'Configuration Function', status: 'FAILED' });
    allTestsPassed = false;
  }
} catch (error) {
  console.log('   ❌ Configuration error:', error.message);
  testResults.push({ name: 'Configuration Function', status: 'ERROR', error: error.message });
  allTestsPassed = false;
}

// Summary
console.log('\n📊 [Summary] Test Results:');
testResults.forEach(result => {
  const status = result.status === 'PASSED' ? '✅' : '❌';
  console.log(`   ${status} ${result.name}: ${result.status}`);
});

console.log(`\n🎯 [Result] Overall: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

if (allTestsPassed) {
  console.log('🚀 [Validation] Choreo environment detection is working correctly!');
  console.log('📋 [Next] You can now deploy to both dev and prod environments');
} else {
  console.log('🚨 [Validation] Issues found - please review the errors above');
  process.exit(1);
}

// Export results for other scripts
module.exports = { testResults, allTestsPassed }; 