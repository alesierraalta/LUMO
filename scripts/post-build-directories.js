#!/usr/bin/env node

/**
 * Post-Build Directory Creation Script
 * 
 * Ensures all required directories exist in the standalone build output.
 * This was moved from next.config.js to fix the invalid onPostBuild property.
 */

const fs = require('fs');
const path = require('path');

function createRequiredDirectories() {
  try {
    console.log('🏗️ Creating required directories for standalone build...');
    
    // Paths that need to exist in the standalone build
    const requiredPaths = [
      '.next/standalone/.next/server/app/api/inventory/import/process/dict',
      '.next/standalone/.next/static/css',
      '.next/standalone/.next/static/chunks',
      '.next/standalone/public',
      // Additional Choreo-specific paths
      '.next/server/app/api/inventory/import/process/dict',
      'temp/import',
      'uploads/import'
    ];
    
    let created = 0;
    
    // Create directories if they don't exist
    requiredPaths.forEach(dirPath => {
      const fullPath = path.join(process.cwd(), dirPath);
      if (!fs.existsSync(fullPath)) {
        console.log(`📁 Creating missing directory: ${dirPath}`);
        fs.mkdirSync(fullPath, { recursive: true });
        created++;
      } else {
        console.log(`✅ Directory exists: ${dirPath}`);
      }
    });
    
    console.log(`✅ Post-build directory creation completed (${created} directories created)`);
    return true;
  } catch (error) {
    console.error('❌ Error in post-build directory creation:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  const success = createRequiredDirectories();
  process.exit(success ? 0 : 1);
}

module.exports = { createRequiredDirectories };
