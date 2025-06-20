#!/usr/bin/env node

/**
 * Choreo Runtime Setup Script
 * 
 * Creates required directories at runtime in the Choreo container environment.
 * This script should run before the application starts.
 */

const fs = require('fs');
const path = require('path');

function createRuntimeDirectories() {
  try {
    console.log('🚀 [Choreo Runtime Setup] Creating required directories...');
    
    // Get the working directory - in Choreo it's usually /workspace
    const workspaceDir = process.cwd();
    console.log(`📂 Working directory: ${workspaceDir}`);
    
    // Paths that need to exist at runtime
    const runtimePaths = [
      // Dictionary directory for import processing
      '.next/server/app/api/inventory/import/process/dict',
      '.next/standalone/.next/server/app/api/inventory/import/process/dict',
      // Temporary directories
      'temp/import',
      'uploads/import',
      // Static directories that might be missing
      '.next/static/css',
      '.next/static/chunks',
      'public'
    ];
    
    let created = 0;
    let existing = 0;
    
    // Create directories if they don't exist
    runtimePaths.forEach(dirPath => {
      const fullPath = path.join(workspaceDir, dirPath);
      try {
        if (!fs.existsSync(fullPath)) {
          console.log(`📁 Creating: ${dirPath}`);
          fs.mkdirSync(fullPath, { recursive: true });
          created++;
        } else {
          console.log(`✅ Exists: ${dirPath}`);
          existing++;
        }
      } catch (error) {
        console.error(`❌ Failed to create ${dirPath}:`, error.message);
      }
    });
    
    console.log(`✅ [Choreo Runtime Setup] Completed: ${created} created, ${existing} existed`);
    return true;
  } catch (error) {
    console.error('❌ [Choreo Runtime Setup] Error:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  const success = createRuntimeDirectories();
  process.exit(success ? 0 : 1);
}

module.exports = { createRuntimeDirectories }; 