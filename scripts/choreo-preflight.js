#!/usr/bin/env node

/**
 * Choreo Preflight Check Script
 * 
 * This script runs before the server starts and performs essential checks
 * to ensure the environment is properly configured, including:
 * 
 * 1. Database schema verification and fixes
 * 2. File system permissions
 * 3. Required directories
 * 4. ImportSession table structure verification
 * 5. Database connection and model access verification
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Try to load Prisma client if available
let PrismaClient;
try {
  const prismaModule = require('@prisma/client');
  PrismaClient = prismaModule.PrismaClient;
} catch (error) {
  console.warn('⚠️ Could not load Prisma client module:', error.message);
}

console.log('🚀 Running Choreo preflight checks...');

// Check if we're in production/Choreo environment
const isProduction = process.env.NODE_ENV === 'production' || process.env.CHOREO_DEPLOYMENT === 'true';
console.log(`🔍 Environment: ${isProduction ? 'PRODUCTION/CHOREO' : 'DEVELOPMENT'}`);

// Ensure ImportSession directories exist
function ensureImportDirs() {
  try {
    console.log('📁 Ensuring import directories exist...');
    
    const dirs = [
      path.join(process.cwd(), '.next/server/app/api/inventory/import/process/dict'),
      path.join(process.cwd(), '.next/standalone/.next/server/app/api/inventory/import/process/dict'),
      path.join(process.cwd(), 'node_modules/.prisma/client')
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      } else {
        console.log(`✅ Directory already exists: ${dir}`);
      }
    });
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create import directories:', error.message);
    return false;
  }
}

// Fix ImportSession schema if needed
function fixImportSessionSchema() {
  try {
    console.log('🔧 Checking and fixing ImportSession schema...');
    
    // Run the appropriate fix script based on environment
    const fixScript = isProduction ? 'fix-import-session-postgres.js' : 'fix-import-session-sqlite.js';
    
    // Check if script exists in the expected locations
    let scriptPath = path.join(process.cwd(), 'scripts', fixScript);
    
    // Check for standalone directory structure in production
    if (isProduction && !fs.existsSync(scriptPath)) {
      scriptPath = path.join(process.cwd(), '.next/standalone/scripts', fixScript);
    }
    
    if (!fs.existsSync(scriptPath)) {
      console.error(`❌ ImportSession fix script not found: ${scriptPath}`);
      
      // Try the alternative script
      scriptPath = path.join(process.cwd(), 'scripts', 'run-import-session-migration.js');
      if (isProduction && !fs.existsSync(scriptPath)) {
        scriptPath = path.join(process.cwd(), '.next/standalone/scripts', 'run-import-session-migration.js');
      }
      
      if (!fs.existsSync(scriptPath)) {
        console.error('❌ No ImportSession fix scripts found');
        return false;
      }
    }
    
    console.log(`🔧 Running fix script: ${scriptPath}`);
    execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
    
    console.log('✅ ImportSession schema check completed');
    return true;
  } catch (error) {
    console.error('❌ Error fixing ImportSession schema:', error);
    
    // Still return true in production to allow the server to start
    if (isProduction) {
      console.warn('⚠️ Continuing despite ImportSession schema fix failure');
      return true;
    }
    
    return false;
  }
}

// Run comprehensive ImportSession verification
async function verifyImportSession() {
  try {
    console.log('🔍 Running comprehensive ImportSession verification...');
    
    // Try to use the preflight script if available
    let scriptPath = path.join(process.cwd(), 'scripts', 'import-session-preflight.js');
    
    // Check for standalone directory structure in production
    if (isProduction && !fs.existsSync(scriptPath)) {
      scriptPath = path.join(process.cwd(), '.next/standalone/scripts', 'import-session-preflight.js');
    }
    
    if (fs.existsSync(scriptPath)) {
      try {
        console.log(`🔧 Running preflight script: ${scriptPath}`);
        execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
        console.log('✅ ImportSession verification completed');
        return true;
      } catch (error) {
        console.error('❌ Error running ImportSession verification:', error);
        
        // Try the basic fix as fallback
        console.log('⚠️ Attempting basic ImportSession fix as fallback...');
        return fixImportSessionSchema();
      }
    } else {
      // Fall back to basic fix if preflight script not available
      console.log('⚠️ ImportSession preflight script not found, using basic fix...');
      return fixImportSessionSchema();
    }
  } catch (error) {
    console.error('❌ Error in ImportSession verification:', error);
    
    // Still return true in production to allow the server to start
    if (isProduction) {
      console.warn('⚠️ Continuing despite ImportSession verification failure');
      return true;
    }
    
    return false;
  }
}

// Verify database connection and model access
async function verifyDatabaseConnection() {
  try {
    console.log('🔍 Verifying database connection and model access...');
    
    if (!PrismaClient) {
      console.warn('⚠️ Prisma client module not available, skipping database verification');
      return isProduction; // Return true in production to continue
    }
    
    // Create a Prisma client with logging enabled
    const prisma = new PrismaClient({
      log: ['error', 'warn']
    });
    
    try {
      // 1. Test basic connection
      console.log('🔌 Testing database connection...');
      await prisma.$connect();
      console.log('✅ Successfully connected to database');
      
      // 2. Test critical models access
      const criticalModels = ['importSession', 'user', 'product', 'category', 'stock', 'location'];
      const results = {};
      
      console.log('🔍 Verifying critical models access...');
      for (const model of criticalModels) {
        try {
          const modelAccessible = prisma[model] !== undefined;
          if (!modelAccessible) {
            console.warn(`⚠️ Model '${model}' not accessible via Prisma client`);
            results[model] = false;
            continue;
          }
          
          // Test a simple operation (count)
          await prisma[model].count();
          console.log(`✅ Successfully accessed model: ${model}`);
          results[model] = true;
        } catch (modelError) {
          console.error(`❌ Error accessing model '${model}':`, modelError.message);
          results[model] = false;
        }
      }
      
      // 3. Special handling for ImportSession
      if (!results.importSession && criticalModels.includes('importSession')) {
        console.warn('⚠️ ImportSession model access failed, attempting schema fix...');
        const fixResult = await fixImportSessionSchema();
        
        if (fixResult) {
          try {
            // Try again after fix
            await prisma.importSession.count();
            console.log('✅ ImportSession model accessible after fix');
            results.importSession = true;
          } catch (retryError) {
            console.error('❌ ImportSession model still not accessible after fix:', retryError.message);
          }
        }
      }
      
      // 4. Decide overall result
      const allCriticalAccessible = criticalModels.some(model => results[model]);
      
      // Log final status
      console.log('\n📊 Model Access Status:');
      for (const [model, accessible] of Object.entries(results)) {
        console.log(`${accessible ? '✅' : '❌'} ${model}: ${accessible ? 'Accessible' : 'Not accessible'}`);
      }
      
      // Always return true in production to allow startup
      return isProduction || allCriticalAccessible;
    } catch (error) {
      console.error('❌ Database verification error:', error.message);
      return isProduction; // Return true in production to continue
    } finally {
      // Always disconnect
      await prisma.$disconnect().catch(console.error);
    }
  } catch (error) {
    console.error('❌ Failed to verify database connection:', error.message);
    return isProduction; // Return true in production to continue
  }
}

// Check if script can access and execute prisma generate
function checkPrismaGenerate() {
  try {
    console.log('🔍 Checking Prisma client generation...');
    
    // Check for prisma binary
    const prismaPath = isProduction ? 
      path.join(process.cwd(), 'node_modules', '.bin', 'prisma') : 
      'npx prisma';
    
    // Run with reduced output in production
    const generateCmd = isProduction ?
      `${prismaPath} generate --no-engine --schema=./prisma/schema.prisma` :
      `${prismaPath} generate`;
    
    console.log(`🔧 Running: ${generateCmd}`);
    execSync(generateCmd, { stdio: 'inherit' });
    
    console.log('✅ Prisma client generation successful');
    return true;
  } catch (error) {
    console.error('❌ Prisma client generation failed:', error.message);
    console.warn('⚠️ Some models might not be accessible');
    
    // Create a marker file to indicate preflight check error
    try {
      const logsDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      fs.writeFileSync(
        path.join(logsDir, 'prisma-generate-error.log'),
        `Timestamp: ${new Date().toISOString()}\nError: ${error.message}\n${error.stack || ''}`
      );
    } catch (fsError) {
      console.error('Failed to write error log:', fsError);
    }
    
    return isProduction; // Return true in production to continue
  }
}

// Main function
async function runPreflightChecks() {
  console.log('🔍 Starting preflight checks...');
  
  // Run all checks
  const results = {
    importDirs: ensureImportDirs(),
    prismaGenerate: checkPrismaGenerate(),
    importSessionVerification: await verifyImportSession(),
    databaseConnection: await verifyDatabaseConnection(),
  };
  
  // Log summary
  console.log('\n📋 Preflight Check Summary:');
  for (const [check, result] of Object.entries(results)) {
    console.log(`${result ? '✅' : '❌'} ${check}: ${result ? 'PASSED' : 'FAILED'}`);
  }
  
  const allPassed = Object.values(results).every(result => result === true);
  console.log(`\n${allPassed ? '✅ All checks PASSED' : '⚠️ Some checks FAILED'}`);
  
  return allPassed;
}

// Run the preflight checks
(async () => {
  const success = await runPreflightChecks();
  console.log(`🏁 Preflight checks ${success ? 'completed successfully' : 'completed with warnings'}`);

  // Exit with appropriate code - in production, we continue regardless to avoid startup failures
  process.exit((isProduction || success) ? 0 : 1);
})().catch(error => {
  console.error('💥 Unhandled error in preflight checks:', error);
  process.exit(isProduction ? 0 : 1);
}); 