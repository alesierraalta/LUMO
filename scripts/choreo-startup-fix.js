#!/usr/bin/env node

/**
 * Choreo Startup Fix Script
 * 
 * This script runs automatically during Choreo deployment to ensure
 * the Excel importer functionality is ready for production.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Smart Prisma client creation based on database URL
function createSmartPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL || '';
  
  if (databaseUrl.startsWith('prisma://')) {
    // Accelerate URL: Use with Accelerate extension
    const { withAccelerate } = require('@prisma/extension-accelerate');
    return new PrismaClient({
      log: ['error'],
    }).$extends(withAccelerate());
  } else {
    // Direct PostgreSQL or SQLite: Use standard client
    return new PrismaClient({
      log: ['error'],
    });
  }
}

// Initialize Prisma client with smart configuration
const prisma = createSmartPrismaClient();

// Log with timestamps
function log(level, ...messages) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [CHOREO-STARTUP] [${level.toUpperCase()}]`, ...messages);
}

// Check if we're in Choreo environment
function isChoreoEnvironment() {
  return process.env.CHOREO_DEPLOYMENT === 'true' || 
         process.env.NODE_ENV === 'production' ||
         process.env.DATABASE_URL?.includes('postgres');
}

// Quick health check for ImportSession functionality
async function quickHealthCheck() {
  try {
    log('info', '🔍 Running quick health check for ImportSession...');
    
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    log('info', '✅ Database connection: OK');
    
    // Test ImportSession table access
    const sessionCount = await prisma.importSession.count();
    log('info', `✅ ImportSession table access: OK (${sessionCount} records)`);
    
    // Test ImportSessionDetail table access
    const detailCount = await prisma.importSessionDetail.count();
    log('info', `✅ ImportSessionDetail table access: OK (${detailCount} records)`);
    
    log('info', '✅ All health checks passed');
    return true;
  } catch (error) {
    log('error', '❌ Health check failed:', error.message);
    return false;
  }
}

// Ensure required directories exist in Choreo
async function ensureChoreoDirectories() {
  try {
    const directories = [
      '/tmp/lumo-import',
      '/tmp/lumo-logs',
      process.env.CHOREO_TEMP_DIR || '/tmp/lumo-temp',
    ];
    
    for (const dir of directories) {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          log('info', `✅ Created directory: ${dir}`);
        }
      } catch (dirError) {
        log('warn', `⚠️ Could not create directory ${dir}:`, dirError.message);
      }
    }
    
    return true;
  } catch (error) {
    log('error', '❌ Failed to create directories:', error.message);
    return false;
  }
}

// Set up environment variables for Choreo
function setupChoreoEnvironment() {
  try {
    // Set default values for missing environment variables
    const defaults = {
      'LUMO_IMPORT_MAX_FILE_SIZE': '10485760', // 10MB
      'LUMO_IMPORT_BATCH_SIZE': '100',
      'LUMO_IMPORT_TIMEOUT': '300000', // 5 minutes
      'LUMO_LOG_LEVEL': 'info',
    };
    
    for (const [key, value] of Object.entries(defaults)) {
      if (!process.env[key]) {
        process.env[key] = value;
        log('info', `✅ Set environment variable: ${key}=${value}`);
      }
    }
    
    return true;
  } catch (error) {
    log('error', '❌ Failed to setup environment:', error.message);
    return false;
  }
}

// Main startup function
async function main() {
  try {
    log('info', '🚀 Starting Choreo Excel Importer Startup Fix');
    log('info', `Environment: ${isChoreoEnvironment() ? 'Choreo/Production' : 'Development'}`);
    log('info', `Database URL: ${process.env.DATABASE_URL ? 'Configured' : 'Missing'}`);
    
    // Only run in Choreo environment
    if (!isChoreoEnvironment()) {
      log('info', '⏭️ Not in Choreo environment, skipping startup fix');
      process.exit(0);
    }
    
    // Step 1: Setup environment
    log('info', '⚙️ Setting up Choreo environment...');
    setupChoreoEnvironment();
    
    // Step 2: Create directories
    log('info', '📁 Creating required directories...');
    await ensureChoreoDirectories();
    
    // Step 3: Health check
    log('info', '🔍 Running health checks...');
    const healthOk = await quickHealthCheck();
    
    if (healthOk) {
      log('info', '✅ Choreo Excel Importer startup fix completed successfully');
      log('info', '📊 Excel importer is ready for production use');
      
      // Create a marker file to indicate successful startup
      try {
        const markerPath = '/tmp/lumo-import-ready';
        fs.writeFileSync(markerPath, JSON.stringify({
          timestamp: new Date().toISOString(),
          status: 'ready',
          version: process.env.npm_package_version || 'unknown'
        }));
        log('info', `✅ Created ready marker: ${markerPath}`);
      } catch (markerError) {
        log('warn', '⚠️ Could not create ready marker:', markerError.message);
      }
      
      process.exit(0);
    } else {
      log('error', '❌ Health checks failed - Excel importer may not work correctly');
      process.exit(1);
    }
    
  } catch (error) {
    log('error', '💥 Critical error during startup fix:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle process termination gracefully
process.on('SIGINT', async () => {
  log('info', 'Received SIGINT, cleaning up...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  log('info', 'Received SIGTERM, cleaning up...');
  await prisma.$disconnect();
  process.exit(0);
});

// Run with timeout to prevent hanging
const timeout = setTimeout(() => {
  log('error', '⏰ Startup fix timed out after 30 seconds');
  process.exit(1);
}, 30000);

// Run the main function
main().catch(async (error) => {
  log('error', 'Unhandled error:', error);
  await prisma.$disconnect();
  process.exit(1);
}).finally(() => {
  clearTimeout(timeout);
}); 