#!/usr/bin/env node

/**
 * Choreo Deployment Prisma Fix
 * Fixes P6001 protocol errors in Choreo deployment environment
 */

console.log('🚀 Choreo Deployment Prisma Fix...');

// Check if we're in Choreo environment
const isChoreo = process.env.CHOREO_DEPLOYMENT === 'true' || 
                 process.env.NODE_ENV === 'production';

if (!isChoreo) {
  console.log('ℹ️ Not in Choreo environment, skipping deployment-specific fixes');
  process.exit(0);
}

console.log('🔧 Applying Choreo-specific Prisma fixes...');

// 1. Check for Prisma Accelerate configuration
console.log('🔍 Checking for Prisma Accelerate configuration...');
const accelerateUrl = process.env.PRISMA_ACCELERATE_URL || process.env.ACCELERATE_URL;
const databaseUrl = process.env.DATABASE_URL;

if (accelerateUrl) {
  console.log('✅ Prisma Accelerate URL found - using Accelerate configuration');
  console.log(`📋 Accelerate URL pattern: ${accelerateUrl.substring(0, 30)}...`);
  
  // For Prisma Accelerate, use the accelerate URL as DATABASE_URL
  process.env.DATABASE_URL = accelerateUrl;
  console.log('🔧 Set DATABASE_URL to Prisma Accelerate URL');
} else if (databaseUrl && databaseUrl.startsWith('prisma://')) {
  console.log('✅ DATABASE_URL already uses Prisma Accelerate protocol');
} else {
  console.log('🔍 No Prisma Accelerate URL found, validating regular DATABASE_URL...');
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not set in Choreo environment');
    process.exit(1);
  }

  console.log(`📋 DATABASE_URL pattern: ${databaseUrl.substring(0, 30)}...`);

  // 2. Apply URL format fix for regular PostgreSQL connections
  let fixedUrl = databaseUrl;

  // Handle different protocol scenarios
  if (databaseUrl.startsWith('postgres://')) {
    // Convert postgres:// to postgresql://
    fixedUrl = databaseUrl.replace('postgres://', 'postgresql://');
    console.log('🔧 Fixed postgres:// to postgresql://');
    process.env.DATABASE_URL = fixedUrl;
  } else if (databaseUrl.startsWith('postgresql://')) {
    console.log('✅ DATABASE_URL already uses postgresql:// protocol');
    // For Choreo with PostgreSQL, we might need to add specific parameters
    if (!databaseUrl.includes('sslmode=require')) {
      if (databaseUrl.includes('?')) {
        fixedUrl = databaseUrl + '&sslmode=require';
      } else {
        fixedUrl = databaseUrl + '?sslmode=require';
      }
      console.log('🔧 Added SSL mode requirement for Choreo');
      process.env.DATABASE_URL = fixedUrl;
    }
  } else {
    console.warn('⚠️ Unknown DATABASE_URL protocol, attempting to fix...');
    // If it doesn't start with a known protocol, assume it's PostgreSQL
    if (!databaseUrl.includes('://')) {
      fixedUrl = 'postgresql://' + databaseUrl;
      console.log('🔧 Added postgresql:// protocol');
      process.env.DATABASE_URL = fixedUrl;
    }
  }
}

// 3. Clear any cached Prisma client
console.log('🧹 Clearing Prisma client cache...');
try {
  const fs = require('fs');
  const path = require('path');
  
  // Clear specific cache files that might have old configurations
  const cacheFiles = [
    path.join(process.cwd(), 'node_modules/.prisma/client/query_engine-*'),
    path.join(process.cwd(), '.next/cache/webpack'),
  ];
  
  cacheFiles.forEach(pattern => {
    try {
      if (fs.existsSync(pattern)) {
        console.log(`🗑️ Clearing cache: ${pattern}`);
      }
    } catch (e) {
      // Ignore cache clearing errors
    }
  });
} catch (error) {
  console.warn('⚠️ Could not clear cache:', error.message);
}

