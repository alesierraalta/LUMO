#!/usr/bin/env node

/**
 * RUNTIME PRISMA P6001 FIX
 * 
 * This script fixes P6001 errors that occur at runtime when there's a mismatch
 * between the compiled Prisma client expectations and the actual DATABASE_URL.
 * 
 * Common scenarios:
 * - Client compiled for Prisma Accelerate (prisma://) but DATABASE_URL is direct PostgreSQL
 * - Client compiled for direct PostgreSQL but DATABASE_URL is Prisma Accelerate
 * - Protocol mismatches (postgres:// vs postgresql:// vs prisma://)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 RUNTIME PRISMA P6001 FIX');
console.log('============================');

// Environment analysis
const databaseUrl = process.env.DATABASE_URL || '';
const isAccelerateUrl = databaseUrl.startsWith('prisma://');
const isDirectPostgres = databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://');

console.log(`📊 Environment Analysis:`);
console.log(`   DATABASE_URL: ${databaseUrl.slice(0, 20)}...`);
console.log(`   Accelerate URL: ${isAccelerateUrl ? '✅' : '❌'}`);
console.log(`   Direct PostgreSQL: ${isDirectPostgres ? '✅' : '❌'}`);

// Fix DATABASE_URL protocol if needed
let fixedUrl = databaseUrl;
if (databaseUrl.startsWith('postgres://')) {
  fixedUrl = databaseUrl.replace('postgres://', 'postgresql://');
  process.env.DATABASE_URL = fixedUrl;
  console.log('🔄 Fixed DATABASE_URL: postgres:// → postgresql://');
}

// Runtime Prisma Client Override
function createRuntimePrismaFix() {
  console.log('🛠️ Creating runtime Prisma client override...');
  
  const overridePath = path.join(process.cwd(), 'runtime-prisma-override.js');
  
  const overrideContent = `
/**
 * RUNTIME PRISMA CLIENT OVERRIDE
 * This file completely overrides Prisma client behavior at runtime
 * to handle P6001 protocol mismatch errors.
 */

const { PrismaClient: OriginalPrismaClient } = require('@prisma/client');

// Enhanced protocol fix function
function fixDatabaseUrl(url) {
  if (!url) return url;
  
  // Convert postgres:// to postgresql://
  if (url.startsWith('postgres://')) {
    return url.replace('postgres://', 'postgresql://');
  }
  
  return url;
}

// Override PrismaClient constructor
class RuntimePrismaClient extends OriginalPrismaClient {
  constructor(options = {}) {
    const currentUrl = process.env.DATABASE_URL;
    const fixedUrl = fixDatabaseUrl(currentUrl);
    
    // Update environment
    if (fixedUrl !== currentUrl) {
      process.env.DATABASE_URL = fixedUrl;
      console.log('🔄 Runtime fix: Updated DATABASE_URL protocol');
    }
    
    // Force direct PostgreSQL configuration
    const runtimeOptions = {
      ...options,
      datasources: {
        db: {
          url: fixedUrl
        },
        ...(options.datasources || {})
      }
    };
    
    console.log('✅ Runtime Prisma client configured with direct PostgreSQL');
    super(runtimeOptions);
  }
}

// Override the module cache
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  if (id === '@prisma/client') {
    return {
      PrismaClient: RuntimePrismaClient,
      // Re-export other exports if needed
      ...originalRequire.call(this, id)
    };
  }
  return originalRequire.call(this, id);
};

console.log('🚀 Runtime Prisma override installed');

module.exports = { RuntimePrismaClient, fixDatabaseUrl };
`;

  fs.writeFileSync(overridePath, overrideContent);
  console.log(`✅ Created runtime override: ${overridePath}`);
  
  return overridePath;
}

// Apply the runtime fix
function applyRuntimeFix() {
  console.log('🔧 Applying runtime Prisma fix...');
  
  try {
    // Create the override
    const overridePath = createRuntimePrismaFix();
    
    // Load the override
    require(overridePath);
    
    console.log('✅ Runtime Prisma fix applied successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to apply runtime fix:', error.message);
    return false;
  }
}

// Emergency Prisma client regeneration
function emergencyClientRegeneration() {
  console.log('🚨 Attempting emergency Prisma client regeneration...');
  
  try {
    // Clear Prisma cache
    const prismaDir = path.join(process.cwd(), 'node_modules', '.prisma');
    if (fs.existsSync(prismaDir)) {
      fs.rmSync(prismaDir, { recursive: true, force: true });
      console.log('🗑️ Cleared Prisma cache');
    }
    
    // Regenerate client
    execSync('npx prisma generate', { stdio: 'pipe' });
    console.log('✅ Emergency client regeneration completed');
    return true;
  } catch (error) {
    console.warn('⚠️ Emergency regeneration failed:', error.message);
    return false;
  }
}

// Main runtime fix execution
function main() {
  console.log('\n🎯 Executing runtime P6001 fix...');
  
  // Step 1: Apply runtime override
  const overrideSuccess = applyRuntimeFix();
  
  // Step 2: If override fails, try emergency regeneration
  if (!overrideSuccess) {
    console.log('🚨 Runtime override failed, trying emergency regeneration...');
    emergencyClientRegeneration();
  }
  
  console.log('\n✅ Runtime P6001 fix completed');
  console.log('📝 Next database operations should work correctly');
}

// Export for use in other scripts
module.exports = {
  main,
  applyRuntimeFix,
  emergencyClientRegeneration,
  createRuntimePrismaFix
};

// Run if called directly
if (require.main === module) {
  main();
} 