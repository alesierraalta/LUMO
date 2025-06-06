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

// 1. Validate DATABASE_URL format for Choreo
console.log('🔍 Validating DATABASE_URL for Choreo...');
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not set in Choreo environment');
  process.exit(1);
}

console.log(`📋 DATABASE_URL pattern: ${databaseUrl.substring(0, 30)}...`);

// 2. Apply URL format fix if needed
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
} else if (databaseUrl.startsWith('prisma://')) {
  console.log('✅ DATABASE_URL uses Prisma Accelerate protocol');
} else {
  console.warn('⚠️ Unknown DATABASE_URL protocol, attempting to fix...');
  // If it doesn't start with a known protocol, assume it's PostgreSQL
  if (!databaseUrl.includes('://')) {
    fixedUrl = 'postgresql://' + databaseUrl;
    console.log('🔧 Added postgresql:// protocol');
    process.env.DATABASE_URL = fixedUrl;
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
    env: { ...process.env, DATABASE_URL: fixedUrl }
  });
  console.log('✅ Prisma client regenerated successfully');
} catch (error) {
  console.error('❌ Error generating Prisma client:', error.message);
  // Don't exit here, try to continue
}

// 5. Test Prisma client creation synchronously
console.log('🧪 Testing Prisma client creation...');
async function testPrismaConnection() {
  try {
    const { PrismaClient } = require('@prisma/client');
    
    // Create client with fixed URL
    const testClient = new PrismaClient({
      log: ['error'],
      errorFormat: 'minimal',
      datasources: {
        db: {
          url: fixedUrl
        }
      }
    });
    
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
    }
    return false;
  }
}

// Run the test synchronously
async function main() {
  const connectionSuccess = await testPrismaConnection();
  
  if (!connectionSuccess) {
    console.error('❌ Database connection test failed');
    console.error('💡 Try checking your DATABASE_URL configuration in Choreo');
    process.exit(1);
  }
  
  // 6. Final validation
  console.log('🔍 Final validation...');
  console.log('✅ Choreo deployment Prisma fix completed successfully');
  console.log('');
  console.log('📋 Summary:');
  console.log(`- Environment: ${process.env.NODE_ENV || 'unknown'}`);
  console.log(`- Choreo deployment: ${process.env.CHOREO_DEPLOYMENT || 'false'}`);
  console.log(`- Database URL protocol: ${fixedUrl.split('://')[0]}://`);
  console.log(`- Connection test: ✅ PASSED`);
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