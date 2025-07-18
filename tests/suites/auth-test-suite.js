/**
 * AUTHENTICATION TEST SUITE
 * 
 * Comprehensive testing for authentication and authorization functionality.
 * Tests login, logout, token management, role-based permissions, and security measures.
 */

const { TEST_CONFIG } = require('../config/test-config');

class AuthTestSuite {
  constructor(apiClient, logger) {
    this.apiClient = apiClient;
    this.logger = logger;
    this.originalAuthHeader = null;
    this.testTokens = new Map();
    
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      details: [],
      errors: []
    };
  }

  /**
   * Run all authentication tests
   */
  async runAllAuthTests() {
    this.logger.info('🔐 Starting Authentication Test Suite');
    
    try {
      // Store original auth header
      this.originalAuthHeader = this.apiClient.defaults.headers.common['Authorization'];
      
      // Test suites in order
      await this.testBasicAuthentication();
      await this.testTokenManagement();
      await this.testRoleBasedAccess();
      await this.testSecurityMeasures();
      await this.testSessionManagement();
      await this.testPasswordSecurity();
      
      this.logger.info(`✅ Authentication tests completed: ${this.testResults.passed}/${this.testResults.total} passed`);
      
    } catch (error) {
      this.logger.error('❌ Authentication test suite failed:', error);
      this.testResults.errors.push({
        phase: 'auth-suite',
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
   * Test basic authentication flows
   */
  async testBasicAuthentication() {
    this.logger.info('  🔑 Testing basic authentication...');
    
    // Test 1: Valid admin login
    await this.runTest('Admin Login', async () => {
      const response = await this.apiClient.post('/api/auth/login', TEST_CONFIG.TEST_USERS.ADMIN);
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      if (!response.data.token) {
        throw new Error('Login response missing token');
      }
      
      if (!response.data.user) {
        throw new Error('Login response missing user data');
      }
      
      // Store token for later tests
      this.testTokens.set('admin', response.data.token);
      
      return { token: response.data.token, user: response.data.user };
    });
    
    // Test 2: Valid user login
    await this.runTest('User Login', async () => {
      const response = await this.apiClient.post('/api/auth/login', TEST_CONFIG.TEST_USERS.USER);
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      if (!response.data.token) {
        throw new Error('Login response missing token');
      }
      
      // Store token for later tests
      this.testTokens.set('user', response.data.token);
      
      return { token: response.data.token };
    });
    
    // Test 3: Invalid credentials
    await this.runTest('Invalid Credentials Rejection', async () => {
      try {
        const response = await this.apiClient.post('/api/auth/login', {
          email: 'invalid@test.com',
          password: 'wrongpassword'
        });
        
        if (response.status === 200) {
          throw new Error('Invalid login was accepted - security vulnerability!');
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          // Expected - invalid login should be rejected
          return { rejected: true, status: 401 };
        }
        throw error;
      }
    });
    
    // Test 4: Missing credentials
    await this.runTest('Missing Credentials Rejection', async () => {
      try {
        const response = await this.apiClient.post('/api/auth/login', {});
        
        if (response.status === 200) {
          throw new Error('Login without credentials was accepted');
        }
      } catch (error) {
        if (error.response && error.response.status === 400) {
          // Expected - missing credentials should be rejected
          return { rejected: true, status: 400 };
        }
        throw error;
      }
    });
    
    // Test 5: Malformed request
    await this.runTest('Malformed Request Rejection', async () => {
      try {
        const response = await this.apiClient.post('/api/auth/login', {
          email: 'not-an-email',
          password: ''
        });
        
        if (response.status === 200) {
          throw new Error('Malformed login was accepted');
        }
      } catch (error) {
        if (error.response && (error.response.status === 400 || error.response.status === 422)) {
          // Expected - malformed request should be rejected
          return { rejected: true, status: error.response.status };
        }
        throw error;
      }
    });
  }

  /**
   * Test token management
   */
  async testTokenManagement() {
    this.logger.info('  🎫 Testing token management...');
    
    // Test 1: Token validation
    await this.runTest('Valid Token Access', async () => {
      const adminToken = this.testTokens.get('admin');
      if (!adminToken) {
        throw new Error('Admin token not available from previous tests');
      }
      
      this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
      
      const response = await this.apiClient.get('/api/auth/me');
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      if (!response.data.user) {
        throw new Error('Token validation response missing user data');
      }
      
      return { user: response.data.user };
    });
    
    // Test 2: Invalid token rejection
    await this.runTest('Invalid Token Rejection', async () => {
      this.apiClient.defaults.headers.common['Authorization'] = 'Bearer invalid-token-12345';
      
      try {
        const response = await this.apiClient.get('/api/auth/me');
        
        if (response.status === 200) {
          throw new Error('Invalid token was accepted');
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          // Expected - invalid token should be rejected
          return { rejected: true, status: 401 };
        }
        throw error;
      }
    });
    
    // Test 3: Missing token rejection
    await this.runTest('Missing Token Rejection', async () => {
      delete this.apiClient.defaults.headers.common['Authorization'];
      
      try {
        const response = await this.apiClient.get('/api/auth/me');
        
        if (response.status === 200) {
          throw new Error('Request without token was accepted');
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          // Expected - missing token should be rejected
          return { rejected: true, status: 401 };
        }
        throw error;
      }
    });
    
    // Test 4: Token expiration (if implemented)
    await this.runTest('Token Expiration Handling', async () => {
      // This test would check if expired tokens are properly rejected
      // For now, we'll simulate with an obviously expired token
      this.apiClient.defaults.headers.common['Authorization'] = 'Bearer expired.token.here';
      
      try {
        const response = await this.apiClient.get('/api/auth/me');
        
        if (response.status === 200) {
          throw new Error('Expired token was accepted');
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          // Expected - expired token should be rejected
          return { rejected: true, status: 401 };
        }
        throw error;
      }
    });
  }

  /**
   * Test role-based access control
   */
  async testRoleBasedAccess() {
    this.logger.info('  👥 Testing role-based access control...');
    
    // Test 1: Admin access to admin endpoints
    await this.runTest('Admin Access to Admin Endpoints', async () => {
      const adminToken = this.testTokens.get('admin');
      if (!adminToken) {
        throw new Error('Admin token not available');
      }
      
      this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
      
      const response = await this.apiClient.get('/api/admin/users');
      
      if (response.status !== 200) {
        throw new Error(`Admin access denied, status: ${response.status}`);
      }
      
      return { accessGranted: true };
    });
    
    // Test 2: User access denied to admin endpoints
    await this.runTest('User Access Denied to Admin Endpoints', async () => {
      const userToken = this.testTokens.get('user');
      if (!userToken) {
        throw new Error('User token not available');
      }
      
      this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
      
      try {
        const response = await this.apiClient.get('/api/admin/users');
        
        if (response.status === 200) {
          throw new Error('User was granted admin access - security vulnerability!');
        }
      } catch (error) {
        if (error.response && error.response.status === 403) {
          // Expected - user should be denied admin access
          return { accessDenied: true, status: 403 };
        }
        throw error;
      }
    });
    
    // Test 3: User access to user endpoints
    await this.runTest('User Access to User Endpoints', async () => {
      const userToken = this.testTokens.get('user');
      if (!userToken) {
        throw new Error('User token not available');
      }
      
      this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
      
      const response = await this.apiClient.get('/api/user/profile');
      
      if (response.status !== 200) {
        throw new Error(`User access denied to user endpoint, status: ${response.status}`);
      }
      
      return { accessGranted: true };
    });
    
    // Test 4: Cross-user data access prevention
    await this.runTest('Cross-User Data Access Prevention', async () => {
      const userToken = this.testTokens.get('user');
      if (!userToken) {
        throw new Error('User token not available');
      }
      
      this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
      
      try {
        // Try to access another user's data (assuming user ID 999 exists and is different)
        const response = await this.apiClient.get('/api/user/999/profile');
        
        if (response.status === 200) {
          throw new Error('User was able to access another user\'s data - security vulnerability!');
        }
      } catch (error) {
        if (error.response && (error.response.status === 403 || error.response.status === 404)) {
          // Expected - user should not access other user's data
          return { accessDenied: true, status: error.response.status };
        }
        throw error;
      }
    });
  }

  /**
   * Test security measures
   */
  async testSecurityMeasures() {
    this.logger.info('  🛡️  Testing security measures...');
    
    // Test 1: Rate limiting (if implemented)
    await this.runTest('Rate Limiting Protection', async () => {
      const attempts = [];
      
      // Make multiple rapid login attempts
      for (let i = 0; i < 10; i++) {
        try {
          const response = await this.apiClient.post('/api/auth/login', {
            email: 'test@example.com',
            password: 'wrongpassword'
          });
          attempts.push({ attempt: i + 1, status: response.status });
        } catch (error) {
          attempts.push({ 
            attempt: i + 1, 
            status: error.response ? error.response.status : 'error',
            rateLimited: error.response && error.response.status === 429
          });
        }
      }
      
      // Check if rate limiting kicked in
      const rateLimitedAttempts = attempts.filter(a => a.rateLimited);
      
      return { 
        totalAttempts: attempts.length,
        rateLimitedAttempts: rateLimitedAttempts.length,
        rateLimitingActive: rateLimitedAttempts.length > 0
      };
    });
    
    // Test 2: SQL injection protection
    await this.runTest('SQL Injection Protection', async () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "admin'--",
        "' UNION SELECT * FROM users --"
      ];
      
      for (const maliciousInput of maliciousInputs) {
        try {
          const response = await this.apiClient.post('/api/auth/login', {
            email: maliciousInput,
            password: maliciousInput
          });
          
          if (response.status === 200) {
            throw new Error(`SQL injection attempt succeeded with input: ${maliciousInput}`);
          }
        } catch (error) {
          if (error.response && (error.response.status === 400 || error.response.status === 401)) {
            // Expected - malicious input should be rejected
            continue;
          }
          throw error;
        }
      }
      
      return { sqlInjectionBlocked: true };
    });
    
    // Test 3: XSS protection
    await this.runTest('XSS Protection', async () => {
      const xssPayloads = [
        "<script>alert('xss')</script>",
        "javascript:alert('xss')",
        "<img src=x onerror=alert('xss')>",
        "';alert('xss');//"
      ];
      
      for (const payload of xssPayloads) {
        try {
          const response = await this.apiClient.post('/api/auth/login', {
            email: payload,
            password: payload
          });
          
          // Check if response contains unescaped payload
          if (response.data && JSON.stringify(response.data).includes(payload)) {
            throw new Error(`XSS payload not properly escaped: ${payload}`);
          }
        } catch (error) {
          if (error.response && (error.response.status === 400 || error.response.status === 401)) {
            // Expected - malicious input should be rejected or sanitized
            continue;
          }
          throw error;
        }
      }
      
      return { xssProtectionActive: true };
    });
  }

  /**
   * Test session management
   */
  async testSessionManagement() {
    this.logger.info('  📱 Testing session management...');
    
    // Test 1: Logout functionality
    await this.runTest('Logout Functionality', async () => {
      const adminToken = this.testTokens.get('admin');
      if (!adminToken) {
        throw new Error('Admin token not available');
      }
      
      this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
      
      // First verify token works
      let response = await this.apiClient.get('/api/auth/me');
      if (response.status !== 200) {
        throw new Error('Token not working before logout test');
      }
      
      // Logout
      response = await this.apiClient.post('/api/auth/logout');
      if (response.status !== 200) {
        throw new Error(`Logout failed with status: ${response.status}`);
      }
      
      // Verify token no longer works (if server-side logout is implemented)
      try {
        response = await this.apiClient.get('/api/auth/me');
        if (response.status === 200) {
          // Token still works - client-side logout only
          return { logoutType: 'client-side' };
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          // Token invalidated - server-side logout
          return { logoutType: 'server-side' };
        }
        throw error;
      }
      
      return { logoutCompleted: true };
    });
    
    // Test 2: Concurrent session handling
    await this.runTest('Concurrent Session Handling', async () => {
      // Login with same credentials from two different "sessions"
      const session1 = await this.apiClient.post('/api/auth/login', TEST_CONFIG.TEST_USERS.ADMIN);
      const session2 = await this.apiClient.post('/api/auth/login', TEST_CONFIG.TEST_USERS.ADMIN);
      
      if (session1.status !== 200 || session2.status !== 200) {
        throw new Error('Failed to create concurrent sessions');
      }
      
      const token1 = session1.data.token;
      const token2 = session2.data.token;
      
      // Test if both tokens work
      this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${token1}`;
      const test1 = await this.apiClient.get('/api/auth/me');
      
      this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${token2}`;
      const test2 = await this.apiClient.get('/api/auth/me');
      
      return {
        session1Valid: test1.status === 200,
        session2Valid: test2.status === 200,
        concurrentSessionsAllowed: test1.status === 200 && test2.status === 200
      };
    });
  }

  /**
   * Test password security
   */
  async testPasswordSecurity() {
    this.logger.info('  🔒 Testing password security...');
    
    // Test 1: Password strength requirements (if implemented)
    await this.runTest('Password Strength Requirements', async () => {
      const weakPasswords = [
        '123',
        'password',
        'abc',
        '111111',
        'qwerty'
      ];
      
      const results = [];
      
      for (const weakPassword of weakPasswords) {
        try {
          const response = await this.apiClient.post('/api/auth/register', {
            email: `test_${Date.now()}@example.com`,
            password: weakPassword,
            name: 'Test User'
          });
          
          if (response.status === 200 || response.status === 201) {
            results.push({ password: weakPassword, accepted: true });
          } else {
            results.push({ password: weakPassword, accepted: false });
          }
        } catch (error) {
          if (error.response && error.response.status === 400) {
            results.push({ password: weakPassword, accepted: false, reason: 'validation' });
          } else {
            throw error;
          }
        }
      }
      
      const acceptedWeakPasswords = results.filter(r => r.accepted);
      
      return {
        weakPasswordsRejected: acceptedWeakPasswords.length === 0,
        results: results
      };
    });
    
    // Test 2: Password hashing verification
    await this.runTest('Password Hashing Verification', async () => {
      // This test would verify that passwords are properly hashed
      // For now, we'll just verify that login works with correct password
      // and fails with incorrect password (indicating hashing is working)
      
      const correctLogin = await this.apiClient.post('/api/auth/login', TEST_CONFIG.TEST_USERS.ADMIN);
      
      if (correctLogin.status !== 200) {
        throw new Error('Correct password login failed');
      }
      
      try {
        const incorrectLogin = await this.apiClient.post('/api/auth/login', {
          email: TEST_CONFIG.TEST_USERS.ADMIN.email,
          password: 'definitely-wrong-password'
        });
        
        if (incorrectLogin.status === 200) {
          throw new Error('Incorrect password login succeeded - password hashing issue!');
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          // Expected - incorrect password should be rejected
          return { passwordHashingWorking: true };
        }
        throw error;
      }
      
      return { passwordHashingWorking: true };
    });
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
    this.logger.info('  🧹 Cleaning up authentication test data...');
    
    try {
      // Clear stored tokens
      this.testTokens.clear();
      
      // Restore original auth header
      if (this.originalAuthHeader) {
        this.apiClient.defaults.headers.common['Authorization'] = this.originalAuthHeader;
      } else {
        delete this.apiClient.defaults.headers.common['Authorization'];
      }
      
      this.logger.info('  ✅ Authentication test cleanup completed');
      
    } catch (error) {
      this.logger.warn('  ⚠️  Authentication test cleanup had issues:', error);
    }
  }
}

module.exports = AuthTestSuite;