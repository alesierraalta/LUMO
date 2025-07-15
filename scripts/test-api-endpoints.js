#!/usr/bin/env node

/**
 * API Endpoints Test Script
 * Tests basic API functionality after clearing Next.js cache
 * Verifies webpack bundling error is resolved
 */

const BASE_URL = 'http://localhost:3000';

const endpoints = [
  { path: '/api/inventory', method: 'GET', name: 'Inventory List' },
  { path: '/api/categories', method: 'GET', name: 'Categories List' },
  { path: '/api/debug-env', method: 'GET', name: 'Debug Environment' }
];

async function testEndpoint(endpoint) {
  try {
    console.log(`Testing ${endpoint.name} (${endpoint.method} ${endpoint.path})...`);
    
    const response = await fetch(`${BASE_URL}${endpoint.path}`, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const status = response.status;
    const isSuccess = status < 400;
    
    if (isSuccess) {
      console.log(`✓ ${endpoint.name}: HTTP ${status} - SUCCESS`);
      try {
        const data = await response.json();
        if (data && typeof data === 'object') {
          console.log(`  Response type: ${Array.isArray(data) ? 'Array' : 'Object'}`);
          if (Array.isArray(data)) {
            console.log(`  Items count: ${data.length}`);
          } else if (data.length !== undefined) {
            console.log(`  Items count: ${data.length}`);
          }
        }
      } catch (parseError) {
        console.log(`  Response: Non-JSON response`);
      }
    } else {
      console.log(`✗ ${endpoint.name}: HTTP ${status} - FAILED`);
      const errorText = await response.text();
      if (errorText.includes('Cannot find module') || errorText.includes('webpack')) {
        console.log(`  ERROR: Webpack bundling error detected`);
      }
      console.log(`  Error: ${errorText.substring(0, 200)}...`);
    }
    
    return { success: isSuccess, status, endpoint: endpoint.name };
  } catch (error) {
    console.log(`✗ ${endpoint.name}: NETWORK ERROR`);
    console.log(`  Error: ${error.message}`);
    return { success: false, status: 'ERROR', endpoint: endpoint.name, error: error.message };
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('API ENDPOINTS TEST - Webpack Bundling Verification');
  console.log('='.repeat(60));
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Total endpoints: ${endpoints.length}`);
  console.log('-'.repeat(60));

  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    console.log(''); // Add spacing
  }

  console.log('='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✓ Successful: ${successful.length}/${results.length}`);
  console.log(`✗ Failed: ${failed.length}/${results.length}`);
  
  if (failed.length > 0) {
    console.log('\nFailed endpoints:');
    failed.forEach(f => {
      console.log(`  - ${f.endpoint}: ${f.status}`);
    });
    
    const hasWebpackError = failed.some(f => f.error && (f.error.includes('webpack') || f.error.includes('Cannot find module')));
    if (hasWebpackError) {
      console.log('\n⚠️  WEBPACK BUNDLING ERROR DETECTED');
      console.log('Recommendation: Restart the development server');
    }
  }
  
  if (successful.length === results.length) {
    console.log('\n🎉 ALL ENDPOINTS WORKING - Ready for Redis performance testing!');
    return true;
  } else {
    console.log('\n❌ Some endpoints failed - Fix errors before proceeding');
    return false;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };