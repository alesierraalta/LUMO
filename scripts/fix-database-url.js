#!/usr/bin/env node

/**
 * DATABASE_URL Format Fix Script
 * 
 * This script detects and fixes the DATABASE_URL format if it's incorrectly using
 * prisma:// instead of postgresql:// as required by Prisma.
 */

console.log('🔄 Starting DATABASE_URL format check and repair...');

// Get the current DATABASE_URL
const currentDbUrl = process.env.DATABASE_URL || '';

if (!currentDbUrl) {
  console.error('❌ DATABASE_URL environment variable is not defined');
  process.exit(1);
}

console.log(`🔍 Checking DATABASE_URL format: ${currentDbUrl.substring(0, 15)}...`);

// Check if the URL starts with prisma:// instead of postgresql://
if (currentDbUrl.startsWith('prisma://')) {
  console.log('⚠️ Found incorrect protocol: prisma://');
  
  try {
    // Create the corrected URL by replacing the protocol
    const correctedDbUrl = currentDbUrl.replace(/^prisma:\/\//, 'postgresql://');
    
    // Set the corrected URL in the environment
    process.env.DATABASE_URL = correctedDbUrl;
    
    console.log(`✅ Protocol corrected: ${correctedDbUrl.substring(0, 15)}...`);
    
    // For debugging purposes in the logs
    console.log('🔄 Original URL parts:');
    const urlParts = new URL(currentDbUrl);
    console.log(`  - Protocol: ${urlParts.protocol}`);
    console.log(`  - Host: ${urlParts.host}`);
    console.log(`  - Path: ${urlParts.pathname}`);
    
    console.log('🔄 Corrected URL parts:');
    const correctedParts = new URL(correctedDbUrl);
    console.log(`  - Protocol: ${correctedParts.protocol}`);
    console.log(`  - Host: ${correctedParts.host}`);
    console.log(`  - Path: ${correctedParts.pathname}`);
    
    // Write this to a file so it can be used by other scripts
    const fs = require('fs');
    const path = require('path');
    
    const tempFile = path.join(process.cwd(), 'logs', 'database-url-fix.json');
    
    // Create logs directory if it doesn't exist
    const logsDir = path.dirname(tempFile);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    fs.writeFileSync(tempFile, JSON.stringify({
      original: currentDbUrl,
      corrected: correctedDbUrl,
      timestamp: new Date().toISOString()
    }));
    
    console.log(`✅ Correction saved to ${tempFile}`);
    
    // Export the corrected URL explicitly for child processes
    console.log('DATABASE_URL=' + correctedDbUrl);
    
    // Exit with success
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error fixing DATABASE_URL: ${error.message}`);
    process.exit(1);
  }
} else if (currentDbUrl.startsWith('postgresql://')) {
  console.log('✅ DATABASE_URL format is correct (postgresql://)');
} else {
  console.log(`⚠️ DATABASE_URL doesn't use expected protocol. Found: ${currentDbUrl.split('://')[0]}://`);
  console.log('ℹ️ Expected format: postgresql://username:password@host:port/database');
}

// If we reach here, no changes were needed
process.exit(0); 