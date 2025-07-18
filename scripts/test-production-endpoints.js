const https = require('https');

// Production URL from Vercel deployment
const PRODUCTION_URL = 'https://lumo-4ai2921t5-alesierraaltas-projects.vercel.app';

function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js Test Script'
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testEndpoint(endpoint, expectedStatus = null) {
  try {
    console.log(`\n🔍 Testing: ${endpoint}`);
    const response = await makeRequest(`${PRODUCTION_URL}${endpoint}`);
    
    let status = '✅ SUCCESS';
    if (response.statusCode === 404) {
      status = '❌ NOT FOUND (404)';
    } else if (response.statusCode === 401) {
      status = '🔒 AUTH REQUIRED (401)';
    } else if (response.statusCode >= 500) {
      status = '💥 SERVER ERROR';
    }
    
    console.log(`   Status: ${response.statusCode} - ${status}`);
    
    // Try to parse JSON response
    try {
      const jsonBody = JSON.parse(response.body);
      if (jsonBody.error) {
        console.log(`   Error: ${jsonBody.error}`);
      }
      if (jsonBody.message) {
        console.log(`   Message: ${jsonBody.message}`);
      }
    } catch (e) {
      // Not JSON, show first 100 chars
      if (response.body.length > 0) {
        console.log(`   Body preview: ${response.body.substring(0, 100)}...`);
      }
    }
    
    return response;
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return null;
  }
}

async function runProductionTests() {
  console.log('🚀 Testing Production Endpoints');
  console.log(`📍 Production URL: ${PRODUCTION_URL}`);
  console.log('=' .repeat(60));

  // Test the endpoints that were previously returning 404
  const endpointsToTest = [
    '/api/products',
    '/api/products/1',
    '/inventory/movements',
    '/api/inventory',
    '/api/auth/login',
    '/api/health'
  ];

  const results = {};
  
  for (const endpoint of endpointsToTest) {
    const result = await testEndpoint(endpoint);
    results[endpoint] = result;
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '=' .repeat(60));
  console.log('📊 SUMMARY');
  console.log('=' .repeat(60));

  let fixedEndpoints = 0;
  let totalEndpoints = 0;

  for (const [endpoint, result] of Object.entries(results)) {
    totalEndpoints++;
    if (result && result.statusCode !== 404) {
      fixedEndpoints++;
      console.log(`✅ ${endpoint} - Fixed (Status: ${result.statusCode})`);
    } else {
      console.log(`❌ ${endpoint} - Still returning 404`);
    }
  }

  console.log(`\n🎯 Results: ${fixedEndpoints}/${totalEndpoints} endpoints fixed`);
  
  if (fixedEndpoints === totalEndpoints) {
    console.log('🎉 ALL ENDPOINTS FIXED! Runtime errors should be resolved.');
  } else {
    console.log('⚠️  Some endpoints still need attention.');
  }

  return results;
}

// Run the tests
runProductionTests().catch(console.error);