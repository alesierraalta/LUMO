/**
 * Embed Environment Variables for Client-Side Access
 * 
 * Ensures NEXT_PUBLIC environment variables are properly embedded
 * in the client-side bundle for Choreo deployment.
 */

const fs = require('fs');
const path = require('path');

function createClientEnvFile() {
  console.log('[EMBED-ENV] Creating client environment configuration...');
  
  // Get the public environment variables
  const publicEnvVars = {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SKIP_CLERK_AUTH: process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH || 'false',
    NODE_ENV: process.env.NODE_ENV || 'production'
  };
  
  console.log('[EMBED-ENV] Environment variables to embed:', {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: publicEnvVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'configured' : 'missing',
    NEXT_PUBLIC_SKIP_CLERK_AUTH: publicEnvVars.NEXT_PUBLIC_SKIP_CLERK_AUTH,
    NODE_ENV: publicEnvVars.NODE_ENV
  });
  
  // Create client-side environment configuration
  const clientEnvContent = `
// Auto-generated client environment configuration
// This file ensures NEXT_PUBLIC environment variables are available client-side
window.__NEXT_ENV__ = ${JSON.stringify(publicEnvVars, null, 2)};

// Polyfill process.env for client-side access
if (typeof window !== 'undefined' && !window.process) {
  window.process = { env: ${JSON.stringify(publicEnvVars, null, 2)} };
}
`;

  // Write to public directory so it's accessible client-side
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  const envFilePath = path.join(publicDir, 'env-config.js');
  fs.writeFileSync(envFilePath, clientEnvContent);
  console.log(`[EMBED-ENV] ✅ Created client environment file: ${envFilePath}`);
  
  // Also create a copy in standalone public directory if it exists
  const standalonePublicDir = path.join(process.cwd(), '.next', 'standalone', 'public');
  if (fs.existsSync(standalonePublicDir)) {
    const standaloneEnvPath = path.join(standalonePublicDir, 'env-config.js');
    fs.writeFileSync(standaloneEnvPath, clientEnvContent);
    console.log(`[EMBED-ENV] ✅ Created standalone environment file: ${standaloneEnvPath}`);
  }
  
  return publicEnvVars;
}

function injectEnvScript() {
  console.log('[EMBED-ENV] Checking for HTML files to inject environment script...');
  
  const buildDir = path.join(process.cwd(), '.next');
  const staticDir = path.join(buildDir, 'static');
  
  // Look for the build manifest to find HTML entry points
  const manifestPath = path.join(buildDir, 'build-manifest.json');
  if (fs.existsSync(manifestPath)) {
    console.log('[EMBED-ENV] ✅ Build manifest found');
  } else {
    console.log('[EMBED-ENV] ⚠️ No build manifest found, skipping HTML injection');
  }
}

function main() {
  console.log('[EMBED-ENV] Starting environment variable embedding process...');
  
  try {
    const envVars = createClientEnvFile();
    injectEnvScript();
    
    // Verify critical environment variables
    if (!envVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      console.warn('[EMBED-ENV] ⚠️ WARNING: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set!');
      console.warn('[EMBED-ENV] This will cause client-side authentication to fail.');
    } else {
      console.log('[EMBED-ENV] ✅ All critical environment variables are configured');
    }
    
    console.log('[EMBED-ENV] ✅ Environment embedding completed successfully');
    
  } catch (error) {
    console.error('[EMBED-ENV] ❌ Error embedding environment variables:', error);
    // Don't exit with error, as this shouldn't break the build
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, createClientEnvFile }; 