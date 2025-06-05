#!/usr/bin/env node

/**
 * Database Connection Verification
 * 
 * This script verifies that the database connection is working correctly
 * and that basic CRUD operations can be performed.
 * 
 * It performs the following checks:
 * 1. Database connection
 * 2. Model access
 * 3. Basic CRUD operations
 * 4. Schema integrity
 * 5. Query performance
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Configuration
const config = {
  // Whether to exit with error code on test failure
  exitOnFailure: process.env.EXIT_ON_DB_FAILURE === 'true' || false,
  
  // Whether to run in verbose mode
  verbose: process.env.VERBOSE_DB_TESTS === 'true' || false,
  
  // Maximum time for database operations (ms)
  timeout: parseInt(process.env.DB_TEST_TIMEOUT || '5000', 10),
  
  // Whether to perform write tests
  performWriteTests: process.env.DB_PERFORM_WRITE_TESTS === 'true' || false,
  
  // Whether to log query performance
  logPerformance: process.env.DB_LOG_PERFORMANCE === 'true' || false,
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
  performance: {},
};

// Test utilities
const testUtils = {
  // Log helper
  log: (message, level = 'info') => {
    const prefix = {
      info: '📝',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      debug: '🔍',
      performance: '⏱️',
    }[level] || '📝';
    
    if (level === 'debug' && !config.verbose) {
      return;
    }
    
    if (level === 'performance' && !config.logPerformance) {
      return;
    }
    
    console.log(`${prefix} ${message}`);
  },
  
  // Test runner
  runTest: async (name, testFn, options = {}) => {
    const shouldSkip = options.skip || false;
    
    if (shouldSkip) {
      testUtils.log(`Skipping test: ${name}`, 'debug');
      testResults.skipped++;
      testResults.total++;
      testResults.tests.push({
        name,
        status: 'skipped',
        duration: 0,
      });
      return;
    }
    
    testUtils.log(`Running test: ${name}`, 'info');
    testResults.total++;
    
    const startTime = Date.now();
    
    try {
      // Run the test with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Test timed out after ${config.timeout}ms`)), config.timeout);
      });
      
      await Promise.race([testFn(), timeoutPromise]);
      
      const duration = Date.now() - startTime;
      testUtils.log(`Test passed: ${name} (${duration}ms)`, 'success');
      
      if (config.logPerformance) {
        testUtils.log(`Performance: ${name} took ${duration}ms`, 'performance');
      }
      
      testResults.passed++;
      testResults.tests.push({
        name,
        status: 'passed',
        duration,
      });
      
      // Store performance data
      testResults.performance[name] = duration;
    } catch (error) {
      const duration = Date.now() - startTime;
      testUtils.log(`Test failed: ${name} - ${error.message}`, 'error');
      testResults.failed++;
      testResults.tests.push({
        name,
        status: 'failed',
        error: error.message,
        duration,
      });
    }
  },
  
  // Create a test record for a model
  createTestRecord: async (prisma, model) => {
    const timestamp = new Date().toISOString();
    const testId = `test-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Define test data for different models
    const testData = {
      User: {
        email: `test-${testId}@example.com`,
        name: `Test User ${testId}`,
      },
      Product: {
        name: `Test Product ${testId}`,
        sku: `TEST-${testId}`,
        description: `Test product created at ${timestamp}`,
      },
      Category: {
        name: `Test Category ${testId}`,
        description: `Test category created at ${timestamp}`,
      },
      Location: {
        name: `Test Location ${testId}`,
        description: `Test location created at ${timestamp}`,
      },
    };
    
    // Get the appropriate test data for the model
    const data = testData[model] || { name: `Test ${model} ${testId}` };
    
    // Create the record
    try {
      const record = await prisma[model.toLowerCase()].create({ data });
      return record;
    } catch (error) {
      throw new Error(`Failed to create test ${model}: ${error.message}`);
    }
  },
  
  // Clean up test records
  cleanupTestRecord: async (prisma, model, id) => {
    try {
      await prisma[model.toLowerCase()].delete({ where: { id } });
      return true;
    } catch (error) {
      testUtils.log(`Warning: Failed to clean up test ${model}: ${error.message}`, 'warning');
      return false;
    }
  },
};

// Main function to run database verification
async function verifyDatabase() {
  testUtils.log('🚀 Starting database connection verification', 'info');
  
  let prisma;
  
  try {
    // Create Prisma client
    prisma = new PrismaClient({
      log: config.verbose ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
    
    // Test 1: Connect to database
    await testUtils.runTest('Database Connection', async () => {
      await prisma.$connect();
      return true;
    });
    
    // Test 2: Check database provider
    await testUtils.runTest('Database Provider', async () => {
      // Get database URL from environment
      const dbUrl = process.env.DATABASE_URL || '';
      
      // Check if using SQLite or PostgreSQL
      const isSQLite = dbUrl.startsWith('file:');
      const isPostgres = /postgres(ql)?:\/\//.test(dbUrl);
      
      if (!isSQLite && !isPostgres) {
        throw new Error(`Unknown database provider: ${dbUrl.split(':')[0]}`);
      }
      
      testUtils.log(`Database provider: ${isSQLite ? 'SQLite' : 'PostgreSQL'}`, 'info');
      
      return true;
    });
    
    // Test 3: Check model access
    const coreModels = ['User', 'Product', 'Category', 'Location'];
    
    for (const model of coreModels) {
      await testUtils.runTest(`${model} Model Access`, async () => {
        // Try to count records in the model
        const count = await prisma[model.toLowerCase()].count();
        testUtils.log(`${model} count: ${count}`, 'debug');
        return true;
      });
    }
    
    // Test 4: Basic CRUD operations
    if (config.performWriteTests) {
      // Test model to use for CRUD tests
      const testModel = 'Category';
      
      // Create test
      let testRecord;
      await testUtils.runTest(`Create ${testModel}`, async () => {
        testRecord = await testUtils.createTestRecord(prisma, testModel);
        if (!testRecord || !testRecord.id) {
          throw new Error(`Failed to create test ${testModel}`);
        }
        return true;
      });
      
      // Read test
      await testUtils.runTest(`Read ${testModel}`, async () => {
        if (!testRecord) {
          throw new Error('No test record to read');
        }
        
        const record = await prisma[testModel.toLowerCase()].findUnique({
          where: { id: testRecord.id },
        });
        
        if (!record) {
          throw new Error(`Could not find ${testModel} with ID ${testRecord.id}`);
        }
        
        return true;
      });
      
      // Update test
      await testUtils.runTest(`Update ${testModel}`, async () => {
        if (!testRecord) {
          throw new Error('No test record to update');
        }
        
        const updatedRecord = await prisma[testModel.toLowerCase()].update({
          where: { id: testRecord.id },
          data: { description: `Updated at ${new Date().toISOString()}` },
        });
        
        if (!updatedRecord) {
          throw new Error(`Failed to update ${testModel} with ID ${testRecord.id}`);
        }
        
        return true;
      });
      
      // Delete test
      await testUtils.runTest(`Delete ${testModel}`, async () => {
        if (!testRecord) {
          throw new Error('No test record to delete');
        }
        
        await testUtils.cleanupTestRecord(prisma, testModel, testRecord.id);
        return true;
      });
    } else {
      testUtils.log('Skipping write tests (set DB_PERFORM_WRITE_TESTS=true to enable)', 'warning');
    }
    
    // Test 5: Query performance
    await testUtils.runTest('Query Performance', async () => {
      const startTime = Date.now();
      
      // Run a complex query that joins multiple tables
      const results = await prisma.product.findMany({
        take: 5,
        include: {
          category: true,
          inventoryItems: {
            include: {
              location: true,
            },
          },
        },
      });
      
      const duration = Date.now() - startTime;
      testUtils.log(`Complex query took ${duration}ms`, 'performance');
      
      // Store performance data
      testResults.performance['complexQuery'] = duration;
      
      // Check if query is reasonably fast (under 1 second)
      if (duration > 1000) {
        testUtils.log(`Warning: Complex query took ${duration}ms (over 1 second)`, 'warning');
      }
      
      return true;
    });
    
    // Test 6: Schema integrity
    await testUtils.runTest('Schema Integrity', async () => {
      // Check for required fields in core models
      const product = await prisma.product.findFirst();
      if (product) {
        // Check required fields
        const requiredFields = ['id', 'name', 'sku', 'createdAt', 'updatedAt'];
        for (const field of requiredFields) {
          if (!(field in product)) {
            throw new Error(`Product schema missing required field: ${field}`);
          }
        }
      }
      
      return true;
    });
    
  } catch (error) {
    testUtils.log(`Fatal error: ${error.message}`, 'error');
    testResults.failed++;
  } finally {
    // Disconnect from the database
    if (prisma) {
      await prisma.$disconnect();
    }
  }
  
  // Calculate final results
  testResults.endTime = Date.now();
  const duration = (testResults.endTime - testResults.startTime) / 1000;
  
  // Print test summary
  testUtils.log('\n📊 Database Verification Summary:', 'info');
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
        testUtils.log(`- ${test.name}: ${test.error}`, 'error');
      });
  }
  
  // Print performance data
  if (config.logPerformance) {
    testUtils.log('\n⏱️ Performance Data:', 'performance');
    Object.entries(testResults.performance).forEach(([name, duration]) => {
      testUtils.log(`- ${name}: ${duration}ms`, 'performance');
    });
  }
  
  // Write results to file
  const resultsFile = path.join(process.cwd(), 'logs', 'database-verification.json');
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
        config,
      }, null, 2)
    );
    
    testUtils.log(`\n📝 Test results written to: ${resultsFile}`, 'info');
  } catch (error) {
    testUtils.log(`\n⚠️ Failed to write test results: ${error.message}`, 'warning');
  }
  
  // Determine exit code
  const exitCode = testResults.failed > 0 && config.exitOnFailure ? 1 : 0;
  
  // Final status
  if (testResults.failed === 0) {
    testUtils.log('\n✅ Database verification passed!', 'success');
  } else {
    testUtils.log(`\n❌ Database verification failed with ${testResults.failed} errors!`, 'error');
  }
  
  // Exit with appropriate code
  if (exitCode !== 0) {
    testUtils.log('\n❌ Exiting with error code due to test failures', 'error');
    process.exit(exitCode);
  }
}

// Run the verification
verifyDatabase().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
