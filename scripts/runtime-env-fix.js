#!/usr/bin/env node

/**
 * Runtime Environment Fix for LUMO Inventory
 * Embeds public environment variables into static files for client-side access
 * Updated for custom JWT authentication (no Clerk)
 */

const fs = require('fs');
const path = require('path');

console.log('[RUNTIME-ENV-FIX] 🔧 Starting environment fix for LUMO Inventory...');

// Get public environment variables that are safe for client-side
function getPublicEnvVars() {
  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    // Add any other public environment variables here
  };
}

// Check if environment file exists and has required content
function checkEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`[RUNTIME-ENV-FIX] ❌ Environment file not found: ${filePath}`);
    return false;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for our environment marker
    const hasEnvMarker = content.includes('window.__NEXT_ENV__');
    
    console.log(`[RUNTIME-ENV-FIX] Environment file check for ${filePath}:`, {
      exists: true,
      hasEnvMarker,
      size: content.length
    });

    return hasEnvMarker;
  } catch (error) {
    console.error(`[RUNTIME-ENV-FIX] Error reading environment file: ${error.message}`);
    return false;
  }
}

// Generate environment script content
function generateEnvScript() {
  const publicEnvVars = getPublicEnvVars();
  
  console.log('[RUNTIME-ENV-FIX] 📝 Generating environment variables:', {
    NODE_ENV: publicEnvVars.NODE_ENV,
    NEXT_PUBLIC_APP_VERSION: publicEnvVars.NEXT_PUBLIC_APP_VERSION,
  });

  return `
// LUMO Inventory - Runtime Environment Variables
(function() {
  'use strict';
  
  console.log('[LUMO-ENV] Loading runtime environment variables...');
  
  // Environment variables safe for client-side
  window.__NEXT_ENV__ = ${JSON.stringify(publicEnvVars, null, 2)};
  
  // Polyfill process.env for compatibility
  if (typeof window.process === 'undefined') {
    window.process = {};
  }
  if (typeof window.process.env === 'undefined') {
    window.process.env = {};
  }
  
  // Copy public env vars to process.env polyfill
  Object.assign(window.process.env, window.__NEXT_ENV__);
  
  console.log('[LUMO-ENV] ✅ Environment variables loaded successfully');
  console.log('[LUMO-ENV] Available variables:', Object.keys(window.__NEXT_ENV__));
})();
`.trim();
}

// Main environment fixing function
function fixEnvironmentFiles() {
  const envScript = generateEnvScript();
  const envFiles = [
    '.next/static/chunks/runtime-env.js',
    'public/runtime-env.js',
    '.next/server/runtime-env.js'
  ];

  let fixed = 0;
  
  envFiles.forEach(filePath => {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write environment script
      fs.writeFileSync(filePath, envScript, 'utf8');
      console.log(`[RUNTIME-ENV-FIX] ✅ Fixed environment file: ${filePath}`);
      fixed++;
    } catch (error) {
      console.log(`[RUNTIME-ENV-FIX] ⚠️ Could not fix ${filePath}: ${error.message}`);
    }
  });

  return fixed;
}

// Check current environment status
function checkEnvironmentStatus() {
  console.log('\n[RUNTIME-ENV-FIX] 🔍 Environment Status Check:');
  
  const publicEnvVars = getPublicEnvVars();
  const hasRequiredVars = !!(publicEnvVars.NODE_ENV);
  
  console.log('[RUNTIME-ENV-FIX] Environment variables:', {
    NODE_ENV: publicEnvVars.NODE_ENV ? 'SET' : 'MISSING'
  });
  
  if (!hasRequiredVars) {
    console.log('[RUNTIME-ENV-FIX] ⚠️ No environment variables available, cannot fix environment');
    return false;
  }
  
  return true;
}

// Main execution
function main() {
  console.log('[RUNTIME-ENV-FIX] 🚀 LUMO Inventory Runtime Environment Fix');
  console.log('[RUNTIME-ENV-FIX] ===================================');
  
  // Check if we can proceed
  if (!checkEnvironmentStatus()) {
    console.log('[RUNTIME-ENV-FIX] ❌ Environment check failed, exiting...');
    process.exit(1);
  }
  
  // Check existing environment files
  console.log('\n[RUNTIME-ENV-FIX] 📁 Checking existing environment files...');
  const envFiles = [
    '.next/static/chunks/runtime-env.js',
    'public/runtime-env.js'
  ];
  
  let needsFix = false;
  envFiles.forEach(file => {
    if (!checkEnvFile(file)) {
      needsFix = true;
    }
  });
  
  if (needsFix) {
    console.log('[RUNTIME-ENV-FIX] 🔧 Environment files need fixing, regenerating...');
    const fixed = fixEnvironmentFiles();
    console.log(`[RUNTIME-ENV-FIX] ✅ Fixed ${fixed} environment files`);
  } else {
    console.log('[RUNTIME-ENV-FIX] ✅ Environment files are already configured correctly');
  }
  
  console.log('\n[RUNTIME-ENV-FIX] 🎉 Runtime environment fix completed!');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  fixEnvironmentFiles,
  checkEnvironmentStatus,
  generateEnvScript
}; 