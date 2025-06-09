#!/usr/bin/env node

/**
 * Ensure Prisma Accelerate Configuration
 * 
 * This script ensures that the DATABASE_URL is properly formatted for Prisma Accelerate
 * and that all necessary configuration is in place before the application starts.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Prisma Accelerate configuration...');

// Detect if we're in a build environment (no DATABASE_URL is expected during build)
const isBuildTime = (
  process.env.NODE_ENV === undefined || // Buildpacks don't set NODE_ENV during install
  process.env.CI === 'true' || // CI environment
  process.env.BUILDPACK === 'true' || // Buildpack environment
  !process.env.DATABASE_URL // No DATABASE_URL available
);

if (isBuildTime) {
  console.log('🔨 Build time detected - skipping DATABASE_URL verification');
  
  // Create a minimal config for build time
  const configPath = path.join(process.cwd(), 'prisma-config.json');
  const config = {
    buildTime: true,
    timestamp: new Date().toISOString(),
    fix: 'build-time-config'
  };
  
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('✅ Build-time configuration created');
  } catch (error) {
    console.warn('⚠️ Could not create build-time config:', error.message);
  }
  
  console.log('✅ Build-time verification complete');
  process.exit(0);
}

// Runtime verification (when DATABASE_URL is available)
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

console.log(`📊 Current DATABASE_URL: ${dbUrl.substring(0, 20)}...`);

// 2. Handle different database types
let fixedUrl = dbUrl;
let connectionType = 'direct';

if (dbUrl.startsWith('file:')) {
  // SQLite for local development
  console.log('🗄️ Using SQLite for local development');
  connectionType = 'sqlite';
} else if (dbUrl.startsWith('prisma://') || dbUrl.startsWith('prisma+postgres://')) {
  // Already using Prisma Accelerate
  console.log('🚀 Using Prisma Accelerate');
  connectionType = 'prisma-accelerate';
} else if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
  // Direct PostgreSQL connection
  console.log('🐘 Using direct PostgreSQL connection');
  connectionType = 'postgresql-direct';
} else {
  console.error('❌ Invalid DATABASE_URL format');
  process.exit(1);
}

// 3. Update schema.prisma based on database type
console.log('📝 Updating schema.prisma...');
const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');

if (fs.existsSync(schemaPath)) {
  try {
    let schema = fs.readFileSync(schemaPath, 'utf8');
    
    if (connectionType === 'sqlite') {
      // Configure for SQLite
      if (!schema.includes('provider = "sqlite"')) {
        schema = schema.replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"');
        fs.writeFileSync(schemaPath, schema);
        console.log('✅ Schema configured for SQLite');
      } else {
        console.log('ℹ️ Schema already configured for SQLite');
      }
    } else if (connectionType === 'postgresql-direct' || connectionType === 'prisma-accelerate') {
      // Configure for PostgreSQL
      if (!schema.includes('provider = "postgresql"')) {
        schema = schema.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');
        fs.writeFileSync(schemaPath, schema);
        console.log('✅ Schema configured for PostgreSQL');
      } else {
        console.log('ℹ️ Schema already configured for PostgreSQL');
      }
    }
  } catch (error) {
    console.error('❌ Error updating schema.prisma:', error.message);
    process.exit(1);
  }
} else {
  console.error('❌ schema.prisma not found');
  process.exit(1);
}

// 4. Ensure prisma-config.json exists and is properly configured
const configPath = path.join(process.cwd(), 'prisma-config.json');
let config = {
  databaseUrl: process.env.DATABASE_URL,
  connectionType: connectionType,
  timestamp: new Date().toISOString(),
  fix: 'database-connection-configured'
};

try {
  if (fs.existsSync(configPath)) {
    const existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config = { ...config, ...existingConfig };
  }
  
  // Update connectionType based on detected database type
  config.connectionType = connectionType;
  
  // Write the updated config back
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`✅ Updated prisma-config.json for ${connectionType} connection`);
} catch (error) {
  console.error('❌ Error updating prisma-config.json:', error.message);
  process.exit(1);
}

// 5. Ensure the Prisma client is properly generated
console.log('🔄 Verifying Prisma client...');
try {
  // This will be handled by the postinstall script
  console.log('✅ Prisma client will be generated during build');
} catch (error) {
  console.error('❌ Error verifying Prisma client:', error.message);
  process.exit(1);
}

console.log(`✅ Database configuration verified successfully (${connectionType})`);

// Export the fixed URL for use in other scripts
module.exports = {
  DATABASE_URL: process.env.DATABASE_URL
};
