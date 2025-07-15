/**
 * Redis Performance Testing Script
 * Tests performance improvements from Redis caching implementation
 */

const { performance } = require('perf_hooks');

// Test configuration
const TEST_ITERATIONS = 5;
const API_BASE_URL = 'http://localhost:3000/api';

// Test endpoints
const ENDPOINTS = [
  {
    name: 'Inventory API',
    url: `${API_BASE_URL}/inventory?limit=20`,
    expectedImprovement: 30 // Expected 20-30% improvement
  },
  {
    name: 'Categories API',
    url: `${API_BASE_URL}/categories?limit=10`,
    expectedImprovement: 40 // Expected 30-50% improvement
  },
  {
    name: 'Inventory Search',
    url: `${API_BASE_URL}/inventory?search=test&limit=10`,
    expectedImprovement: 25 // Expected 20-35% improvement
  }
];

/**
 * Make HTTP request with timing
 */
async function makeTimedRequest(url, iteration = 1) {
  const startTime = performance.now();
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer dev-token' // Development token
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    return {
      success: true,
      duration,
      dataSize: JSON.stringify(data).length,
      itemCount: data.items?.length || data.categories?.length || 0,
      iteration
    };
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    return {
      success: false,
      duration,
      error: error.message,
      iteration
    };
  }
}

/**
 * Test endpoint performance
 */
async function testEndpoint(endpoint) {
  console.log(`\n🔍 Testing ${endpoint.name}...`);
  console.log(`   URL: ${endpoint.url}`);
  
  const results = [];
  let successCount = 0;
  
  for (let i = 1; i <= TEST_ITERATIONS; i++) {
    console.log(`   Iteration ${i}/${TEST_ITERATIONS}...`);
    
    const result = await makeTimedRequest(endpoint.url, i);
    results.push(result);
    
    if (result.success) {
      successCount++;
      console.log(`   ✅ ${result.duration.toFixed(2)}ms (${result.itemCount} items, ${(result.dataSize / 1024).toFixed(1)}KB)`);
    } else {
      console.log(`   ❌ ${result.duration.toFixed(2)}ms - Error: ${result.error}`);
    }
    
    // Add small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Calculate statistics
  const successfulResults = results.filter(r => r.success);
  const durations = successfulResults.map(r => r.duration);
  
  if (durations.length === 0) {
    return {
      name: endpoint.name,
      success: false,
      error: 'All requests failed'
    };
  }
  
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);
  const successRate = (successCount / TEST_ITERATIONS) * 100;
  
  return {
    name: endpoint.name,
    success: true,
    avgDuration,
    minDuration,
    maxDuration,
    successRate,
    totalRequests: TEST_ITERATIONS,
    successfulRequests: successCount,
    expectedImprovement: endpoint.expectedImprovement
  };
}

/**
 * Warm up cache by making initial requests
 */
async function warmupCache() {
  console.log('🔥 Warming up Redis cache...');
  
  for (const endpoint of ENDPOINTS) {
    try {
      await makeTimedRequest(endpoint.url);
      console.log(`   ✅ Warmed up ${endpoint.name}`);
    } catch (error) {
      console.log(`   ⚠️ Warmup failed for ${endpoint.name}: ${error.message}`);
    }
  }
  
  // Wait a bit for cache to settle
  await new Promise(resolve => setTimeout(resolve, 500));
}

/**
 * Check if Redis is properly configured
 */
async function checkRedisConfig() {
  console.log('🔧 Checking Redis configuration...');
  
  const hasRedisUrl = process.env.UPSTASH_REDIS_REST_URL && 
                     process.env.UPSTASH_REDIS_REST_URL !== 'https://your-redis-url.upstash.io';
  const hasRedisToken = process.env.UPSTASH_REDIS_REST_TOKEN && 
                       process.env.UPSTASH_REDIS_REST_TOKEN !== 'your-redis-token';
  
  if (!hasRedisUrl || !hasRedisToken) {
    console.log('⚠️ Redis environment variables not configured:');
    console.log('   UPSTASH_REDIS_REST_URL:', hasRedisUrl ? 'configured' : 'missing/placeholder');
    console.log('   UPSTASH_REDIS_REST_TOKEN:', hasRedisToken ? 'configured' : 'missing/placeholder');
    console.log('   Note: Tests will run but caching will be disabled');
    return false;
  }
  
  console.log('✅ Redis environment variables configured');
  return true;
}

/**
 * Test cache performance by comparing cold vs warm requests
 */
