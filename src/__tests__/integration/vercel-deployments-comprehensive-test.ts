import fetch from 'node-fetch';

// Deployment URLs
const DEPLOYMENTS = [
  'https://lumo-woad.vercel.app',
  'https://lumo-git-main-alesierraaltas-projects.vercel.app',
  'https://lumo-f40cvfaj6-alesierraaltas-projects.vercel.app'
];

// Test data
const TEST_USER_CREDENTIALS = {
  email: 'pradasamuel1@gmail.com',
  password: '$OswaldoLumo2025$'
};

const TEST_ADMIN_CREDENTIALS = {
  email: 'admin@test.com',
  password: 'admin123'
};

// API Endpoints to test
const API_ENDPOINTS = {
  // Health check
  health: { method: 'GET', path: '/api/health', requiresAuth: false },
  
  // Auth endpoints
  authLogin: { method: 'POST', path: '/api/auth/login', requiresAuth: false },
  authMe: { method: 'GET', path: '/api/auth/me', requiresAuth: true },
  authRegister: { method: 'POST', path: '/api/auth/register', requiresAuth: false },
  
  // User endpoints
  usersGet: { method: 'GET', path: '/api/users', requiresAuth: true },
  usersPost: { method: 'POST', path: '/api/users', requiresAuth: true, requiresAdmin: true },
  usersGetById: { method: 'GET', path: '/api/users/{id}', requiresAuth: true },
  usersCreateTemp: { method: 'POST', path: '/api/users/create-temp', requiresAuth: false },
  
  // Role endpoints
  rolesGet: { method: 'GET', path: '/api/roles', requiresAuth: true },
  rolesPermissions: { method: 'GET', path: '/api/roles/{id}/permissions', requiresAuth: true },
  permissions: { method: 'GET', path: '/api/permissions', requiresAuth: true },
  debugRoles: { method: 'GET', path: '/api/debug-roles', requiresAuth: false },
  
  // Category endpoints
  categoriesGet: { method: 'GET', path: '/api/categories', requiresAuth: true },
  categoriesPost: { method: 'POST', path: '/api/categories', requiresAuth: true },
  categoriesGetById: { method: 'GET', path: '/api/categories/{id}', requiresAuth: true },
  categoriesPut: { method: 'PUT', path: '/api/categories/{id}', requiresAuth: true },
  categoriesDelete: { method: 'DELETE', path: '/api/categories/{id}', requiresAuth: true },
  
  // Inventory endpoints
  inventoryGet: { method: 'GET', path: '/api/inventory', requiresAuth: true },
  inventoryPost: { method: 'POST', path: '/api/inventory', requiresAuth: true },
  inventoryGetById: { method: 'GET', path: '/api/inventory/{id}', requiresAuth: true },
  inventoryPut: { method: 'PUT', path: '/api/inventory/{id}', requiresAuth: true },
  inventoryAddStock: { method: 'POST', path: '/api/inventory/{id}/add-stock', requiresAuth: true },
  
  // Location endpoints
  locationsGet: { method: 'GET', path: '/api/locations', requiresAuth: true },
  locationsPost: { method: 'POST', path: '/api/locations', requiresAuth: true },
  locationsGetById: { method: 'GET', path: '/api/locations/{id}', requiresAuth: true },
  locationsPut: { method: 'PUT', path: '/api/locations/{id}', requiresAuth: true },
  locationsDelete: { method: 'DELETE', path: '/api/locations/{id}', requiresAuth: true }
};

interface TestResult {
  success: boolean;
  statusCode?: number;
  responseTime: number;
  data?: any;
  error?: any;
  diagnostics?: {
    headers?: any;
    expectedAuth?: boolean;
    providedAuth?: boolean;
    corsHeaders?: any;
    url?: string;
    method?: string;
    authProvided?: boolean;
    errorType?: string;
    isNetworkError?: boolean;
  };
}

