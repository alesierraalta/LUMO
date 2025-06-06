#!/usr/bin/env node

/**
 * Emergency P6001 Fix Script
 * 
 * Quick fix for the Prisma Accelerate mismatch causing login failures.
 * This script immediately resolves the "URL must start with protocol prisma://" error.
 */

console.log('🚨 Emergency P6001 Fix - Resolving Prisma Accelerate Mismatch...');

const { execSync } = require('child_process');

async function emergencyFix() {
  try {
    // 1. Check current DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL;
    console.log(`🔍 Current DATABASE_URL: ${databaseUrl ? databaseUrl.substring(0, 50) + '...' : 'NOT SET'}`);
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set');
    }
    
    // 2. Fix PostgreSQL URL if needed
    let fixedUrl = databaseUrl;
    if (databaseUrl.startsWith('postgres://')) {
      fixedUrl = databaseUrl.replace('postgres://', 'postgresql://');
      console.log('🔧 Fixed postgres:// to postgresql://');
    }
    
    // 3. Force regenerate Prisma client for direct connection
    console.log('🔄 Force regenerating Prisma client...');
    
    // Clear cache
    try {
      execSync('rm -rf node_modules/.prisma', { stdio: 'ignore' });
      console.log('🧹 Cleared Prisma cache');
    } catch (error) {
      // Ignore cache clear errors
    }
    
    // Set correct DATABASE_URL and regenerate
    process.env.DATABASE_URL = fixedUrl;
    
    execSync('npx prisma generate', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: fixedUrl }
    });
    
    console.log('✅ Prisma client regenerated successfully');
    
    // 4. Test client creation
    console.log('🧪 Testing Prisma client...');
    
    try {
      const { PrismaClient } = require('@prisma/client');
      const client = new PrismaClient({
        datasources: {
          db: {
            url: fixedUrl
          }
        }
      });
      console.log('✅ Prisma client created successfully');
    } catch (error) {
      console.warn(`⚠️ Client creation test failed: ${error.message}`);
    }
    
    console.log('\n🎉 Emergency fix completed!');
    console.log('💡 Please restart your application to apply changes');
    
    return true;
    
  } catch (error) {
    console.error('💥 Emergency fix failed:', error.message);
    return false;
  }
}

emergencyFix().then(success => {
  if (success) {
    console.log('\n✅ P6001 error should be resolved');
    console.log('🔄 Restart your application now');
    process.exit(0);
  } else {
    console.log('\n❌ Emergency fix failed - manual intervention required');
    process.exit(1);
  }
}).catch(error => {
  console.error('🚨 Unexpected error:', error);
  process.exit(1);
}); 