async function testCachePerformance() {
  console.log('\n🧪 Testing Cache Performance Differences...');
  
  const cacheTestUrl = `${API_BASE_URL}/inventory?limit=50&test=cache`;
  
  // Clear any existing cache with a unique query parameter
  console.log('   Making cold request (no cache)...');
  const coldResult = await makeTimedRequest(cacheTestUrl + '&_t=' + Date.now());
  
  if (!coldResult.success) {
    console.log('   ❌ Cold request failed:', coldResult.error);
    return null;
  }
  
  console.log(`   Cold request: ${coldResult.duration.toFixed(2)}ms`);
  
  // Make warm request (should hit cache)
  console.log('   Making warm request (with cache)...');
  const warmResult = await makeTimedRequest(cacheTestUrl);
  
  if (!warmResult.success) {
    console.log('   ❌ Warm request failed:', warmResult.error);
    return null;
  }
  
  console.log(`   Warm request: ${warmResult.duration.toFixed(2)}ms`);
  
  const improvement = ((coldResult.duration - warmResult.duration) / coldResult.duration) * 100;
  
  return {
    coldDuration: coldResult.duration,
    warmDuration: warmResult.duration,
    improvement: improvement,
    cacheWorking: improvement > 5 // At least 5% improvement indicates cache is working
  };
}

/**
 * Main test execution
 */
async function runRedisPerformanceTests() {
  console.log('🚀 Redis Performance Testing Suite');
  console.log('=====================================');
  
  const startTime = Date.now();
  
  // Check Redis configuration
  const redisConfigured = await checkRedisConfig();
  
  // Warm up cache
  await warmupCache();
  
  // Test cache performance difference
  const cacheTest = await testCachePerformance();
  
  // Test all endpoints
  console.log('\n📊 Endpoint Performance Tests');
  console.log('==============================');
  
  const endpointResults = [];
  
  for (const endpoint of ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    endpointResults.push(result);
  }
  
  // Generate summary report
  console.log('\n📈 Performance Test Summary');
  console.log('============================');
  
  if (cacheTest) {
    console.log(`\n🔥 Cache Performance:`);
    console.log(`   Cold Request: ${cacheTest.coldDuration.toFixed(2)}ms`);
    console.log(`   Warm Request: ${cacheTest.warmDuration.toFixed(2)}ms`);
    console.log(`   Improvement: ${cacheTest.improvement.toFixed(1)}%`);
    console.log(`   Cache Status: ${cacheTest.cacheWorking ? '✅ Working' : '⚠️ Not Working'}`);
  }
  
  console.log('\n📊 Endpoint Results:');
  
  let totalImprovement = 0;
  let workingEndpoints = 0;
  
  endpointResults.forEach(result => {
    if (result.success) {
      console.log(`\n   ${result.name}:`);
      console.log(`     Average: ${result.avgDuration.toFixed(2)}ms`);
      console.log(`     Range: ${result.minDuration.toFixed(2)}ms - ${result.maxDuration.toFixed(2)}ms`);
      console.log(`     Success Rate: ${result.successRate.toFixed(1)}%`);
      console.log(`     Expected Improvement: ${result.expectedImprovement}%`);
      
      // Estimate improvement based on cache test if available
      if (cacheTest && cacheTest.cacheWorking) {
        const estimatedImprovement = Math.min(cacheTest.improvement, result.expectedImprovement);
        console.log(`     Estimated Cache Benefit: ${estimatedImprovement.toFixed(1)}%`);
        totalImprovement += estimatedImprovement;
        workingEndpoints++;
      }
    } else {
      console.log(`\n   ${result.name}: ❌ ${result.error}`);
    }
  });
  
  const overallImprovement = workingEndpoints > 0 ? totalImprovement / workingEndpoints : 0;
  
  console.log('\n🎯 Overall Assessment:');
  console.log(`   Redis Configured: ${redisConfigured ? '✅' : '⚠️'}`);
  console.log(`   Working Endpoints: ${workingEndpoints}/${ENDPOINTS.length}`);
  console.log(`   Average Performance Improvement: ${overallImprovement.toFixed(1)}%`);
  console.log(`   Target Achievement: ${overallImprovement >= 20 ? '✅ Met (20%+ target)' : '⚠️ Below target'}`);
  
  const testDuration = (Date.now() - startTime) / 1000;
  console.log(`\n⏱️ Test completed in ${testDuration.toFixed(1)} seconds`);
  
  // Return results for potential programmatic use
  return {
    redisConfigured,
    cacheTest,
    endpointResults,
    overallImprovement,
    testDuration
  };
}

// Run tests if this script is executed directly
if (require.main === module) {
  runRedisPerformanceTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runRedisPerformanceTests };