// Helper function to format error details
function formatError(error: any): string {
  const details: any = {
    message: error.message || 'Unknown error',
    type: error.constructor.name,
    code: error.code,
    cause: error.cause
  };
  
  // Check for specific error types
  if (error.code === 'ECONNREFUSED') {
    details.networkError = 'Connection refused - server might be down';
  }
  if (error.code === 'ENOTFOUND') {
    details.networkError = 'Domain not found - DNS resolution failed';
  }
  if (error.type === 'invalid-json') {
    details.parseError = 'Invalid JSON response';
  }
  
  return JSON.stringify(details, null, 2);
}

// Helper function to test a single endpoint
async function testEndpoint(
  deploymentUrl: string,
  endpointName: string,
  endpoint: any,
  authToken?: string,
  testData?: any
): Promise<TestResult> {
  const startTime = Date.now();
  let path = endpoint.path;
  
  // Replace path parameters if needed
  if (testData?.pathParams) {
    Object.entries(testData.pathParams).forEach(([key, value]) => {
      path = path.replace(`{${key}}`, value as string);
    });
  }
  
  const url = `${deploymentUrl}${path}`;
  const headers: any = {
    'Content-Type': 'application/json',
    ...(authToken && { 'Authorization': `Bearer ${authToken}` })
  };
  
  const config: any = {
    method: endpoint.method,
    headers,
    timeout: 30000 // 30 second timeout
  };
  
  if (testData?.body && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
    config.body = JSON.stringify(testData.body);
  }
  
  try {
    console.log(`  → Testing ${endpoint.method} ${path}`);
    const response = await fetch(url, config);
    const responseTime = Date.now() - startTime;
    
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (e) {
        data = { error: 'Failed to parse JSON response', raw: await response.text() };
      }
    } else {
      data = await response.text();
    }
    
    const result: TestResult = {
      success: response.ok,
      statusCode: response.status,
      responseTime,
      data
    };
    
    // Add diagnostics for failures
    if (!result.success) {
      result.diagnostics = {
        headers: Object.fromEntries(response.headers.entries()),
        expectedAuth: endpoint.requiresAuth,
        providedAuth: !!authToken,
        corsHeaders: {
          'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
          'access-control-allow-credentials': response.headers.get('access-control-allow-credentials'),
          'access-control-allow-methods': response.headers.get('access-control-allow-methods')
        },
        url,
        method: endpoint.method
      };
    }
    
    return result;
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      responseTime,
      error: formatError(error),
      diagnostics: {
        url,
        method: endpoint.method,
        authProvided: !!authToken,
        errorType: error.constructor.name,
        isNetworkError: true
      }
    };
  }
}

