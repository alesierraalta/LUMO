const fetch = require('node-fetch');

// Deployment URLs
const DEPLOYMENTS = [
  'https://lumo-woad.vercel.app',
  'https://lumo-git-main-alesierraaltas-projects.vercel.app',
  'https://lumo-f40cvfaj6-alesierraaltas-projects.vercel.app'
];

// Test different user credentials
const TEST_USERS = [
  {
    email: 'pradasamuel1@gmail.com',
    password: '$OswaldoLumo2025$',
    name: 'Production User'
  },
  {
    email: 'admin@test.com',
    password: 'admin123',
    name: 'Test Admin'
  },
  {
    email: 'test@example.com',
    password: 'test123',
    name: 'Test User'
  }
];

async function testEndpoint(url, options = {}) {
  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      timeout: 15000
    });

    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else if (contentType && contentType.includes('text/html')) {
      const html = await response.text();
      // Check if it's Vercel auth page
      if (html.includes('Vercel Authentication')) {
        data = { 
          error: 'Vercel Authentication Page', 
          protected: true,
          requiresVercelAuth: true 
        };
      } else {
        data = { html: html.substring(0, 200) + '...' };
      }
    } else {
      data = await response.text();
    }

    return {
      success: response.ok,
      status: response.status,
      data,
      headers: {
        'content-type': response.headers.get('content-type'),
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
        'access-control-allow-credentials': response.headers.get('access-control-allow-credentials'),
        'x-vercel-deployment-url': response.headers.get('x-vercel-deployment-url'),
        'x-vercel-id': response.headers.get('x-vercel-id')
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      type: error.constructor.name
    };
  }
}

async function diagnose() {
  console.log('🔍 VERCEL DEPLOYMENT DIAGNOSTICS\n');
  console.log('=' .repeat(80) + '\n');

  for (const deployment of DEPLOYMENTS) {
    console.log(`\n📍 DEPLOYMENT: ${deployment}`);
    console.log('-'.repeat(deployment.length + 14));
    
    // 1. Test base URL
    console.log('\n1️⃣ Testing Base URL');
    const baseResult = await testEndpoint(deployment);
    console.log(`   Status: ${baseResult.status || 'N/A'}`);
    if (baseResult.data?.requiresVercelAuth) {
      console.log('   ⚠️  VERCEL AUTHENTICATION REQUIRED');
      console.log('   This deployment is password-protected at Vercel level');
    }
    
    // 2. Test CORS preflight
    console.log('\n2️⃣ Testing CORS Preflight');
    const corsResult = await testEndpoint(`${deployment}/api/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization'
      }
    });
    console.log(`   Status: ${corsResult.status || 'N/A'}`);
    console.log(`   CORS Headers:`);
    console.log(`   - Allow-Origin: ${corsResult.headers['access-control-allow-origin'] || 'NOT SET'}`);
    console.log(`   - Allow-Credentials: ${corsResult.headers['access-control-allow-credentials'] || 'NOT SET'}`);
    
    // 3. Test environment variables endpoint
    console.log('\n3️⃣ Testing Debug Endpoint');
    const debugResult = await testEndpoint(`${deployment}/api/debug-roles`);
    console.log(`   Status: ${debugResult.status || 'N/A'}`);
    if (debugResult.success && debugResult.data) {
      console.log('   Environment Info:');
      if (debugResult.data.environment) {
        console.log(`   - NODE_ENV: ${debugResult.data.environment.NODE_ENV || 'NOT SET'}`);
        console.log(`   - VERCEL: ${debugResult.data.environment.VERCEL || 'NOT SET'}`);
      }
      if (debugResult.data.roles) {
        console.log(`   - Roles Found: ${debugResult.data.roles.length || 0}`);
      }
    }
    
    // 4. Test create user with detailed error capture
    console.log('\n4️⃣ Testing User Creation (Detailed)');
    const createResult = await testEndpoint(`${deployment}/api/users/create-temp`, {
      method: 'POST'
    });
    console.log(`   Status: ${createResult.status || 'N/A'}`);
    if (!createResult.success) {
      console.log('   Error Details:');
      if (createResult.data?.error) {
        console.log(`   - Error: ${createResult.data.error}`);
      }
      if (createResult.data?.details) {
        console.log(`   - Details: ${JSON.stringify(createResult.data.details)}`);
      }
      if (createResult.data?.message) {
        console.log(`   - Message: ${createResult.data.message}`);
      }
    }
    
    // 5. Test login with multiple users
    console.log('\n5️⃣ Testing Login Endpoints');
    for (const user of TEST_USERS) {
      const loginResult = await testEndpoint(`${deployment}/api/auth/login`, {
        method: 'POST',
        body: { email: user.email, password: user.password }
      });
      console.log(`   ${user.name} (${user.email}):`);
      console.log(`   - Status: ${loginResult.status || 'N/A'}`);
      if (!loginResult.success && loginResult.data) {
        console.log(`   - Error: ${loginResult.data.error || JSON.stringify(loginResult.data)}`);
      }
      if (loginResult.success) {
        console.log(`   - ✓ Login successful`);
      }
    }
    
    // 6. Test database connection
    console.log('\n6️⃣ Testing Database Connection');
    const healthResult = await testEndpoint(`${deployment}/api/health`);
    console.log(`   Status: ${healthResult.status || 'N/A'}`);
    if (healthResult.success && healthResult.data) {
      console.log(`   Database Status: ${healthResult.data.database?.connected ? '✓ Connected' : '✗ Disconnected'}`);
      if (healthResult.data.database?.error) {
        console.log(`   Database Error: ${healthResult.data.database.error}`);
      }
    }
    
    // 7. Check for authentication methods
    console.log('\n7️⃣ Checking Authentication Methods');
    const authMethods = [];
    
    // Check for JWT in login
    const jwtTest = await testEndpoint(`${deployment}/api/auth/login`, {
      method: 'POST',
      body: { email: 'test@test.com', password: 'test' }
    });
    if (jwtTest.data && (jwtTest.data.token || jwtTest.data.error?.includes('credentials'))) {
      authMethods.push('JWT');
    }
    
    // Check for session-based auth
    const sessionTest = await testEndpoint(`${deployment}/api/auth/me`);
    if (sessionTest.status === 401 || sessionTest.status === 403) {
      authMethods.push('Session/Cookie');
    }
    
    console.log(`   Detected Methods: ${authMethods.join(', ') || 'Unknown'}`);
  }
  
  // Summary and Recommendations
  console.log('\n\n' + '='.repeat(80));
  console.log('📋 SUMMARY & RECOMMENDATIONS');
  console.log('='.repeat(80) + '\n');
  
  console.log('🔧 IMMEDIATE ACTIONS REQUIRED:\n');
  
  console.log('1. For lumo-f40cvfaj6-alesierraaltas-projects.vercel.app:');
  console.log('   • Disable Vercel authentication protection');
  console.log('   • Go to Vercel Dashboard > Project Settings > General');
