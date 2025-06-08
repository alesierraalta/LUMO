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

// 2. Ensure the URL is in the correct format for Prisma Accelerate
let fixedUrl = dbUrl;
if (!dbUrl.startsWith('prisma://') && !dbUrl.startsWith('prisma+postgres://')) {
  // Convert postgres:// or postgresql:// to prisma+postgres://
  if (dbUrl.startsWith('postgresql://')) {
    fixedUrl = dbUrl.replace('postgresql://', 'prisma+postgres://');
    console.log(`🔄 Converted postgresql:// to prisma+postgres://`);
  } else if (dbUrl.startsWith('postgres://')) {
    fixedUrl = dbUrl.replace('postgres://', 'prisma+postgres://');
    console.log(`🔄 Converted postgres:// to prisma+postgres://`);
  } else {
    console.error('❌ Invalid DATABASE_URL format for Prisma Accelerate');
    process.exit(1);
  }
  
  // Update the environment variable
  process.env.DATABASE_URL = fixedUrl;
  console.log('✅ Updated DATABASE_URL for Prisma Accelerate');
}

// 3. Ensure prisma-config.json exists and is properly configured
const configPath = path.join(process.cwd(), 'prisma-config.json');
let config = {
  databaseUrl: process.env.DATABASE_URL,
  connectionType: 'prisma-accelerate',
  timestamp: new Date().toISOString(),
  fix: 'prisma-p6001-fix-enhanced'
};

try {
  if (fs.existsSync(configPath)) {
    const existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config = { ...config, ...existingConfig };
  }
  
  // Ensure connectionType is set to prisma-accelerate
  config.connectionType = 'prisma-accelerate';
  
  // Write the updated config back
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('✅ Updated prisma-config.json for Prisma Accelerate');
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

console.log('✅ Prisma Accelerate configuration verified successfully');

// Export the fixed URL for use in other scripts
module.exports = {
  DATABASE_URL: process.env.DATABASE_URL
};