// Main test function
async function testAllEndpoints() {
  console.log('🚀 Starting Comprehensive API Testing Across Vercel Deployments\n');
  
  const results: any = {};
  
  for (const deployment of DEPLOYMENTS) {
    console.log(`\n📍 Testing deployment: ${deployment}`);
    console.log('─'.repeat(60));
    
    results[deployment] = {
      totalEndpoints: 0,
      successfulEndpoints: 0,
      failedEndpoints: 0,
      endpoints: {},
      authToken: null,
      adminToken: null
    };
    
    // Test 1: Health Check
    console.log('\n🏥 Testing Health Endpoint');
    const healthResult = await testEndpoint(deployment, 'health', API_ENDPOINTS.health);
    results[deployment].endpoints.health = healthResult;
    results[deployment].totalEndpoints++;
    if (healthResult.success) {
      results[deployment].successfulEndpoints++;
      console.log(`  ✓ Health check passed (${healthResult.responseTime}ms)`);
      console.log(`    Status: ${JSON.stringify(healthResult.data, null, 2)}`);
    } else {
      results[deployment].failedEndpoints++;
      console.log(`  ✗ Health check failed`);
      console.log(`    Error: ${JSON.stringify(healthResult.error || healthResult.data, null, 2)}`);
    }
    
    // Test 2: Create Temporary User
    console.log('\n👤 Testing Create Temporary User Endpoint');
    const createTempUserResult = await testEndpoint(
      deployment,
      'usersCreateTemp',
      API_ENDPOINTS.usersCreateTemp
    );
    results[deployment].endpoints.usersCreateTemp = createTempUserResult;
    results[deployment].totalEndpoints++;
    if (createTempUserResult.success) {
      results[deployment].successfulEndpoints++;
      console.log(`  ✓ Create temp user successful (${createTempUserResult.responseTime}ms)`);
      console.log(`    Response: ${JSON.stringify(createTempUserResult.data, null, 2)}`);
    } else {
      results[deployment].failedEndpoints++;
      console.log(`  ✗ Create temp user failed`);
      console.log(`    Status: ${createTempUserResult.statusCode}`);
      console.log(`    Error: ${JSON.stringify(createTempUserResult.error || createTempUserResult.data, null, 2)}`);
      if (createTempUserResult.diagnostics) {
        console.log(`    Diagnostics: ${JSON.stringify(createTempUserResult.diagnostics, null, 2)}`);
      }
    }
    
    // Test 3: Login with created user
    console.log('\n🔐 Testing Authentication');
    const loginResult = await testEndpoint(
      deployment,
      'authLogin',
      API_ENDPOINTS.authLogin,
      undefined,
      { body: TEST_USER_CREDENTIALS }
    );
    results[deployment].endpoints.authLogin = loginResult;
    results[deployment].totalEndpoints++;
    
    if (loginResult.success && loginResult.data?.token) {
      results[deployment].successfulEndpoints++;
      results[deployment].authToken = loginResult.data.token;
      console.log(`  ✓ Login successful (${loginResult.responseTime}ms)`);
      console.log(`    User: ${loginResult.data.user?.email}`);
      console.log(`    Role: ${loginResult.data.user?.role?.name || 'N/A'}`);
    } else {
      results[deployment].failedEndpoints++;
      console.log(`  ✗ Login failed`);
      console.log(`    Status: ${loginResult.statusCode}`);
      console.log(`    Error: ${JSON.stringify(loginResult.error || loginResult.data, null, 2)}`);
    }
    
    // Test authenticated endpoints if login was successful
    if (results[deployment].authToken) {
      console.log('\n🔒 Testing Authenticated Endpoints');
      
      // Test auth/me endpoint
      const meResult = await testEndpoint(
        deployment,
        'authMe',
        API_ENDPOINTS.authMe,
        results[deployment].authToken
      );
      results[deployment].endpoints.authMe = meResult;
      results[deployment].totalEndpoints++;
      if (meResult.success) {
        results[deployment].successfulEndpoints++;
        console.log(`  ✓ GET /api/auth/me (${meResult.responseTime}ms)`);
      } else {
        results[deployment].failedEndpoints++;
        console.log(`  ✗ GET /api/auth/me - Status: ${meResult.statusCode}`);
      }
      
      // Test users endpoints
      const usersResult = await testEndpoint(
        deployment,
        'usersGet',
        API_ENDPOINTS.usersGet,
        results[deployment].authToken
      );
      results[deployment].endpoints.usersGet = usersResult;
      results[deployment].totalEndpoints++;
      if (usersResult.success) {
        results[deployment].successfulEndpoints++;
        console.log(`  ✓ GET /api/users (${usersResult.responseTime}ms)`);
        console.log(`    Total users: ${usersResult.data?.total || 0}`);
      } else {
        results[deployment].failedEndpoints++;
        console.log(`  ✗ GET /api/users - Status: ${usersResult.statusCode}`);
      }
      
      // Test roles endpoint
      const rolesResult = await testEndpoint(
        deployment,
        'rolesGet',
        API_ENDPOINTS.rolesGet,
        results[deployment].authToken
      );
      results[deployment].endpoints.rolesGet = rolesResult;
      results[deployment].totalEndpoints++;
      if (rolesResult.success) {
        results[deployment].successfulEndpoints++;
        console.log(`  ✓ GET /api/roles (${rolesResult.responseTime}ms)`);
      } else {
        results[deployment].failedEndpoints++;
        console.log(`  ✗ GET /api/roles - Status: ${rolesResult.statusCode}`);
      }
      
      // Test categories endpoint
      const categoriesResult = await testEndpoint(
        deployment,
        'categoriesGet',
        API_ENDPOINTS.categoriesGet,
        results[deployment].authToken
      );
      results[deployment].endpoints.categoriesGet = categoriesResult;
      results[deployment].totalEndpoints++;
      if (categoriesResult.success) {
        results[deployment].successfulEndpoints++;
        console.log(`  ✓ GET /api/categories (${categoriesResult.responseTime}ms)`);
      } else {
        results[deployment].failedEndpoints++;
        console.log(`  ✗ GET /api/categories - Status: ${categoriesResult.statusCode}`);
      }
      
      // Test inventory endpoint
      const inventoryResult = await testEndpoint(
        deployment,
        'inventoryGet',
        API_ENDPOINTS.inventoryGet,
        results[deployment].authToken
      );
      results[deployment].endpoints.inventoryGet = inventoryResult;
      results[deployment].totalEndpoints++;
      if (inventoryResult.success) {
        results[deployment].successfulEndpoints++;
        console.log(`  ✓ GET /api/inventory (${inventoryResult.responseTime}ms)`);
      } else {
        results[deployment].failedEndpoints++;
        console.log(`  ✗ GET /api/inventory - Status: ${inventoryResult.statusCode}`);
      }
      
      // Test locations endpoint
      const locationsResult = await testEndpoint(
        deployment,
        'locationsGet',
        API_ENDPOINTS.locationsGet,
        results[deployment].authToken
      );
      results[deployment].endpoints.locationsGet = locationsResult;
      results[deployment].totalEndpoints++;
      if (locationsResult.success) {
        results[deployment].successfulEndpoints++;
        console.log(`  ✓ GET /api/locations (${locationsResult.responseTime}ms)`);
      } else {
        results[deployment].failedEndpoints++;
        console.log(`  ✗ GET /api/locations - Status: ${locationsResult.statusCode}`);
      }
    }
    
    // Test debug-roles endpoint (no auth required)
    console.log('\n🐛 Testing Debug Endpoints');
    const debugRolesResult = await testEndpoint(
      deployment,
      'debugRoles',
      API_ENDPOINTS.debugRoles
    );
    results[deployment].endpoints.debugRoles = debugRolesResult;
    results[deployment].totalEndpoints++;
    if (debugRolesResult.success) {
      results[deployment].successfulEndpoints++;
      console.log(`  ✓ GET /api/debug-roles (${debugRolesResult.responseTime}ms)`);
    } else {
      results[deployment].failedEndpoints++;
      console.log(`  ✗ GET /api/debug-roles - Status: ${debugRolesResult.statusCode}`);
    }
  }
  
  // Generate summary report
  console.log('\n\n📊 SUMMARY REPORT');
  console.log('═'.repeat(80));
  
  for (const deployment of DEPLOYMENTS) {
    const result = results[deployment];
    const successRate = ((result.successfulEndpoints / result.totalEndpoints) * 100).toFixed(1);
    
    console.log(`\n${deployment}`);
    console.log('─'.repeat(deployment.length));
    console.log(`Total Endpoints Tested: ${result.totalEndpoints}`);
    console.log(`✓ Successful: ${result.successfulEndpoints}`);
    console.log(`✗ Failed: ${result.failedEndpoints}`);
    console.log(`Success Rate: ${successRate}%`);
    
    // List failed endpoints with details
    if (result.failedEndpoints > 0) {
      console.log('\nFailed Endpoints:');
      Object.entries(result.endpoints).forEach(([name, endpointResult]: [string, any]) => {
        if (!endpointResult.success) {
          console.log(`  - ${name}: Status ${endpointResult.statusCode || 'N/A'}`);
          if (endpointResult.error) {
            try {
              const errorStr = typeof endpointResult.error === 'string' ? endpointResult.error : JSON.stringify(endpointResult.error);
              console.log(`    ${errorStr.substring(0, 200)}...`);
            } catch {
              console.log(`    ${endpointResult.error}`);
            }
          }
        }
      });
    }
    
    // Performance metrics
    const responseTimes = Object.values(result.endpoints)
      .map((r: any) => r.responseTime)
      .filter(Boolean);
    if (responseTimes.length > 0) {
      const avgResponseTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);
      
      console.log('\nPerformance Metrics:');
      console.log(`  Average Response Time: ${avgResponseTime}ms`);
      console.log(`  Min Response Time: ${minResponseTime}ms`);
      console.log(`  Max Response Time: ${maxResponseTime}ms`);
    }
  }
  
  // Detailed failure analysis
  console.log('\n\n🔍 DETAILED FAILURE ANALYSIS');
  console.log('═'.repeat(80));
  
  for (const deployment of DEPLOYMENTS) {
    const failedEndpoints = Object.entries(results[deployment].endpoints)
      .filter(([_, result]: [string, any]) => !result.success);
    
    if (failedEndpoints.length > 0) {
      console.log(`\n${deployment}`);
      
      failedEndpoints.forEach(([name, result]: [string, any]) => {
        console.log(`\n${name}:`);
        console.log(`  Status Code: ${result.statusCode || 'N/A'}`);
        console.log(`  Response Time: ${result.responseTime}ms`);
        
        if (result.error) {
          console.log(`  Error Details:`);
          try {
            const errorObj = typeof result.error === 'string' ? JSON.parse(result.error) : result.error;
            console.log(JSON.stringify(errorObj, null, 2).split('\n').map(line => '    ' + line).join('\n'));
          } catch {
            console.log(`    ${result.error}`);
          }
        }
        
        if (result.diagnostics) {
          console.log(`  Diagnostics:`);
          console.log(JSON.stringify(result.diagnostics, null, 2).split('\n').map(line => '    ' + line).join('\n'));
        }
        
        if (result.data) {
          console.log(`  Response Data:`);
          console.log(JSON.stringify(result.data, null, 2).split('\n').map(line => '    ' + line).join('\n'));
        }
      });
    }
  }
  
  // Environment and configuration issues
  console.log('\n\n⚠️  COMMON ISSUES AND RECOMMENDATIONS');
  console.log('═'.repeat(80));
  
  const commonIssues = new Set<string>();
  
  for (const deployment of DEPLOYMENTS) {
    const result = results[deployment];
    
    // Check for auth issues
    if (!result.authToken) {
      commonIssues.add('Authentication failed - check user credentials and auth configuration');
    }
    
    // Check for CORS issues
    const corsIssues = Object.values(result.endpoints).filter((r: any) => 
      r.diagnostics?.corsHeaders && !r.diagnostics.corsHeaders['access-control-allow-origin']
    );
    if (corsIssues.length > 0) {
      commonIssues.add('CORS not configured - API responses missing Access-Control-Allow-Origin header');
    }
    
    // Check for database connection issues
    if (!result.endpoints.health?.success) {
      commonIssues.add('Health check failed - possible database connection issues');
    }
    
    // Check for service key issues
    if (result.endpoints.usersCreateTemp?.data?.error?.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      commonIssues.add('SUPABASE_SERVICE_ROLE_KEY not configured in environment variables');
    }
  }
  
  if (commonIssues.size > 0) {
    commonIssues.forEach(issue => {
      console.log(`• ${issue}`);
    });
  }
  
  console.log('\n\n✅ Testing Complete!\n');
  
  // Save detailed results to file
  const fs = require('fs');
  const reportPath = `vercel-api-test-report-${new Date().toISOString().replace(/:/g, '-')}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`Detailed report saved to: ${reportPath}`);
}

// Run the tests
if (require.main === module) {
  testAllEndpoints().catch(console.error);
}

export { testAllEndpoints };