// Script to verify a successful deployment in Choreo
const { PrismaClient } = require('@prisma/client');
const https = require('https');
const http = require('http');

const HOST = process.env.DEPLOYMENT_HOST || 'localhost';
const PORT = process.env.PORT || 8080;
const PROTOCOL = process.env.NODE_ENV === 'production' ? 'https' : 'http';

// Log colored messages
const log = {
  info: (msg) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
  warning: (msg) => console.log(`\x1b[33m[WARNING]\x1b[0m ${msg}`),
  error: (msg) => console.log(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
};

async function testImportSession() {
  log.info('Testing ImportSession functionality...');
  
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    log.success('Connected to database');
    
    // Check if ImportSession table exists
    try {
      log.info('Checking ImportSession table...');
      
      // For PostgreSQL
      let result;
      try {
        result = await prisma.$queryRawUnsafe(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'ImportSession'
          ) as exists
        `);
        log.success('PostgreSQL detected');
      } catch (pgError) {
        // For SQLite
        result = await prisma.$queryRawUnsafe(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name='ImportSession'
        `);
        log.success('SQLite detected');
      }
      
      if (Array.isArray(result) && result.length > 0) {
        log.success('ImportSession table exists');
        
        // Create a test record
        const testId = 'verify-' + Date.now();
        try {
          log.info('Creating test ImportSession record...');
          await prisma.$executeRawUnsafe(`
            INSERT INTO "ImportSession" (
              "id", "fileName", "filePath", "status", "notes", "createdById", 
              "totalItems", "successItems", "warningItems", "errorItems", "createdAt"
            ) VALUES (
              '${testId}', 'test-file.csv', '/tmp/test-file.csv', 'verification', 
              'Verification test', 'system', 0, 0, 0, 0, CURRENT_TIMESTAMP
            )
          `);
          log.success('Successfully created test record');
          
          // Delete the test record
          await prisma.$executeRawUnsafe(`DELETE FROM "ImportSession" WHERE "id" = '${testId}'`);
          log.success('Successfully deleted test record');
        } catch (testError) {
          log.error(`Error testing ImportSession: ${testError.message}`);
          return false;
        }
      } else {
        log.error('ImportSession table does not exist');
        return false;
      }
    } catch (tableError) {
      log.error(`Error checking ImportSession table: ${tableError.message}`);
      return false;
    }
    
    return true;
  } catch (error) {
    log.error(`Database connection error: ${error.message}`);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function testHealthEndpoint() {
  log.info(`Testing health endpoint (${PROTOCOL}://${HOST}:${PORT}/api/health)...`);
  
  return new Promise((resolve) => {
    const requester = PROTOCOL === 'https' ? https : http;
    
    requester.get(`${PROTOCOL}://${HOST}:${PORT}/api/health`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          log.success(`Health endpoint returned status ${res.statusCode}`);
          
          try {
            const response = JSON.parse(data);
            log.success('Health endpoint returned valid JSON');
            log.info(`Status: ${response.status}`);
            resolve(true);
          } catch (error) {
            log.error(`Health endpoint returned invalid JSON: ${error.message}`);
            resolve(false);
          }
        } else {
          log.error(`Health endpoint returned status ${res.statusCode}`);
          resolve(false);
        }
      });
    }).on('error', (error) => {
      log.error(`Health endpoint request error: ${error.message}`);
      resolve(false);
    });
  });
}

async function main() {
  log.info('Starting deployment verification...');
  log.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  let success = true;
  
  // Test database and ImportSession
  const importSessionResult = await testImportSession();
  if (!importSessionResult) {
    success = false;
  }
  
  // Test health endpoint
  if (process.env.TEST_ENDPOINTS !== 'false') {
    const healthResult = await testHealthEndpoint();
    if (!healthResult) {
      success = false;
    }
  }
  
  // Print final result
  if (success) {
    log.success('✅ ALL VERIFICATION TESTS PASSED');
    log.success('✅ DEPLOYMENT VERIFICATION SUCCESSFUL');
  } else {
    log.error('❌ SOME VERIFICATION TESTS FAILED');
    log.error('❌ DEPLOYMENT VERIFICATION FAILED');
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  log.error(`Unhandled error: ${error.message}`);
  process.exit(1);
}); 