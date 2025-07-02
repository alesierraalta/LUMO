#!/usr/bin/env node

/**
 * Monitor Deployment Status
 * Check when the new login-simple endpoint is available
 */

const DEV_URL = 'https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev';

async function checkEndpointAvailable() {
  try {
    console.log('🔍 Checking if login-simple endpoint is available...');
    
    const response = await fetch(`${DEV_URL}/api/auth/login-simple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'test'
      })
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.status === 404) {
      return { available: false, reason: 'Endpoint not found (404)' };
    }
    
    if (response.headers.get('content-type')?.includes('text/html')) {
      return { available: false, reason: 'Still returning HTML (not deployed)' };
    }
    
    if (response.headers.get('content-type')?.includes('application/json')) {
      return { available: true, reason: 'Endpoint returning JSON (deployed!)' };
    }
    
    return { available: false, reason: `Unexpected response: ${response.status}` };
    
  } catch (error) {
    return { available: false, reason: `Network error: ${error.message}` };
  }
}

async function checkHealthEndpoint() {
  try {
    console.log('💓 Checking health endpoint...');
    
    const response = await fetch(`${DEV_URL}/api/health`, {
      method: 'GET'
    });
    
    if (response.ok) {
      const data = await response.json();
      return { 
        healthy: true, 
        service: data.service,
        timestamp: data.timestamp 
      };
    }
    
    return { healthy: false, status: response.status };
    
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}

async function monitorDeployment() {
  console.log('🚀 MONITORING CHOREO DEPLOYMENT');
  console.log('================================');
  console.log(`Target URL: ${DEV_URL}`);
  console.log('Waiting for new deployment to be ready...\n');
  
  let attempt = 1;
  const maxAttempts = 20; // 10 minutes max
  const intervalMs = 30000; // 30 seconds
  
  while (attempt <= maxAttempts) {
    console.log(`📊 Attempt ${attempt}/${maxAttempts} (${new Date().toLocaleTimeString()})`);
    console.log('=' .repeat(50));
    
    // Check health first
    const health = await checkHealthEndpoint();
    if (health.healthy) {
      console.log(`✅ Health: OK (${health.service})`);
    } else {
      console.log(`❌ Health: ${health.error || health.status}`);
    }
    
    // Check if new endpoint is available
    const endpoint = await checkEndpointAvailable();
    console.log(`📡 Endpoint: ${endpoint.reason}`);
    
    if (endpoint.available) {
      console.log('\n🎉 DEPLOYMENT READY!');
      console.log('====================');
      console.log('✅ New login-simple endpoint is available');
      console.log('✅ Ready to test authentication');
      console.log('\nYou can now run:');
      console.log('node scripts/test-simple-login.js');
      return true;
    }
    
    if (attempt < maxAttempts) {
      console.log(`\n⏳ Waiting ${intervalMs/1000} seconds for next check...\n`);
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    
    attempt++;
  }
  
  console.log('\n⚠️ DEPLOYMENT TIMEOUT');
  console.log('=====================');
  console.log('The deployment is taking longer than expected');
  console.log('You may need to check Choreo console manually');
  
  return false;
}

// Also provide a quick test function
async function quickTest() {
  console.log('\n🧪 QUICK TEST');
  console.log('=============');
  
  const health = await checkHealthEndpoint();
  const endpoint = await checkEndpointAvailable();
  
  console.log(`Health: ${health.healthy ? '✅' : '❌'} ${health.healthy ? health.service : health.error}`);
  console.log(`Endpoint: ${endpoint.available ? '✅' : '❌'} ${endpoint.reason}`);
  
  return endpoint.available;
}

// Command line usage
const command = process.argv[2];

if (command === 'quick') {
  quickTest().then(ready => {
    console.log(`\n🎯 Result: ${ready ? 'READY' : 'NOT READY'}`);
    process.exit(ready ? 0 : 1);
  });
} else {
  monitorDeployment().then(success => {
    process.exit(success ? 0 : 1);
  });
} 