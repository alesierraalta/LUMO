/**
 * COMPREHENSIVE TESTING SYSTEM CONFIGURATION
 * 
 * This configuration ensures safe testing without affecting production data.
 * All test data uses specific prefixes to prevent accidental deletion of real data.
 */

const TEST_CONFIG = {
  // Safe prefixes for test data - NEVER delete data without these prefixes
  SAFE_PREFIXES: {
    PRODUCTS: 'TEST_PRODUCT_',
    CATEGORIES: 'TEST_CATEGORY_',
    LOCATIONS: 'TEST_LOCATION_',
    USERS: 'TEST_USER_',
    INVENTORY: 'TEST_INVENTORY_',
    DEBUG: 'DEBUG_',
    TEMP: 'TEMP_TEST_'
  },

  // Test environment configuration
  ENVIRONMENT: {
    BASE_URL: process.env.NODE_ENV === 'production' 
      ? 'https://lumo-rmvrx97k2-alesierraaltas-projects.vercel.app'
      : 'http://localhost:3000',
    API_BASE: '/api',
    TIMEOUT: 30000, // 30 seconds timeout for tests
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000 // 1 second between retries
  },

  // Test data limits to prevent database bloat
  LIMITS: {
    MAX_TEST_PRODUCTS: 50,
    MAX_TEST_CATEGORIES: 20,
    MAX_TEST_LOCATIONS: 10,
    MAX_TEST_USERS: 25,
    MAX_TEST_INVENTORY_ITEMS: 100,
    CLEANUP_BATCH_SIZE: 10
  },

  // Test user credentials for authentication testing
  TEST_USERS: {
    ADMIN: {
      email: 'test_admin@test.com',
      password: 'TestAdmin123!',
      role: 'admin'
    },
    MANAGER: {
      email: 'test_manager@test.com', 
      password: 'TestManager123!',
      role: 'manager'
    },
    EMPLOYEE: {
      email: 'test_employee@test.com',
      password: 'TestEmployee123!',
      role: 'employee'
    }
  },

  // Test scenarios configuration
  SCENARIOS: {
    CRUD_OPERATIONS: {
      enabled: true,
      entities: ['products', 'categories', 'locations', 'inventory', 'users']
    },
    AUTHENTICATION: {
      enabled: true,
      testInvalidCredentials: true,
      testTokenExpiration: true,
      testRolePermissions: true
    },
    FRONTEND_COMPONENTS: {
      enabled: true,
      testFormValidation: true,
      testUserInteractions: true,
      testErrorHandling: true
    },
    API_ENDPOINTS: {
      enabled: true,
      testAllMethods: true,
      testErrorResponses: true,
      testDataValidation: true
    },
    DATABASE_INTEGRITY: {
      enabled: true,
      testConstraints: true,
      testRelationships: true,
      testDataConsistency: true
    }
  },

  // Reporting configuration
  REPORTING: {
    DETAILED_LOGS: true,
    SAVE_SCREENSHOTS: true,
    GENERATE_HTML_REPORT: true,
    SEND_EMAIL_REPORT: false,
    REPORT_PATH: './tests/reports/',
    LOG_LEVEL: 'verbose' // verbose, normal, minimal
  },

  // Safety checks configuration
  SAFETY: {
    REQUIRE_TEST_PREFIX: true,
    CONFIRM_BEFORE_CLEANUP: false, // Set to true for manual confirmation
    BACKUP_BEFORE_TESTS: false,
    DRY_RUN_MODE: false, // Set to true to simulate tests without actual changes
    PRODUCTION_SAFETY_CHECKS: true
  }
};

// Validation function to ensure configuration is safe
function validateTestConfig() {
  const errors = [];
  
  // Ensure all prefixes are defined and safe
  Object.entries(TEST_CONFIG.SAFE_PREFIXES).forEach(([key, prefix]) => {
    if (!prefix || prefix.length < 5) {
      errors.push(`${key} prefix must be at least 5 characters long`);
    }
    if (!prefix.includes('TEST') && !prefix.includes('DEBUG')) {
      errors.push(`${key} prefix must contain 'TEST' or 'DEBUG' for safety`);
    }
  });

  // Ensure limits are reasonable
  if (TEST_CONFIG.LIMITS.MAX_TEST_PRODUCTS > 100) {
    errors.push('MAX_TEST_PRODUCTS should not exceed 100 to prevent database bloat');
  }

  // Ensure test users have safe email domains
  Object.entries(TEST_CONFIG.TEST_USERS).forEach(([role, user]) => {
    if (!user.email.includes('test.com') && !user.email.includes('example.com')) {
      errors.push(`${role} test user email should use test.com or example.com domain`);
    }
  });

  if (errors.length > 0) {
    throw new Error(`Test configuration validation failed:\n${errors.join('\n')}`);
  }

  return true;
}

// Export configuration and validation
module.exports = {
  TEST_CONFIG,
  validateTestConfig
};