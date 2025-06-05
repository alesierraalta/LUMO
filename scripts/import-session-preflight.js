#!/usr/bin/env node
/**
 * ImportSession Preflight Check
 * 
 * This script runs comprehensive verification checks for the ImportSession
 * table and model before application startup.
 */

const { verifyImportSession } = require('./verify-import-schema');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Log with timestamps
function log(level, ...messages) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}]`, ...messages);
}

// Detect environment
function detectEnvironment() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production' || process.env.CHOREO_DEPLOYMENT === 'true';
  const isPg = process.env.DATABASE_URL?.includes('postgresql') || 
               process.env.DATABASE_URL?.includes('postgres');
  
  return {
    nodeEnv,
    isProduction,
    isPg,
    databaseType: isPg ? 'postgresql' : 'sqlite',
    provider: isPg ? 'postgresql' : 'sqlite'
  };
}

// Run schema fix script based on environment
async function runSchemaFix() {
  const env = detectEnvironment();
  const fixScript = env.isPg ? 
    path.join(__dirname, 'fix-import-session-postgres.js') : 
    path.join(__dirname, 'fix-import-session-sqlite.js');
  
  if (!fs.existsSync(fixScript)) {
    log('ERROR', `Schema fix script not found: ${fixScript}`);
    return false;
  }
  
  try {
    log('INFO', `Running schema fix script: ${fixScript}`);
    execSync(`node "${fixScript}"`, { stdio: 'inherit' });
    return true;
  } catch (error) {
    log('ERROR', 'Failed to run schema fix script:', error.message);
    return false;
  }
}

// Create marker file to indicate preflight has run
function createMarkerFile(success) {
  const markerDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(markerDir)) {
    fs.mkdirSync(markerDir, { recursive: true });
  }
  
  const markerPath = path.join(markerDir, 'import-session-preflight.json');
  const data = {
    timestamp: new Date().toISOString(),
    success,
    environment: detectEnvironment()
  };
  
  fs.writeFileSync(markerPath, JSON.stringify(data, null, 2));
  log('INFO', `Preflight marker created at ${markerPath}`);
}

// Main function
async function runPreflight() {
  log('INFO', '🚀 Starting ImportSession preflight check');
  log('INFO', '🌍 Environment:', detectEnvironment());
  
  try {
    // Run initial verification
    log('INFO', '🔍 Running initial verification...');
    const initialVerification = await verifyImportSession();
    log('INFO', `Initial verification status: ${initialVerification.overallStatus}`);
    
    // If verification fails, attempt schema fix
    if (initialVerification.overallStatus !== 'PASS') {
      log('WARN', 'Schema verification failed, attempting fix...');
      const fixResult = await runSchemaFix();
      
      if (fixResult) {
        // Run verification again after fix
        log('INFO', '🔍 Verifying schema after fix...');
        const afterFixVerification = await verifyImportSession();
        
        if (afterFixVerification.overallStatus === 'PASS') {
          log('INFO', '✅ Schema fix was successful!');
          createMarkerFile(true);
          return true;
        } else {
          log('ERROR', '❌ Schema fix did not resolve all issues');
          log('ERROR', 'Remaining issues:', JSON.stringify(afterFixVerification.checks, null, 2));
          createMarkerFile(false);
          return false;
        }
      } else {
        log('ERROR', '❌ Failed to run schema fix');
        createMarkerFile(false);
        return false;
      }
    } else {
      log('INFO', '✅ ImportSession schema is correct, no fixes needed');
      createMarkerFile(true);
      return true;
    }
  } catch (error) {
    log('ERROR', '❌ Preflight check failed with error:', error);
    createMarkerFile(false);
    return false;
  }
}

// Run as main or export for importing
if (require.main === module) {
  // Run as standalone script
  runPreflight()
    .then(success => {
      if (success) {
        log('INFO', '✅ ImportSession preflight completed successfully');
        process.exit(0);
      } else {
        log('ERROR', '❌ ImportSession preflight failed');
        process.exit(1);
      }
    })
    .catch(error => {
      log('ERROR', '💥 Fatal error in preflight check:', error);
      process.exit(1);
    });
} else {
  // Export for importing in other modules
  module.exports = {
    runPreflight
  };
} 