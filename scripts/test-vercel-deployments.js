const fetch = require('node-fetch');

// Deployment URLs
const DEPLOYMENTS = [
  'https://lumo-woad.vercel.app',
  'https://lumo-git-main-alesierraaltas-projects.vercel.app',
  'https://lumo-f40cvfaj6-alesierraaltas-projects.vercel.app'
];

// Test data
const TEST_USER_CREDENTIALS = {
  email: 'alesierraalta@gmail.com',
  password: 'admin123'
};

// Helper function to test endpoint
async function testEndpoint(url, method = 'GET', headers = {}, body = null) {
  const startTime = Date.now();
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 30000
    };
    
    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const responseTime = Date.now() - startTime;
    
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (e) {
        data = { error: 'Failed to parse JSON', raw: await response.text() };
      }
    } else {
      data = await response.text();
    }
    
    return {
      success: response.ok,
      status: response.status,
      responseTime,
      data,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return {
      success: false,
      responseTime: Date.now() - startTime,
      error: error.message,
      type: error.constructor.name,
      code: error.code
    };
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting API Tests Across Vercel Deployments\n');
  console.log('Testing deployments:');
  DEPLOYMENTS.forEach(d => console.log(`  - ${d}`));
  console.log('\n' + '='.repeat(80) + '\n');
  
  const allResults = {};
  
  for (const deployment of DEPLOYMENTS) {
    console.log(`\n📍 Testing: ${deployment}`);
    console.log('-'.repeat(60));
    
    const results = {
      deployment,
      timestamp: new Date().toISOString(),
      endpoints: {}
    };
    
    // 1. Health Check
    console.log('\n🏥 Health Check');
    const healthResult = await testEndpoint(`${deployment}/api/health`);
    results.endpoints.health = healthResult;
    if (healthResult.success) {
      console.log(`  ✓ Status: ${healthResult.status} (${healthResult.responseTime}ms)`);
      console.log(`  ✓ Response:`, JSON.stringify(healthResult.data, null, 2));
    } else {
      console.log(`  ✗ Failed: ${healthResult.error || healthResult.status}`);
      if (healthResult.data) {
        console.log(`  ✗ Details:`, JSON.stringify(healthResult.data, null, 2));
      }
    }
    
    // 2. Create Temporary User
    console.log('\n👤 Create Temporary User');
    const createUserResult = await testEndpoint(
      `${deployment}/api/users/create-temp`,
      'POST'
    );
    results.endpoints.createTempUser = createUserResult;
    if (createUserResult.success) {
      console.log(`  ✓ Status: ${createUserResult.status} (${createUserResult.responseTime}ms)`);
      console.log(`  ✓ User created:`, JSON.stringify(createUserResult.data, null, 2));
    } else {
      console.log(`  ✗ Failed: Status ${createUserResult.status || 'N/A'}`);
      console.log(`  ✗ Error:`, createUserResult.error || createUserResult.data);
      
      // Check for specific errors
      if (createUserResult.data?.error?.includes('SUPABASE_SERVICE_ROLE_KEY')) {
        console.log(`  ⚠️  Missing SUPABASE_SERVICE_ROLE_KEY in environment`);
      }
      if (createUserResult.data?.error?.includes('already exists')) {
        console.log(`  ℹ️  User already exists - proceeding with login test`);
      }
    }
    
    // 3. Login
    console.log('\n🔐 Login Test');
    const loginResult = await testEndpoint(
      `${deployment}/api/auth/login`,
      'POST',
      {},
      TEST_USER_CREDENTIALS
    );
    results.endpoints.login = loginResult;
    
    let authToken = null;
    if (loginResult.success && loginResult.data?.token) {
      authToken = loginResult.data.token;
      console.log(`  ✓ Status: ${loginResult.status} (${loginResult.responseTime}ms)`);
      console.log(`  ✓ Login successful`);
      console.log(`  ✓ User:`, loginResult.data.user?.email);
      console.log(`  ✓ Role:`, loginResult.data.user?.role?.name || 'N/A');
    } else {
      console.log(`  ✗ Failed: Status ${loginResult.status || 'N/A'}`);
      console.log(`  ✗ Error:`, loginResult.error || loginResult.data);
    }
    
    // Test authenticated endpoints if we have a token
    if (authToken) {
      console.log('\n🔒 Testing Authenticated Endpoints\n');
      
      // 4. Auth Me
      console.log('📌 GET /api/auth/me');
      const meResult = await testEndpoint(
        `${deployment}/api/auth/me`,
        'GET',
        { 'Authorization': `Bearer ${authToken}` }
      );
      results.endpoints.authMe = meResult;
      console.log(`  ${meResult.success ? '✓' : '✗'} Status: ${meResult.status || 'N/A'} (${meResult.responseTime}ms)`);
      
      // 5. Users
      console.log('\n📌 GET /api/users');
      const usersResult = await testEndpoint(
        `${deployment}/api/users`,
        'GET',
        { 'Authorization': `Bearer ${authToken}` }
      );
      results.endpoints.users = usersResult;
      console.log(`  ${usersResult.success ? '✓' : '✗'} Status: ${usersResult.status || 'N/A'} (${usersResult.responseTime}ms)`);
      if (usersResult.success && usersResult.data?.total !== undefined) {
        console.log(`  ℹ️  Total users: ${usersResult.data.total}`);
      }
      
      // 6. Roles
      console.log('\n📌 GET /api/roles');
      const rolesResult = await testEndpoint(
        `${deployment}/api/roles`,
        'GET',
        { 'Authorization': `Bearer ${authToken}` }
      );
      results.endpoints.roles = rolesResult;
      console.log(`  ${rolesResult.success ? '✓' : '✗'} Status: ${rolesResult.status || 'N/A'} (${rolesResult.responseTime}ms)`);
      
      // 7. Categories
      console.log('\n📌 GET /api/categories');
      const categoriesResult = await testEndpoint(
        `${deployment}/api/categories`,
        'GET',
        { 'Authorization': `Bearer ${authToken}` }
      );
      results.endpoints.categories = categoriesResult;
      console.log(`  ${categoriesResult.success ? '✓' : '✗'} Status: ${categoriesResult.status || 'N/A'} (${categoriesResult.responseTime}ms)`);
      
      // 8. Inventory
      console.log('\n📌 GET /api/inventory');
      const inventoryResult = await testEndpoint(
        `${deployment}/api/inventory`,
        'GET',
        { 'Authorization': `Bearer ${authToken}` }
      );
      results.endpoints.inventory = inventoryResult;
      console.log(`  ${inventoryResult.success ? '✓' : '✗'} Status: ${inventoryResult.status || 'N/A'} (${inventoryResult.responseTime}ms)`);
      
      // 9. Locations
      console.log('\n📌 GET /api/locations');
      const locationsResult = await testEndpoint(
        `${deployment}/api/locations`,
        'GET',
        { 'Authorization': `Bearer ${authToken}` }
      );
      results.endpoints.locations = locationsResult;
      console.log(`  ${locationsResult.success ? '✓' : '✗'} Status: ${locationsResult.status || 'N/A'} (${locationsResult.responseTime}ms)`);
    } else {
      console.log('\n⚠️  Skipping authenticated endpoints - no auth token available');
    }
    
    // 10. Debug Roles (no auth required)
    console.log('\n📌 GET /api/debug-roles');
    const debugRolesResult = await testEndpoint(`${deployment}/api/debug-roles`);
    results.endpoints.debugRoles = debugRolesResult;
    console.log(`  ${debugRolesResult.success ? '✓' : '✗'} Status: ${debugRolesResult.status || 'N/A'} (${debugRolesResult.responseTime}ms)`);
    
    // Store results
    allResults[deployment] = results;
  }
  
  // Summary Report
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 SUMMARY REPORT');
  console.log('='.repeat(80) + '\n');
  
  for (const deployment of DEPLOYMENTS) {
    const results = allResults[deployment];
    const endpoints = Object.values(results.endpoints);
    const successful = endpoints.filter(e => e.success).length;
    const failed = endpoints.filter(e => !e.success).length;
    const successRate = ((successful / endpoints.length) * 100).toFixed(1);
    
    console.log(`\n${deployment}`);
    console.log('-'.repeat(deployment.length));
    console.log(`Total Endpoints: ${endpoints.length}`);
    console.log(`✓ Successful: ${successful}`);
    console.log(`✗ Failed: ${failed}`);
    console.log(`Success Rate: ${successRate}%`);
    
    // Performance stats
    const responseTimes = endpoints.map(e => e.responseTime).filter(Boolean);
    if (responseTimes.length > 0) {
      const avg = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
      const max = Math.max(...responseTimes);
      const min = Math.min(...responseTimes);
      console.log(`\nPerformance:`);
      console.log(`  Avg Response: ${avg}ms`);
      console.log(`  Min Response: ${min}ms`);
      console.log(`  Max Response: ${max}ms`);
    }
    
    // Failed endpoints details
    if (failed > 0) {
      console.log(`\nFailed Endpoints:`);
      Object.entries(results.endpoints).forEach(([name, result]) => {
        if (!result.success) {
          console.log(`  - ${name}: ${result.status || result.error || 'Unknown error'}`);
        }
      });
    }
  }
  
  // Common Issues
  console.log('\n\n' + '='.repeat(80));
  console.log('⚠️  DIAGNOSTICS & RECOMMENDATIONS');
  console.log('='.repeat(80) + '\n');
  
  const issues = new Set();
  
  for (const deployment of DEPLOYMENTS) {
    const results = allResults[deployment];
    
    // Check for CORS issues
    const hasNoCors = Object.values(results.endpoints).some(e => 
      e.headers && !e.headers['access-control-allow-origin']
    );
    if (hasNoCors) {
      issues.add('CORS headers missing - check API middleware configuration');
    }
    
    // Check for auth issues
    if (!results.endpoints.login?.success) {
      issues.add('Authentication failed - verify user credentials and auth system');
    }
    
    // Check for service key
    if (results.endpoints.createTempUser?.data?.error?.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      issues.add('SUPABASE_SERVICE_ROLE_KEY not configured in Vercel environment');
    }
    
    // Check for database connection
    if (!results.endpoints.health?.success) {
      issues.add('Health check failed - possible database connection issues');
    }
  }
  
  if (issues.size > 0) {
    console.log('Common Issues Detected:');
    issues.forEach(issue => console.log(`  • ${issue}`));
  }
  
  // Save report
  const fs = require('fs');
  const reportName = `api-test-report-${new Date().toISOString().replace(/:/g, '-')}.json`;
  fs.writeFileSync(reportName, JSON.stringify(allResults, null, 2));
  console.log(`\n\n📄 Detailed report saved: ${reportName}`);
  console.log('\n✅ Testing complete!\n');
}

// Run tests
console.log('Starting Vercel API endpoint testing...\n');
runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});