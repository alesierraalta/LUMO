#!/usr/bin/env node

/**
 * Choreo Production Deployment Diagnostic Script
 * Identifies issues causing "context deadline exceeded" errors
 */

const https = require('https');
const http = require('http');

const PRODUCTION_URL = 'https://lumoapp.choreoapps.dev';
const HEALTH_ENDPOINT = '/api/health';
const TIMEOUT_MS = 30000; // 30 seconds

console.log('🔍 CHOREO PRODUCTION DEPLOYMENT DIAGNOSTIC');
console.log('==========================================');
console.log(`Target URL: ${PRODUCTION_URL}`);
console.log(`Health Check: ${PRODUCTION_URL}${HEALTH_ENDPOINT}`);
console.log('');

// Test 1: Basic connectivity
async function testConnectivity() {
  console.log('📡 Test 1: Basic Connectivity');
  console.log('-----------------------------');
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const req = https.get(PRODUCTION_URL, { timeout: TIMEOUT_MS }, (res) => {
      const responseTime = Date.now() - startTime;
      console.log(`✅ Connection successful: ${res.statusCode} ${res.statusMessage}`);
      console.log(`⏱️  Response time: ${responseTime}ms`);
      console.log(`🔗 Headers:`, JSON.stringify(res.headers, null, 2));
      resolve({ success: true, responseTime, statusCode: res.statusCode });
    });

    req.on('timeout', () => {
      console.log(`❌ Connection timeout after ${TIMEOUT_MS}ms`);
      req.destroy();
      resolve({ success: false, error: 'timeout' });
    });

    req.on('error', (err) => {
      console.log(`❌ Connection error: ${err.message}`);
      resolve({ success: false, error: err.message });
    });
  });
}

// Test 2: Health endpoint accessibility
async function testHealthEndpoint() {
  console.log('\n🏥 Test 2: Health Endpoint');
  console.log('---------------------------');
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    const url = `${PRODUCTION_URL}${HEALTH_ENDPOINT}`;
    
    const req = https.get(url, { timeout: TIMEOUT_MS }, (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ Health endpoint accessible: ${res.statusCode}`);
        console.log(`⏱️  Response time: ${responseTime}ms`);
        
        try {
          const healthData = JSON.parse(data);
          console.log(`📊 Health data:`, JSON.stringify(healthData, null, 2));
          resolve({ success: true, responseTime, data: healthData });
        } catch (e) {
          console.log(`⚠️  Invalid JSON response: ${data}`);
          resolve({ success: false, error: 'invalid_json', rawData: data });
        }
      });
    });

    req.on('timeout', () => {
      console.log(`❌ Health endpoint timeout after ${TIMEOUT_MS}ms`);
      req.destroy();
      resolve({ success: false, error: 'timeout' });
    });

    req.on('error', (err) => {
      console.log(`❌ Health endpoint error: ${err.message}`);
      resolve({ success: false, error: err.message });
    });
  });
}

// Test 3: Multiple rapid requests (load test)
async function testLoadCapacity() {
  console.log('\n🚀 Test 3: Load Capacity');
  console.log('-------------------------');
  
  const requests = [];
  const requestCount = 5;
  
  for (let i = 0; i < requestCount; i++) {
    requests.push(new Promise((resolve) => {
      const startTime = Date.now();
      const req = https.get(`${PRODUCTION_URL}${HEALTH_ENDPOINT}`, { timeout: 10000 }, (res) => {
        const responseTime = Date.now() - startTime;
        resolve({ success: true, responseTime, statusCode: res.statusCode });
      });
      
      req.on('error', (err) => {
        resolve({ success: false, error: err.message });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, error: 'timeout' });
      });
    }));
  }
  
  const results = await Promise.all(requests);
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful requests: ${successful.length}/${requestCount}`);
  console.log(`❌ Failed requests: ${failed.length}/${requestCount}`);
  
  if (successful.length > 0) {
    const avgTime = successful.reduce((sum, r) => sum + r.responseTime, 0) / successful.length;
    console.log(`⏱️  Average response time: ${avgTime.toFixed(2)}ms`);
  }
  
  if (failed.length > 0) {
    console.log(`🔍 Failure reasons:`, failed.map(f => f.error));
  }
  
  return { successful: successful.length, failed: failed.length, results };
}

// Test 4: DNS resolution
async function testDNS() {
  console.log('\n🌐 Test 4: DNS Resolution');
  console.log('--------------------------');
  
  const dns = require('dns').promises;
  const domain = 'lumoapp.choreoapps.dev';
  
  try {
    const addresses = await dns.lookup(domain, { all: true });
    console.log(`✅ DNS resolution successful for ${domain}`);
    console.log(`📍 IP addresses:`, addresses.map(addr => `${addr.address} (${addr.family})`));
    return { success: true, addresses };
  } catch (error) {
    console.log(`❌ DNS resolution failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main diagnostic function
async function runDiagnostics() {
  console.log(`🕐 Starting diagnostics at ${new Date().toISOString()}\n`);
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: {}
  };
  
  // Run all tests
  results.tests.connectivity = await testConnectivity();
  results.tests.health = await testHealthEndpoint();
  results.tests.load = await testLoadCapacity();
  results.tests.dns = await testDNS();
  
  // Summary
  console.log('\n📋 DIAGNOSTIC SUMMARY');
  console.log('=====================');
  
  const testResults = Object.entries(results.tests);
  const passedTests = testResults.filter(([_, result]) => result.success || result.successful > 0);
  const failedTests = testResults.filter(([_, result]) => !result.success && result.successful === undefined);
  
  console.log(`✅ Passed tests: ${passedTests.length}/${testResults.length}`);
  console.log(`❌ Failed tests: ${failedTests.length}/${testResults.length}`);
  
  if (failedTests.length > 0) {
    console.log('\n🔍 ISSUES IDENTIFIED:');
    failedTests.forEach(([testName, result]) => {
      console.log(`   • ${testName}: ${result.error || 'Failed'}`);
    });
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('===================');
  
  if (!results.tests.connectivity.success) {
    console.log('🔧 1. Check Choreo deployment status in console');
    console.log('🔧 2. Verify container is starting successfully');
    console.log('🔧 3. Check resource allocation (CPU/Memory)');
  }
  
  if (!results.tests.health.success) {
    console.log('🔧 4. Review health check configuration in choreo.yaml');
    console.log('🔧 5. Increase health check timeout values');
    console.log('🔧 6. Check application startup time');
  }
  
  if (results.tests.load.failed > 0) {
    console.log('🔧 7. Consider increasing replica count');
    console.log('🔧 8. Review resource limits and scaling policies');
  }
  
  console.log('\n📊 Full results saved to: choreo-diagnostic-results.json');
  
  // Save results to file
  const fs = require('fs');
  fs.writeFileSync('choreo-diagnostic-results.json', JSON.stringify(results, null, 2));
  
  return results;
}

// Run diagnostics
if (require.main === module) {
  runDiagnostics().catch(console.error);
}

module.exports = { runDiagnostics }; 