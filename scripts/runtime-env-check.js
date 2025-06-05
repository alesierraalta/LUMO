#!/usr/bin/env node

/**
 * Runtime Environment Check for DATABASE_URL Issues
 * Debug script to help identify environment variable problems
 */

console.log('🔍 Runtime Environment Check...');
console.log('📋 Checking DATABASE_URL configuration...');

// Check if DATABASE_URL is set
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL is not set!');
  console.log('📋 Available environment variables:');
  Object.keys(process.env)
    .filter(key => key.includes('DATABASE') || key.includes('DB'))
    .forEach(key => {
      console.log(`  ${key}: ${process.env[key] ? 'SET' : 'NOT_SET'}`);
    });
  process.exit(1);
}

console.log(`✅ DATABASE_URL is set`);
console.log(`📋 URL pattern: ${databaseUrl.substring(0, 50)}...`);

// Check URL format
if (databaseUrl.startsWith('prisma://')) {
  console.log('✅ Using Prisma Postgres protocol');
} else if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
  console.log('✅ Using standard PostgreSQL protocol');
} else if (databaseUrl.startsWith('file:')) {
  console.log('✅ Using SQLite file protocol');
} else {
  console.warn('⚠️ Unknown database protocol');
  console.log(`Protocol: ${databaseUrl.split('://')[0]}`);
}

// Check other critical environment variables
const criticalEnvVars = [
  'NODE_ENV',
  'CHOREO_DEPLOYMENT',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY'
];

console.log('\n📋 Critical environment variables:');
criticalEnvVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`  ${varName}: ${value ? '✅ SET' : '❌ NOT_SET'}`);
  if (value && varName.includes('KEY')) {
    console.log(`    Pattern: ${value.substring(0, 15)}...`);
  } else if (value) {
    console.log(`    Value: ${value}`);
  }
});

console.log('\n✅ Environment check complete');

// Test Prisma client creation
console.log('\n🔧 Testing Prisma client creation...');
try {
  const { PrismaClient } = require('@prisma/client');
  
  const testClient = new PrismaClient({
    log: ['error']
    // Remove datasourceUrl to use schema.prisma configuration
  });
  
  console.log('✅ Prisma client created successfully');
  
  // Clean up
  testClient.$disconnect().catch(() => {});
  
} catch (error) {
  console.error('❌ Failed to create Prisma client:', error.message);
  process.exit(1);
}

console.log('🚀 Runtime environment check passed!'); 