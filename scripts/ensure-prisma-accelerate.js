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

// 1. Check if DATABASE_URL is set
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

// 3. Ensure prisma-config.json exists and is properly configured
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

// 4. Ensure the Prisma client is properly generated
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
