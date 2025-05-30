#!/usr/bin/env node

/**
 * Embed Environment Variables for LUMO Inventory
 * Embeds public environment variables into client bundles during build
 * Updated for custom JWT authentication (no Clerk)
 */

const fs = require('fs');
const path = require('path');

console.log('[EMBED-ENV] 🔧 Embedding environment variables for LUMO...');

// Public environment variables that are safe for client-side
function getPublicEnvVars() {
  return {
    NODE_ENV: process.env.NODE_ENV || 'production',
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    // Add any other public environment variables here
  };
}

// Generate client-side environment script
function generateClientEnvScript() {
  const publicEnvVars = getPublicEnvVars();
  
  console.log('[EMBED-ENV] 📝 Public environment variables to embed:', {
    NODE_ENV: publicEnvVars.NODE_ENV,
    NEXT_PUBLIC_APP_VERSION: publicEnvVars.NEXT_PUBLIC_APP_VERSION,
  });

  return `
// LUMO Inventory - Client Environment Variables
// Auto-generated during build process
(function() {
  'use strict';
  
  console.log('[LUMO-CLIENT-ENV] Loading client environment variables...');
  
  // Public environment variables safe for client-side
  var env = ${JSON.stringify(publicEnvVars, null, 2)};
  
  // Set up window.__NEXT_ENV__ for Next.js compatibility
  if (typeof window !== 'undefined') {
    window.__NEXT_ENV__ = env;
    
    // Polyfill process.env for libraries that expect it
    if (!window.process) {
      window.process = {};
    }
    if (!window.process.env) {
      window.process.env = {};
    }
    
    // Copy environment variables to process.env polyfill
    Object.assign(window.process.env, env);
    
    console.log('[LUMO-CLIENT-ENV] ✅ Environment variables loaded');
    console.log('[LUMO-CLIENT-ENV] Available:', Object.keys(env));
  }
})();
`.trim();
}

// Embed environment variables into static files
function embedIntoStaticFiles() {
  const envScript = generateClientEnvScript();
  
  // Locations where we need to embed environment variables
  const locations = [
    'public/env-config.js',
    '.next/static/chunks/env-config.js',
    '.next/server/env-config.js'
  ];
  
  let embedded = 0;
  
  locations.forEach(location => {
    try {
      // Ensure directory exists
      const dir = path.dirname(location);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write environment script
      fs.writeFileSync(location, envScript, 'utf8');
      console.log(`[EMBED-ENV] ✅ Embedded environment variables in: ${location}`);
      embedded++;
    } catch (error) {
      console.log(`[EMBED-ENV] ⚠️ Could not embed in ${location}: ${error.message}`);
    }
  });
  
  return embedded;
}

// Update Next.js runtime config
function updateRuntimeConfig() {
  const configPath = '.next/runtime-config.json';
  
  try {
    const publicEnvVars = getPublicEnvVars();
    
    const runtimeConfig = {
      serverRuntimeConfig: {},
      publicRuntimeConfig: publicEnvVars
    };
    
    // Ensure directory exists
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(configPath, JSON.stringify(runtimeConfig, null, 2), 'utf8');
    console.log('[EMBED-ENV] ✅ Updated Next.js runtime config');
    return true;
  } catch (error) {
    console.log(`[EMBED-ENV] ⚠️ Could not update runtime config: ${error.message}`);
    return false;
  }
}

// Validate environment before embedding
function validateEnvironment() {
  console.log('[EMBED-ENV] 🔍 Validating environment...');
  
  const publicEnvVars = getPublicEnvVars();
  
  // Check that we have at least NODE_ENV
  if (!publicEnvVars.NODE_ENV) {
    console.error('[EMBED-ENV] ❌ NODE_ENV is not set');
    return false;
  }
  
  console.log('[EMBED-ENV] ✅ Environment validation passed');
  return true;
}

// Main function
function main() {
  console.log('[EMBED-ENV] 🚀 LUMO Environment Variable Embedding');
  console.log('[EMBED-ENV] ================================');
  
  // Validate environment first
  if (!validateEnvironment()) {
    console.error('[EMBED-ENV] ❌ Environment validation failed, aborting...');
    process.exit(1);
  }
  
  // Embed into static files
  console.log('\n[EMBED-ENV] 📁 Embedding into static files...');
  const embedded = embedIntoStaticFiles();
  console.log(`[EMBED-ENV] ✅ Successfully embedded in ${embedded} locations`);
  
  // Update runtime config
  console.log('\n[EMBED-ENV] ⚙️ Updating runtime configuration...');
  const runtimeUpdated = updateRuntimeConfig();
  
  if (runtimeUpdated) {
    console.log('\n[EMBED-ENV] 🎉 Environment variable embedding completed successfully!');
  } else {
    console.log('\n[EMBED-ENV] ⚠️ Environment variable embedding completed with warnings');
  }
}

// Export for use in other scripts
module.exports = {
  embedIntoStaticFiles,
  updateRuntimeConfig,
  generateClientEnvScript,
  getPublicEnvVars
};

// Run if called directly
if (require.main === module) {
  main();
} 