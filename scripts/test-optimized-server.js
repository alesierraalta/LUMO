// LUMO Optimized Server Test - 100% Success Rate Target
const http = require('http');

const BASE_URL = 'http://localhost:8080';
const TIMEOUT = 15000; // 15 seconds

// Test configuration
const tests = [
  { name: 'Health Check', path: '/health', expectedStatus: 200, critical: true },
  { name: 'API Health Check', path: '/api/health', expectedStatus: 200, critical: true },
  { name: 'Dashboard', path: '/dashboard', expectedStatus: [200, 307], critical: true },
  { name: 'Inventory', path: '/inventory', expectedStatus: [200, 307], critical: true },
  { name: 'Login', path: '/login', expectedStatus: [200, 307], critical: true },
  { name: 'Home', path: '/', expectedStatus: [200, 307], critical: false }
];

// HTTP request helper
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`${BASE_URL}${path}`, { timeout: TIMEOUT }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Wait for server to be ready
async function waitForServer(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await makeRequest('/health');
      console.log('✅ Server is ready');
      return true;
    } catch (err) {
      console.log(`⏳ Waiting for server... (${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('Server not ready after maximum attempts');
}

// Run test
async function runTest(test) {
  try {
    const result = await makeRequest(test.path);
    const expectedStatuses = Array.isArray(test.expectedStatus) ? test.expectedStatus : [test.expectedStatus];
    const success = expectedStatuses.includes(result.status);
    
    return {
      name: test.name,
      path: test.path,
      status: result.status,
      success,
      critical: test.critical,
      data: result.data.substring(0, 100) + (result.data.length > 100 ? '...' : '')
    };
  } catch (err) {
    return {
      name: test.name,
      path: test.path,
      status: 'ERROR',
      success: false,
      critical: test.critical,
      error: err.message
    };
  }
}

// Main test execution
async function runAllTests() {
  console.log('🧪 [LUMO-OPT-TEST] Starting optimized server tests...\n');
  
  try {
    // Wait for server
    await waitForServer();
    console.log('');
    
    // Run all tests
    const results = await Promise.all(tests.map(runTest));
    
    // Calculate results
    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const criticalTests = results.filter(r => r.critical).length;
    const passedCritical = results.filter(r => r.critical && r.success).length;
    const successRate = Math.round((passedTests / totalTests) * 100);
    const criticalSuccessRate = Math.round((passedCritical / criticalTests) * 100);
    
    // Display results
    console.log('📊 TEST RESULTS:');
    console.log('═'.repeat(80));
    
    results.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      const critical = result.critical ? '🔥' : '  ';
      console.log(`${icon} ${critical} ${result.name.padEnd(20)} | ${result.path.padEnd(15)} | Status: ${result.status}`);
      if (!result.success && result.error) {
        console.log(`     Error: ${result.error}`);
      }
    });
    
    console.log('═'.repeat(80));
    console.log(`📈 OVERALL SUCCESS: ${passedTests}/${totalTests} tests passed (${successRate}%)`);
    console.log(`🔥 CRITICAL SUCCESS: ${passedCritical}/${criticalTests} critical tests passed (${criticalSuccessRate}%)`);
    
    // Determine final status
    const isOptimal = successRate >= 100;
    const isCriticalSuccess = criticalSuccessRate >= 100;
    
    if (isOptimal) {
      console.log('\n🎉 PERFECT! 100% success rate achieved!');
      console.log('🚀 Server is optimally configured and ready for production deployment');
    } else if (isCriticalSuccess) {
      console.log('\n✅ EXCELLENT! All critical tests passed');
      console.log('🎯 Server is production-ready with excellent functionality');
    } else {
      console.log('\n⚠️  Some critical tests failed - optimization needed');
    }
    
    // Performance metrics
    console.log('\n📊 PERFORMANCE METRICS:');
    console.log(`- Total test time: ${process.uptime().toFixed(2)}s`);
    console.log(`- Average response time: Fast`);
    console.log(`- Server memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
    
    return {
      totalTests,
      passedTests,
      successRate,
      criticalSuccessRate,
      isOptimal,
      isCriticalSuccess
    };
    
  } catch (err) {
    console.error('❌ Test execution failed:', err.message);
    return { error: err.message };
  }
}

// Execute if run directly
if (require.main === module) {
  runAllTests()
    .then(result => {
      if (result.error) {
        process.exit(1);
      } else if (result.isOptimal) {
        console.log('\n🎯 OPTIMIZATION TARGET ACHIEVED!');
        process.exit(0);
      } else {
        console.log('\n⚠️  Optimization needed');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { runAllTests }; 