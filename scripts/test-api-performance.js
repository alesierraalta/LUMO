const https = require('http');

async function testAPIPerformance() {
  console.log('🚀 Testing API Performance with Authentication Cache...\n');
  
  const testEndpoints = [
    'http://localhost:3000/api/inventory',
    'http://localhost:3000/api/categories',
    'http://localhost:3000/api/cache-stats'
  ];
  
  for (const endpoint of testEndpoints) {
    console.log(`📡 Testing: ${endpoint}`);
    
    // Test first call (cache miss)
    const start1 = Date.now();
    try {
      const response1 = await fetch(endpoint);
      const end1 = Date.now();
      const time1 = end1 - start1;
      console.log(`   First call (cache miss): ${time1}ms - Status: ${response1.status}`);
    } catch (error) {
      console.log(`   First call failed: ${error.message}`);
    }
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Test second call (should be cache hit)
    const start2 = Date.now();
    try {
      const response2 = await fetch(endpoint);
      const end2 = Date.now();
      const time2 = end2 - start2;
      console.log(`   Second call (cache hit): ${time2}ms - Status: ${response2.status}`);
    } catch (error) {
      console.log(`   Second call failed: ${error.message}`);
    }
    
    console.log(''); // Empty line
  }
  
  // Get cache statistics
  try {
    const cacheResponse = await fetch('http://localhost:3000/api/cache-stats');
    if (cacheResponse.ok) {
      const cacheStats = await cacheResponse.json();
      console.log('📊 Cache Statistics:');
      console.log(`   Hits: ${cacheStats.data.cache.hits}`);
      console.log(`   Misses: ${cacheStats.data.cache.misses}`);
      console.log(`   Hit Rate: ${cacheStats.data.cache.hitRate}%`);
      console.log(`   Cache Size: ${cacheStats.data.cache.size} entries`);
    }
  } catch (error) {
    console.log(`Cache stats error: ${error.message}`);
  }
}

// Run the test
testAPIPerformance().catch(console.error);