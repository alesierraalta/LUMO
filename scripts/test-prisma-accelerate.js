#!/usr/bin/env node

/**
 * Test Prisma Accelerate Configuration
 * 
 * This script verifies that Prisma Accelerate is properly configured
 * and can connect to the database.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Prisma Accelerate configuration...');

// 1. Check if DATABASE_URL is set
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

console.log(`📊 DATABASE_URL: ${dbUrl}`);

// 2. Check if the URL is in the correct format for Prisma Accelerate
if (!dbUrl.startsWith('prisma://') && !dbUrl.startsWith('prisma+postgres://')) {
  console.error('❌ DATABASE_URL must start with prisma:// or prisma+postgres:// for Prisma Accelerate');
  process.exit(1);
}

// 3. Check if prisma-config.json exists and has the correct configuration
const configPath = path.join(process.cwd(), 'prisma-config.json');
if (!fs.existsSync(configPath)) {
  console.error('❌ prisma-config.json not found');
  process.exit(1);
}

let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
  console.error('❌ Error reading prisma-config.json:', error.message);
  process.exit(1);
}

// 4. Verify the connection type is set to prisma-accelerate
if (config.connectionType !== 'prisma-accelerate') {
  console.error('❌ connectionType in prisma-config.json must be set to "prisma-accelerate"');
  process.exit(1);
}

console.log('✅ Prisma Accelerate configuration is valid');

// 5. Test the database connection
async function testConnection() {
  console.log('🔌 Testing database connection...');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl
      }
    },
    log: ['error', 'warn']
  });

  try {
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful:', result);
    
    // Get database version
    const version = await prisma.$queryRaw`SELECT version()`;
    console.log('📊 Database version:', version[0].version);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    // Provide helpful error messages for common issues
    if (error.code === 'P1001') {
      console.error('\n🔧 Troubleshooting:');
      console.error('1. Check if the database server is running');
      console.error('2. Verify the DATABASE_URL is correct and accessible');
      console.error('3. If using Prisma Accelerate, ensure your API key is valid');
      console.error('4. Check network connectivity to the database server');
    } else if (error.code === 'P1012') {
      console.error('\n🔧 Troubleshooting:');
      console.error('1. Run `npx prisma generate` to generate the Prisma Client');
      console.error('2. Ensure your Prisma schema is valid');
    }
    
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
(async () => {
  const success = await testConnection();
  process.exit(success ? 0 : 1);
})();
