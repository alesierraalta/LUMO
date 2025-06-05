#!/usr/bin/env node

/**
 * Prisma Configuration Validation Script
 * Validates DATABASE_URL format and Prisma client configuration
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Prisma configuration...');

// Check environment variables
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

console.log(`📋 DATABASE_URL pattern: ${databaseUrl.substring(0, 30)}...`);

// Validate URL format
const validateDatabaseUrl = (url) => {
  // Prisma Accelerate/Data Platform
  if (url.startsWith('prisma://') || url.includes('accelerate.prisma-data.net')) {
    console.log('✅ Prisma Accelerate/Data Platform URL detected');
    return { valid: true, type: 'accelerate' };
  }
  
  // Direct PostgreSQL
  if (url.startsWith('postgresql://') || url.startsWith('postgres://')) {
    console.log('✅ Direct PostgreSQL URL detected');
    return { valid: true, type: 'postgresql' };
  }
  
  // SQLite
  if (url.startsWith('file:')) {
    console.log('✅ SQLite URL detected');
    return { valid: true, type: 'sqlite' };
  }
  
  console.error(`❌ Unsupported DATABASE_URL format: ${url.substring(0, 20)}...`);
  return { valid: false, type: 'unknown' };
};

const urlValidation = validateDatabaseUrl(databaseUrl);

if (!urlValidation.valid) {
  console.error('❌ Invalid DATABASE_URL format');
  process.exit(1);
}

// Check Prisma schema
const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');

if (!fs.existsSync(schemaPath)) {
  console.error('❌ Prisma schema file not found:', schemaPath);
  process.exit(1);
}

const schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Validate datasource configuration
const datasourceMatch = schemaContent.match(/datasource\s+db\s*\{[\s\S]*?\}/);

if (!datasourceMatch) {
  console.error('❌ No datasource block found in schema.prisma');
  process.exit(1);
}

const datasourceBlock = datasourceMatch[0];
console.log('📝 Found datasource configuration');

// Check provider matches URL type
const providerMatch = datasourceBlock.match(/provider\s*=\s*"([^"]+)"/);

if (!providerMatch) {
  console.error('❌ No provider specified in datasource');
  process.exit(1);
}

const provider = providerMatch[1];
console.log(`📋 Schema provider: ${provider}`);

// Validate provider matches URL
const validateProviderMatch = (urlType, schemaProvider) => {
  if (urlType === 'accelerate' && schemaProvider === 'postgresql') {
    return true; // Prisma Accelerate uses postgresql provider
  }
  
  if (urlType === 'postgresql' && schemaProvider === 'postgresql') {
    return true;
  }
  
  if (urlType === 'sqlite' && schemaProvider === 'sqlite') {
    return true;
  }
  
  return false;
};

if (!validateProviderMatch(urlValidation.type, provider)) {
  console.error(`❌ Provider mismatch: URL type '${urlValidation.type}' doesn't match schema provider '${provider}'`);
  process.exit(1);
}

console.log('✅ Provider matches URL type');

// Test Prisma client creation
try {
  const { PrismaClient } = require('@prisma/client');
  
  const testClient = new PrismaClient({
    log: ['error'],
    // Don't set datasourceUrl to use schema.prisma configuration
  });
  
  console.log('✅ Prisma client created successfully');
  
  // Clean up
  testClient.$disconnect().catch(() => {});
  
} catch (error) {
  console.error('❌ Failed to create Prisma client:', error.message);
  process.exit(1);
}

console.log('🎉 Prisma configuration validation passed!'); 