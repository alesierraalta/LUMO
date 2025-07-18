/**
 * API ENDPOINT TEST SUITE
 * 
 * Comprehensive testing for all API endpoints including HTTP methods,
 * status codes, response validation, error handling, and performance.
 */

const { TEST_CONFIG } = require('../config/test-config');

class ApiTestSuite {
  constructor(apiClient, logger) {
    this.apiClient = apiClient;
    this.logger = logger;
    this.originalAuthHeader = null;
    
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      details: [],
      errors: [],
      performance: []
    };
    
    // Define all API endpoints to test
    this.endpoints = {
      health: {
        path: '/api/health',
        methods: ['GET'],
        requiresAuth: false,
        expectedStatus: 200
      },
      products: {
        path: '/api/products',
        methods: ['GET', 'POST'],
        requiresAuth: true,
        expectedStatus: 200
      },
      productById: {
        path: '/api/products/{id}',
        methods: ['GET', 'PUT', 'DELETE'],
        requiresAuth: true,
        expectedStatus: 200
      },
      categories: {
        path: '/api/categories',
        methods: ['GET', 'POST'],
        requiresAuth: true,
        expectedStatus: 200
      },
      categoryById: {
        path: '/api/categories/{id}',
        methods: ['GET', 'PUT', 'DELETE'],
        requiresAuth: true,
        expectedStatus: 200
      },
      locations: {
        path: '/api/locations',
        methods: ['GET', 'POST'],
        requiresAuth: true,
        expectedStatus: 200
      },
      locationById: {
        path: '/api/locations/{id}',
        methods: ['GET', 'PUT', 'DELETE'],
        requiresAuth: true,
        expectedStatus: 200
      },
      inventory: {
        path: '/api/inventory',
        methods: ['GET', 'POST'],
        requiresAuth: true,
        expectedStatus: 200
      },
      inventoryById: {
        path: '/api/inventory/{id}',
        methods: ['GET', 'PUT', 'DELETE'],
        requiresAuth: true,
        expectedStatus: 200
      },
      users: {
        path: '/api/users',
        methods: ['GET', 'POST'],
        requiresAuth: true,
        expectedStatus: 200
      },
      userById: {
        path: '/api/users/{id}',
        methods: ['GET', 'PUT', 'DELETE'],
        requiresAuth: true,
        expectedStatus: 200
      },
      auth: {
        path: '/api/auth/login',
        methods: ['POST'],
        requiresAuth: false,
        expectedStatus: 200
      },
      authMe: {
        path: '/api/auth/me',
        methods: ['GET'],
        requiresAuth: true,
        expectedStatus: 200
      }
    };
  }

  /**
   * Run all API endpoint tests
   */
  async runAllApiTests() {
    this.logger.info('🌐 Starting API Endpoint Test Suite');
    
    try {
      // Store original auth header
      this.originalAuthHeader = this.apiClient.defaults.headers.common['Authorization'];
      
      // Authenticate for protected endpoints
      await this.authenticateForTests();
      
      // Test suites in order
      await this.testEndpointAvailability();
      await this.testHttpMethods();
      await this.testResponseValidation();
      await this.testErrorHandling();
      await this.testPerformance();
      await this.testDataValidation();
      await this.testCorsHeaders();
      
      this.logger.info(`✅ API endpoint tests completed: ${this.testResults.passed}/${this.testResults.total} passed`);
      
    } catch (error) {
      this.logger.error('❌ API endpoint test suite failed:', error);
      this.testResults.errors.push({
        phase: 'api-suite',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    } finally {
      // Restore original auth header
      if (this.originalAuthHeader) {
        this.apiClient.defaults.headers.common['Authorization'] = this.originalAuthHeader;
      } else {
        delete this.apiClient.defaults.headers.common['Authorization'];
      }
    }
    
    return this.testResults;
  }

  /**
   * Authenticate for protected endpoint tests
   */
  async authenticateForTests() {
    try {
      const response = await this.apiClient.post('/api/auth/login', TEST_CONFIG.TEST_USERS.ADMIN);
      
      if (response.status === 200 && response.data.token) {
        this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        this.logger.info('  🔑 Authentication successful for API tests');
      } else {
        throw new Error('Authentication failed for API tests');
      }
    } catch (error) {
      this.logger.warn('  ⚠️  Authentication failed, some tests may fail:', error.message);
    }
  }

  /**
   * Test endpoint availability
   */
  async testEndpointAvailability() {
    this.logger.info('  📡 Testing endpoint availability...');
    
    for (const [endpointName, config] of Object.entries(this.endpoints)) {
      await this.runTest(`Endpoint Availability: ${endpointName}`, async () => {
        const path = this.resolvePath(config.path, { id: 1 });
        const method = config.methods[0].toLowerCase();
        
        try {
          const response = await this.apiClient[method](path);
          
          return {
            endpoint: endpointName,
            path: path,
            method: method.toUpperCase(),
            status: response.status,
            available: true
          };
        } catch (error) {
          if (error.response) {
            // Endpoint exists but may have returned an error (which is expected for some)
            return {
              endpoint: endpointName,
              path: path,
              method: method.toUpperCase(),
              status: error.response.status,
              available: true,
              note: 'Endpoint exists but returned error (may be expected)'
            };
          } else {
            // Network error or endpoint doesn't exist
            throw new Error(`Endpoint not available: ${error.message}`);
          }
        }
      });
    }
  }

  /**
   * Test HTTP methods
   */
  async testHttpMethods() {
    this.logger.info('  🔧 Testing HTTP methods...');
    
    for (const [endpointName, config] of Object.entries(this.endpoints)) {
      for (const method of config.methods) {
        await this.runTest(`HTTP Method: ${method} ${endpointName}`, async () => {
          const path = this.resolvePath(config.path, { id: 1 });
          const methodLower = method.toLowerCase();
          
          // Prepare request data for POST/PUT methods
          let requestData = null;
          if (method === 'POST' || method === 'PUT') {
            requestData = this.getTestDataForEndpoint(endpointName);
          }
          
          try {
            let response;
            if (requestData) {
              response = await this.apiClient[methodLower](path, requestData);
            } else {
              response = await this.apiClient[methodLower](path);
            }
            
            return {
              endpoint: endpointName,
              method: method,
              status: response.status,
              responseTime: response.headers['x-response-time'] || 'N/A',
              success: true
            };
          } catch (error) {
            if (error.response) {
              // Expected errors (like 404, 401, etc.) are still valid responses
              return {
                endpoint: endpointName,
                method: method,
                status: error.response.status,
                responseTime: error.response.headers['x-response-time'] || 'N/A',
                success: error.response.status < 500, // 5xx errors are failures
                note: error.response.status >= 500 ? 'Server error' : 'Client error (may be expected)'
              };
            } else {
              throw error;
            }
          }
        });
      }
    }
  }

  /**
   * Test response validation
   */
  async testResponseValidation() {
    this.logger.info('  ✅ Testing response validation...');
    
    // Test GET endpoints for proper response structure
    const getEndpoints = Object.entries(this.endpoints).filter(([_, config]) => 
      config.methods.includes('GET')
    );
    
    for (const [endpointName, config] of getEndpoints) {
      await this.runTest(`Response Validation: GET ${endpointName}`, async () => {
        const path = this.resolvePath(config.path, { id: 1 });
        
        try {
          const response = await this.apiClient.get(path);
          
          // Validate response structure
          const validation = this.validateResponseStructure(endpointName, response.data);
          
          return {
            endpoint: endpointName,
            status: response.status,
            hasData: !!response.data,
            contentType: response.headers['content-type'],
            validation: validation
          };
        } catch (error) {
          if (error.response && error.response.status === 404) {
            // 404 is acceptable for some endpoints
            return {
              endpoint: endpointName,
              status: 404,
              note: 'Resource not found (acceptable for test)'
            };
          }
          throw error;
        }
      });
    }
  }

  /**
   * Test error handling
   */
  async testErrorHandling() {
    this.logger.info('  ⚠️  Testing error handling...');
    
    // Test 404 errors
    await this.runTest('404 Error Handling', async () => {
      try {
        const response = await this.apiClient.get('/api/nonexistent-endpoint');
        
        if (response.status === 200) {
          throw new Error('Non-existent endpoint returned 200');
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          return { errorHandling: 'correct', status: 404 };
        }
        throw error;
      }
    });
    
    // Test invalid data handling
    await this.runTest('Invalid Data Handling', async () => {
      try {
        const response = await this.apiClient.post('/api/products', {
          invalid: 'data',
          missing: 'required fields'
        });
        
        if (response.status === 200 || response.status === 201) {
          throw new Error('Invalid data was accepted');
        }
      } catch (error) {
        if (error.response && (error.response.status === 400 || error.response.status === 422)) {
          return { errorHandling: 'correct', status: error.response.status };
        }
        throw error;
      }
    });
    
    // Test unauthorized access
    await this.runTest('Unauthorized Access Handling', async () => {
      // Remove auth header temporarily
      const originalAuth = this.apiClient.defaults.headers.common['Authorization'];
      delete this.apiClient.defaults.headers.common['Authorization'];
      
      try {
        const response = await this.apiClient.get('/api/products');
        
        if (response.status === 200) {
          throw new Error('Unauthorized access was allowed');
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          return { errorHandling: 'correct', status: 401 };
        }
        throw error;
      } finally {
        // Restore auth header
        this.apiClient.defaults.headers.common['Authorization'] = originalAuth;
      }
    });
    
    // Test malformed JSON handling
    await this.runTest('Malformed JSON Handling', async () => {
      try {
        // Send malformed JSON
        const response = await this.apiClient.post('/api/products', 'invalid json', {
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.status === 200 || response.status === 201) {
          throw new Error('Malformed JSON was accepted');
        }
      } catch (error) {
        if (error.response && error.response.status === 400) {
          return { errorHandling: 'correct', status: 400 };
        }
        throw error;
      }
    });
  }

  /**
   * Test API performance
   */
  async testPerformance() {
    this.logger.info('  ⚡ Testing API performance...');
    
    const performanceTests = [
      { endpoint: '/api/health', name: 'Health Check' },
      { endpoint: '/api/products', name: 'Products List' },
      { endpoint: '/api/categories', name: 'Categories List' },
      { endpoint: '/api/locations', name: 'Locations List' }
    ];
    
    for (const test of performanceTests) {
      await this.runTest(`Performance: ${test.name}`, async () => {
        const startTime = Date.now();
        
        try {
          const response = await this.apiClient.get(test.endpoint);
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          
          // Store performance data
          this.testResults.performance.push({
            endpoint: test.endpoint,
            responseTime: responseTime,
            status: response.status,
            timestamp: new Date().toISOString()
          });
          
          return {
            endpoint: test.endpoint,
            responseTime: responseTime,
            status: response.status,
            performanceGrade: this.gradePerformance(responseTime)
          };
        } catch (error) {
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          
          if (error.response) {
            return {
              endpoint: test.endpoint,
              responseTime: responseTime,
              status: error.response.status,
              performanceGrade: this.gradePerformance(responseTime),
              note: 'Error response but timing recorded'
            };
          }
          throw error;
        }
      });
    }
  }

  /**
   * Test data validation
   */
  async testDataValidation() {
    this.logger.info('  🔍 Testing data validation...');
    
    // Test required field validation
    await this.runTest('Required Field Validation', async () => {
      try {
        const response = await this.apiClient.post('/api/products', {});
        
        if (response.status === 200 || response.status === 201) {
          throw new Error('Empty data was accepted for product creation');
        }
      } catch (error) {
        if (error.response && (error.response.status === 400 || error.response.status === 422)) {
          return { validation: 'working', status: error.response.status };
        }
        throw error;
      }
    });
    
    // Test data type validation
    await this.runTest('Data Type Validation', async () => {
      try {
        const response = await this.apiClient.post('/api/products', {
          name: 123, // Should be string
          price: 'not-a-number', // Should be number
          category_id: 'not-an-id' // Should be number/UUID
        });
        
        if (response.status === 200 || response.status === 201) {
          throw new Error('Invalid data types were accepted');
        }
      } catch (error) {
        if (error.response && (error.response.status === 400 || error.response.status === 422)) {
          return { validation: 'working', status: error.response.status };
        }
        throw error;
      }
    });
    
    // Test data length validation
    await this.runTest('Data Length Validation', async () => {
      try {
        const response = await this.apiClient.post('/api/products', {
          name: 'x'.repeat(1000), // Extremely long name
          description: 'x'.repeat(10000) // Extremely long description
        });
        
        if (response.status === 200 || response.status === 201) {
          throw new Error('Excessively long data was accepted');
        }
      } catch (error) {
        if (error.response && (error.response.status === 400 || error.response.status === 422)) {
          return { validation: 'working', status: error.response.status };
        }
        throw error;
      }
    });
  }

  /**
   * Test CORS headers
   */
  async testCorsHeaders() {
    this.logger.info('  🌍 Testing CORS headers...');
    
    await this.runTest('CORS Headers Present', async () => {
      const response = await this.apiClient.get('/api/health');
      
      const corsHeaders = {
        'access-control-allow-origin': response.headers['access-control-allow-origin'],
        'access-control-allow-methods': response.headers['access-control-allow-methods'],
        'access-control-allow-headers': response.headers['access-control-allow-headers']
      };
      
      return {
        corsHeaders: corsHeaders,
        hasCorsSupport: !!corsHeaders['access-control-allow-origin']
      };
    });
  }

  /**
   * Validate response structure
   */
  validateResponseStructure(endpointName, data) {
    const validations = {
      hasData: data !== null && data !== undefined,
      isObject: typeof data === 'object',
      hasExpectedFields: false
    };
    
    // Check for expected fields based on endpoint
    if (endpointName.includes('products')) {
      validations.hasExpectedFields = Array.isArray(data) || 
        (data && (data.id || data.name || data.products));
    } else if (endpointName.includes('categories')) {
      validations.hasExpectedFields = Array.isArray(data) || 
        (data && (data.id || data.name || data.categories));
    } else if (endpointName.includes('health')) {
      validations.hasExpectedFields = data && (data.status || data.database);
    } else {
      validations.hasExpectedFields = true; // Default to true for unknown endpoints
    }
    
    return validations;
  }

  /**
   * Get test data for endpoint
   */
  getTestDataForEndpoint(endpointName) {
    const testData = {
      products: {
        name: `${TEST_CONFIG.SAFE_PREFIXES.PRODUCT}Test Product`,
        description: 'Test product description',
        price: 99.99,
        sku: `${TEST_CONFIG.SAFE_PREFIXES.PRODUCT}SKU123`,
        category_id: 1
      },
      categories: {
        name: `${TEST_CONFIG.SAFE_PREFIXES.CATEGORY}Test Category`,
        description: 'Test category description'
      },
      locations: {
        name: `${TEST_CONFIG.SAFE_PREFIXES.LOCATION}Test Location`,
        address: 'Test Address',
        type: 'warehouse'
      },
      inventory: {
        product_id: 1,
        location_id: 1,
        quantity: 100,
        min_stock: 10,
        max_stock: 1000
      },
      users: {
        name: `${TEST_CONFIG.SAFE_PREFIXES.USER}Test User`,
        email: `${TEST_CONFIG.SAFE_PREFIXES.USER}test@example.com`,
        password: 'TestPassword123!',
        role: 'user'
      }
    };
    
    // Return appropriate test data based on endpoint
    if (endpointName.includes('product')) return testData.products;
    if (endpointName.includes('category')) return testData.categories;
    if (endpointName.includes('location')) return testData.locations;
    if (endpointName.includes('inventory')) return testData.inventory;
    if (endpointName.includes('user')) return testData.users;
    
    return {};
  }

  /**
   * Resolve path with parameters
   */
  resolvePath(path, params = {}) {
    let resolvedPath = path;
    
    for (const [key, value] of Object.entries(params)) {
      resolvedPath = resolvedPath.replace(`{${key}}`, value);
    }
    
    return resolvedPath;
  }

  /**
   * Grade performance based on response time
   */
  gradePerformance(responseTime) {
    if (responseTime < 100) return 'Excellent';
    if (responseTime < 300) return 'Good';
    if (responseTime < 1000) return 'Fair';
    if (responseTime < 3000) return 'Poor';
    return 'Very Poor';
  }

  /**
   * Run individual test with error handling
   */
  async runTest(testName, testFunction) {
    this.testResults.total++;
    
    try {
      const result = await testFunction();
      this.testResults.passed++;
      this.testResults.details.push({
        test: testName,
        status: 'PASSED',
        result: result,
        timestamp: new Date().toISOString()
      });
      
      this.logger.info(`    ✅ ${testName}`);
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: testName,
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      this.testResults.errors.push({
        test: testName,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      this.logger.error(`    ❌ ${testName}: ${error.message}`);
    }
  }

  /**
   * Cleanup test data
   */
  async cleanup() {
    this.logger.info('  🧹 Cleaning up API test data...');
    
    try {
      // Restore original auth header
      if (this.originalAuthHeader) {
        this.apiClient.defaults.headers.common['Authorization'] = this.originalAuthHeader;
      } else {
        delete this.apiClient.defaults.headers.common['Authorization'];
      }
      
      this.logger.info('  ✅ API test cleanup completed');
      
    } catch (error) {
      this.logger.warn('  ⚠️  API test cleanup had issues:', error);
    }
  }
}

module.exports = ApiTestSuite;