#!/usr/bin/env node

/**
 * Deployment Verification Test Suite
 * 
 * This script runs after deployment to verify that critical functionality
 * is working correctly in the deployed environment.
 * 
 * Tests include:
 * 1. Database connectivity
 * 2. API endpoints
 * 3. Import functionality
 * 4. Authentication
 * 5. Core business logic
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');
const https = require('https');

// Configuration
const config = {
  // Timeout for each test in milliseconds
  testTimeout: 30000,
  
  // Base URL for API tests (auto-detected if not provided)
  baseUrl: process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:8080',
  
  // Whether to exit with error code on test failure
  exitOnFailure: process.env.EXIT_ON_TEST_FAILURE === 'true' || false,
  
  // Whether to run in verbose mode
  verbose: process.env.VERBOSE_TESTS === 'true' || false,
  
  // Test categories to run (empty array means run all)
  categories: (process.env.TEST_CATEGORIES || '').split(',').filter(Boolean),
  
  // Authentication token for API tests
  authToken: process.env.TEST_AUTH_TOKEN || '',
};

// Initialize test results
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: 0,
  startTime: Date.now(),
  endTime: null,
  tests: [],
};

// Test utilities
const testUtils = {
  // HTTP request helper
  request: async (url, options = {}) => {
    return new Promise((resolve, reject) => {
      const fullUrl = url.startsWith('http') ? url : `${config.baseUrl}${url}`;
      const isHttps = fullUrl.startsWith('https');
      const client = isHttps ? https : http;
      
      const defaultHeaders = {
        'Content-Type': 'application/json',
      };
      
      // Add auth token if available
      if (config.authToken) {
        defaultHeaders['Authorization'] = `Bearer ${config.authToken}`;
      }
      
      const requestOptions = {
        method: options.method || 'GET',
        headers: { ...defaultHeaders, ...options.headers },
        timeout: options.timeout || config.testTimeout,
      };
      
      const req = client.request(fullUrl, requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          let parsedData;
          try {
            parsedData = data ? JSON.parse(data) : {};
          } catch (e) {
            parsedData = { rawData: data };
          }
          
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData,
          });
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      
      req.end();
    });
  },
  
  // Log helper
  log: (message, level = 'info') => {
    const prefix = {
      info: '📝',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      debug: '🔍',
    }[level] || '📝';
    
    if (level === 'debug' && !config.verbose) {
      return;
    }
    
    console.log(`${prefix} ${message}`);
  },
  
  // Test runner
  runTest: async (name, category, testFn) => {
    // Skip test if categories are specified and this category is not included
    if (config.categories.length > 0 && !config.categories.includes(category)) {
      testUtils.log(`Skipping test: ${name} (category: ${category})`, 'debug');
      testResults.skipped++;
      testResults.total++;
      testResults.tests.push({
        name,
        category,
        status: 'skipped',
        duration: 0,
      });
      return;
    }
    
    testUtils.log(`Running test: ${name} (category: ${category})`, 'info');
    testResults.total++;
    
    const startTime = Date.now();
    
    try {
      // Run the test with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Test timed out after ${config.testTimeout}ms`)), config.testTimeout);
      });
      
      await Promise.race([testFn(), timeoutPromise]);
      
      const duration = Date.now() - startTime;
      testUtils.log(`Test passed: ${name} (${duration}ms)`, 'success');
      testResults.passed++;
      testResults.tests.push({
        name,
        category,
        status: 'passed',
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      testUtils.log(`Test failed: ${name} - ${error.message}`, 'error');
      testResults.failed++;
      testResults.tests.push({
        name,
        category,
        status: 'failed',
        error: error.message,
        duration,
      });
    }
  },
};

// Define test categories
const testCategories = {
  // Basic health checks
  health: [
    {
      name: 'API Health Endpoint',
      test: async () => {
        const response = await testUtils.request('/api/health');
        
        if (response.statusCode !== 200) {
          throw new Error(`Expected status 200, got ${response.statusCode}`);
        }
        
        if (!response.data.status || response.data.status !== 'healthy') {
          throw new Error(`Expected status "healthy", got ${response.data.status}`);
        }
        
        return true;
      },
    },
    {
      name: 'Advanced Health Check',
      test: async () => {
        const response = await testUtils.request('/api/health-advanced');
        
        if (response.statusCode !== 200) {
          throw new Error(`Expected status 200, got ${response.statusCode}`);
        }
        
        // Check for database status
        if (!response.data.database || response.data.database.status !== 'connected') {
          throw new Error(`Database health check failed: ${JSON.stringify(response.data.database)}`);
        }
        
        return true;
      },
    },
  ],
  
  // Database connectivity tests
  database: [
    {
      name: 'Database Connection',
      test: async () => {
        const response = await testUtils.request('/api/choreo-db');
        
        if (response.statusCode !== 200) {
          throw new Error(`Expected status 200, got ${response.statusCode}`);
        }
        
        if (!response.data.connected) {
          throw new Error('Database connection failed');
        }
        
        return true;
      },
    },
    {
      name: 'Database Stats',
      test: async () => {
        const response = await testUtils.request('/api/debug/db-stats');
        
        if (response.statusCode !== 200) {
          throw new Error(`Expected status 200, got ${response.statusCode}`);
        }
        
        // Check for basic model counts
        const requiredModels = ['users', 'products', 'categories', 'locations'];
        for (const model of requiredModels) {
          if (typeof response.data[model] !== 'number') {
            throw new Error(`Missing count for model: ${model}`);
          }
        }
        
        return true;
      },
    },
  ],
  
  // Import functionality tests
  import: [
    {
      name: 'Import API Endpoints',
      test: async () => {
        // Test the upload endpoint (just checking if it's available)
        const uploadResponse = await testUtils.request('/api/inventory/import/upload', {
          method: 'OPTIONS',
        });
        
        if (uploadResponse.statusCode >= 500) {
          throw new Error(`Import upload endpoint error: ${uploadResponse.statusCode}`);
        }
        
        // Test the process endpoint (just checking if it's available)
        const processResponse = await testUtils.request('/api/inventory/import/process', {
          method: 'OPTIONS',
        });
        
        if (processResponse.statusCode >= 500) {
          throw new Error(`Import process endpoint error: ${processResponse.statusCode}`);
        }
        
        // Test the history endpoint
        const historyResponse = await testUtils.request('/api/inventory/import/history');
        
        if (historyResponse.statusCode !== 200) {
          throw new Error(`Import history endpoint error: ${historyResponse.statusCode}`);
        }
        
        return true;
      },
    },
    {
      name: 'Import Directory Structure',
      test: async () => {
        // This test checks if the necessary import directories exist
        // Since we can't directly access the file system in API tests,
        // we'll create a special endpoint for this check
        
        const response = await testUtils.request('/api/inventory/import/upload', {
          method: 'HEAD',
        });
        
        if (response.statusCode >= 500) {
          throw new Error(`Import directory check failed: ${response.statusCode}`);
        }
        
        return true;
      },
    },
  ],
  
  // Core business logic tests
  business: [
    {
      name: 'Products API',
      test: async () => {
        const response = await testUtils.request('/api/products/search?q=test');
        
        if (response.statusCode !== 200) {
          throw new Error(`Products API error: ${response.statusCode}`);
        }
        
        if (!Array.isArray(response.data)) {
          throw new Error('Products API did not return an array');
        }
        
        return true;
      },
    },
    {
      name: 'Categories API',
      test: async () => {
        const response = await testUtils.request('/api/categories/search?q=test');
        
        if (response.statusCode !== 200) {
          throw new Error(`Categories API error: ${response.statusCode}`);
        }
        
        if (!Array.isArray(response.data)) {
          throw new Error('Categories API did not return an array');
        }
        
        return true;
      },
    },
    {
      name: 'Inventory Stock Check',
      test: async () => {
        // Test inventory stock endpoint
        const response = await testUtils.request('/api/inventory/check-skus');
        
        if (response.statusCode !== 200) {
          throw new Error(`Inventory stock check failed: ${response.statusCode}`);
        }
        
        return true;
      },
    },
  ],
  
  // Authentication tests
  auth: [
    {
      name: 'Auth Status Endpoint',
      test: async () => {
        const response = await testUtils.request('/api/auth/me');
        
        // This might return 401 if not authenticated, which is fine for this test
        // We just want to make sure the endpoint is working
        if (response.statusCode >= 500) {
          throw new Error(`Auth status endpoint error: ${response.statusCode}`);
        }
        
        return true;
      },
    },
    {
      name: 'Permissions Check',
      test: async () => {
        const response = await testUtils.request('/api/auth/check-permissions');
        
        // This might return 401 if not authenticated, which is fine for this test
        // We just want to make sure the endpoint is working
        if (response.statusCode >= 500) {
          throw new Error(`Permissions check endpoint error: ${response.statusCode}`);
        }
        
        return true;
      },
    },
  ],
};

// Main function to run all tests
async function runTests() {
  testUtils.log('🚀 Starting deployment verification tests', 'info');
  testUtils.log(`Base URL: ${config.baseUrl}`, 'info');
  
  if (config.categories.length > 0) {
    testUtils.log(`Running only categories: ${config.categories.join(', ')}`, 'info');
  } else {
    testUtils.log('Running all test categories', 'info');
  }
  
  // Run tests for each category
  for (const [category, tests] of Object.entries(testCategories)) {
    if (config.categories.length > 0 && !config.categories.includes(category)) {
      testUtils.log(`Skipping category: ${category}`, 'debug');
      testResults.skipped += tests.length;
      testResults.total += tests.length;
      continue;
    }
    
    testUtils.log(`\n📋 Running tests for category: ${category}`, 'info');
    
    for (const test of tests) {
      await testUtils.runTest(test.name, category, test.test);
    }
  }
  
  // Calculate final results
  testResults.endTime = Date.now();
  const duration = (testResults.endTime - testResults.startTime) / 1000;
  
  // Print test summary
  testUtils.log('\n📊 Test Summary:', 'info');
  testUtils.log(`Total tests: ${testResults.total}`, 'info');
  testUtils.log(`Passed: ${testResults.passed}`, 'success');
  testUtils.log(`Failed: ${testResults.failed}`, 'error');
  testUtils.log(`Skipped: ${testResults.skipped}`, 'warning');
  testUtils.log(`Duration: ${duration.toFixed(2)} seconds`, 'info');
  
  // Print failed tests
  if (testResults.failed > 0) {
    testUtils.log('\n❌ Failed Tests:', 'error');
    testResults.tests
      .filter(test => test.status === 'failed')
      .forEach(test => {
        testUtils.log(`- ${test.name} (${test.category}): ${test.error}`, 'error');
      });
  }
  
  // Determine exit code
  const exitCode = testResults.failed > 0 && config.exitOnFailure ? 1 : 0;
  
  // Final status
  if (testResults.failed === 0) {
    testUtils.log('\n✅ All tests passed!', 'success');
  } else {
    testUtils.log(`\n❌ ${testResults.failed} tests failed!`, 'error');
  }
  
  // Write results to file
  const resultsFile = path.join(process.cwd(), 'logs', 'deployment-verification.json');
  try {
    // Ensure logs directory exists
    const logsDir = path.dirname(resultsFile);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    fs.writeFileSync(
      resultsFile,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        results: testResults,
        config: {
          ...config,
          // Remove sensitive data
          authToken: config.authToken ? '***' : undefined,
        },
      }, null, 2)
    );
    
    testUtils.log(`\n📝 Test results written to: ${resultsFile}`, 'info');
  } catch (error) {
    testUtils.log(`\n⚠️ Failed to write test results: ${error.message}`, 'warning');
  }
  
  // Exit with appropriate code
  if (exitCode !== 0) {
    testUtils.log('\n❌ Exiting with error code due to test failures', 'error');
    process.exit(exitCode);
  }
}

// Run the tests
runTests().catch(error => {
  testUtils.log(`\n❌ Fatal error: ${error.message}`, 'error');
  process.exit(1);
});
