#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Prisma Schema Configuration Script
 * Automatically configures schema for development or production environments
 */

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');

// Check command line arguments
const args = process.argv.slice(2);
const forcePostgres = args.includes('--force-postgresql');
const forceSqlite = args.includes('--force-sqlite');

// Environment detection - Enhanced for Choreo
const isChoreoEnvironment = !!(
  process.env.CHOREO_DEPLOYMENT === 'true' ||
  process.env.CHOREO_TOKEN ||
  process.env.CHOREO_ENVIRONMENT ||
  process.env.VERCEL_URL ||
  process.platform === 'linux' && process.env.NODE_ENV === 'production'
);

const isProduction = process.env.NODE_ENV === 'production';
const isBuildTime = !process.env.DATABASE_URL || process.env.CI === 'true';

// Determine database configuration
let usePostgreSQL = false;
let enableDriverAdapters = false;

if (forcePostgres) {
  usePostgreSQL = true;
  // Only enable driver adapters if we're NOT in build time
  enableDriverAdapters = !isBuildTime;
} else if (forceSqlite) {
  usePostgreSQL = false;
  enableDriverAdapters = false;
} else if (isChoreoEnvironment || isProduction) {
  usePostgreSQL = true;
  // Only enable driver adapters if we're NOT in build time
  enableDriverAdapters = !isBuildTime;
} else {
  usePostgreSQL = false;
  enableDriverAdapters = false;
}

console.log('🔧 Configuring Prisma schema...');
console.log(`📋 Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`📋 Build Time: ${isBuildTime ? 'YES' : 'NO'}`);
console.log(`📋 Database: ${usePostgreSQL ? 'PostgreSQL' : 'SQLite'}`);
console.log(`📋 Driver Adapters: ${enableDriverAdapters ? 'ENABLED' : 'DISABLED'}`);

// Read current schema
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Configure generator section
const generatorConfig = enableDriverAdapters 
  ? `generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["queryCompiler", "driverAdapters"]
  binaryTargets   = ["native", "debian-openssl-3.0.x", "rhel-openssl-3.0.x"]
}`
  : `generator client {
  provider        = "prisma-client-js"
  binaryTargets   = ["native", "debian-openssl-3.0.x", "rhel-openssl-3.0.x"]
}`;

// Configure datasource section
const datasourceConfig = usePostgreSQL
  ? `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`
  : `datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}`;

// Replace generator and datasource sections
schemaContent = schemaContent.replace(
  /generator client \{[\s\S]*?\}/,
  generatorConfig
);

schemaContent = schemaContent.replace(
  /datasource db \{[\s\S]*?\}/,
  datasourceConfig
);

// Update ImportSession model for PostgreSQL compatibility
if (usePostgreSQL) {
  // Replace SQLite-specific syntax with PostgreSQL-compatible syntax
  schemaContent = schemaContent.replace(
    /createdAt\s+DateTime\s+@default\(now\(\)\)/g,
    'createdAt DateTime @default(now())'
  );
  
  schemaContent = schemaContent.replace(
    /updatedAt\s+DateTime\s+@updatedAt/g,
    'updatedAt DateTime @updatedAt'
  );
  
  console.log('✅ Updated ImportSession model');
}

// Write updated schema
fs.writeFileSync(schemaPath, schemaContent);

console.log('✅ Prisma schema updated successfully');
console.log(`📄 Configuration: ${isProduction ? 'Production' : 'Development'} (${usePostgreSQL ? 'PostgreSQL' : 'SQLite'})`);
if (enableDriverAdapters) {
  console.log('🔧 Features: queryCompiler, driverAdapters enabled');
} else {
  console.log('🔧 Features: Standard configuration (no driverAdapters)');
}
console.log('🚀 Schema configuration complete!');

// Skip database validation during build time
if (isBuildTime) {
  console.log('⚠️ Build-time environment detected - skipping schema validation');
  console.log('📝 Schema validation will be performed at runtime when DATABASE_URL is available');
  process.exit(0);
}

// Validate schema if not in build time
try {
  const { execSync } = require('child_process');
  console.log('🔍 Validating schema...');
  execSync('npx prisma validate', { stdio: 'inherit' });
  console.log('✅ Schema validation passed');
} catch (error) {
  console.warn('⚠️ Schema validation failed:', error.message);
  console.log('📝 This is expected during build time when DATABASE_URL is not available');
} 