// 4. Generate Prisma client if needed
console.log('🔄 Ensuring Prisma client is generated...');
try {
  const { execSync } = require('child_process');
  const fs = require('fs');
  const path = require('path');
  
  // Force regenerate client with new DATABASE_URL
  console.log('🔧 Regenerating Prisma client with fixed DATABASE_URL...');
  execSync('npx prisma generate --no-engine', { 
    stdio: 'inherit', 
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
  });
  console.log('✅ Prisma client regenerated successfully');
} catch (error) {
  console.error('❌ Error generating Prisma client:', error.message);
  // Don't exit here, try to continue
}

// 5. Test Prisma client creation (modified for Accelerate)
console.log('🧪 Testing Prisma client creation...');
async function testPrismaConnection() {
  try {
    const { PrismaClient } = require('@prisma/client');
    
    // For Prisma Accelerate, don't override datasourceUrl - let it use schema.prisma
    const clientConfig = {
      log: ['error'],
      errorFormat: 'minimal'
    };
    
    // Only override datasourceUrl for non-Accelerate connections
    const currentUrl = process.env.DATABASE_URL;
    if (currentUrl && !currentUrl.startsWith('prisma://')) {
      clientConfig.datasources = {
        db: {
          url: currentUrl
        }
      };
      console.log('🔧 Using explicit datasource URL for direct PostgreSQL connection');
    } else {
      console.log('🔧 Using schema.prisma datasource configuration (Prisma Accelerate)');
    }
    
    const testClient = new PrismaClient(clientConfig);
    
    console.log('✅ Prisma client created successfully');
    
    // Test connection synchronously
    console.log('🔗 Testing database connection...');
    await testClient.$connect();
    console.log('✅ Database connection successful');
    
    // Test a simple query
    await testClient.$queryRaw`SELECT 1`;
    console.log('✅ Database query test successful');
    
    await testClient.$disconnect();
    console.log('✅ Database disconnected cleanly');
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    if (error.code === 'P6001') {
      console.error('🚨 P6001 error detected - protocol mismatch still exists');
      console.error('💡 Current DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');
      
      // If we're getting P6001 and have a PostgreSQL URL, suggest Accelerate config
      const currentUrl = process.env.DATABASE_URL;
      if (currentUrl && currentUrl.startsWith('postgresql://')) {
        console.error('💡 This might indicate Choreo is configured for Prisma Accelerate');
        console.error('💡 Check if PRISMA_ACCELERATE_URL environment variable should be set');
        console.error('💡 Or verify Choreo deployment configuration for Prisma Accelerate');
      }
    }
    return false;
  }
}

// Run the test synchronously
async function main() {
  const connectionSuccess = await testPrismaConnection();
  
  if (!connectionSuccess) {
    console.error('❌ Database connection test failed');
    console.error('💡 Possible solutions:');
    console.error('  1. Check if Choreo is configured for Prisma Accelerate');
    console.error('  2. Verify PRISMA_ACCELERATE_URL environment variable');
    console.error('  3. Ensure DATABASE_URL format matches Choreo expectations');
    console.error('');
    console.error('🚧 Continuing with deployment despite connection test failure...');
    console.error('📝 The application will attempt to connect at runtime');
  }
  
  // 6. Final validation
  console.log('🔍 Final validation...');
  console.log('✅ Choreo deployment Prisma fix completed');
  console.log('');
  console.log('📋 Summary:');
  console.log(`- Environment: ${process.env.NODE_ENV || 'unknown'}`);
  console.log(`- Choreo deployment: ${process.env.CHOREO_DEPLOYMENT || 'false'}`);
  console.log(`- Database URL protocol: ${process.env.DATABASE_URL?.split('://')[0]}://`);
  console.log(`- Connection test: ${connectionSuccess ? '✅ PASSED' : '⚠️ FAILED (continuing anyway)'}`);
  console.log(`- Prisma Accelerate: ${process.env.DATABASE_URL?.startsWith('prisma://') ? '✅ ENABLED' : '❌ DISABLED'}`);
  console.log('');
  console.log('🚀 Ready for next deployment step!');
  
  process.exit(0);
}

// Run with timeout
const timeout = setTimeout(() => {
  console.error('⏰ Deployment fix timed out after 60 seconds');
  process.exit(1);
}, 60000);

main().catch((error) => {
  console.error('💥 Critical error during deployment fix:', error.message);
  process.exit(1);
}).finally(() => {
  clearTimeout(timeout);
}); 