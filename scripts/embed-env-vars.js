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
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: publicEnvVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 
      publicEnvVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.substring(0, 15) + '...' : 'missing',
    NEXT_PUBLIC_SKIP_CLERK_AUTH: publicEnvVars.NEXT_PUBLIC_SKIP_CLERK_AUTH,
    NODE_ENV: publicEnvVars.NODE_ENV
  });
  
  // Create the JavaScript content
  const jsContent = `// Auto-generated client environment configuration
// This file ensures NEXT_PUBLIC environment variables are available client-side
window.__NEXT_ENV__ = ${JSON.stringify(publicEnvVars, null, 2)};

// Polyfill process.env for client-side access
if (typeof window !== 'undefined' && !window.process) {
  window.process = { env: ${JSON.stringify(publicEnvVars, null, 2)} };
}
`;

  // Write to public directory
  const publicEnvPath = path.join(process.cwd(), 'public', 'env-config.js');
  fs.writeFileSync(publicEnvPath, jsContent, 'utf8');
  console.log('[EMBED-ENV] ✅ Created client environment file:', publicEnvPath);
  
  // ALSO copy to standalone public directory if it exists
  const standalonePublicDir = path.join(process.cwd(), '.next', 'standalone', 'public');
  if (fs.existsSync(standalonePublicDir)) {
    const standaloneEnvPath = path.join(standalonePublicDir, 'env-config.js');
    fs.writeFileSync(standaloneEnvPath, jsContent, 'utf8');
    console.log('[EMBED-ENV] ✅ Also copied to standalone public:', standaloneEnvPath);
  } else {
    console.log('[EMBED-ENV] ⚠️ Standalone public directory not found, creating it...');
    fs.mkdirSync(standalonePublicDir, { recursive: true });
    const standaloneEnvPath = path.join(standalonePublicDir, 'env-config.js');
    fs.writeFileSync(standaloneEnvPath, jsContent, 'utf8');
    console.log('[EMBED-ENV] ✅ Created standalone public directory and copied env file');
  }
  
  // ALSO copy to standalone root if it exists (some deployments serve from here)
  const standaloneRootDir = path.join(process.cwd(), '.next', 'standalone');
  if (fs.existsSync(standaloneRootDir)) {
    const standaloneRootEnvPath = path.join(standaloneRootDir, 'env-config.js');
    fs.writeFileSync(standaloneRootEnvPath, jsContent, 'utf8');
    console.log('[EMBED-ENV] ✅ Also copied to standalone root:', standaloneRootEnvPath);
  }
  
  return publicEnvVars;
}

function injectEnvScriptIntoHtml() {
  console.log('[EMBED-ENV] Checking for HTML files to inject environment script...');
  
  // Check if build manifest exists to ensure we're in a built environment
  const buildManifestPath = path.join(process.cwd(), '.next', 'build-manifest.json');
  if (fs.existsSync(buildManifestPath)) {
    console.log('[EMBED-ENV] ✅ Build manifest found');
  } else {
    console.log('[EMBED-ENV] ⚠️ Build manifest not found, skipping HTML injection');
    return;
  }
}

function main() {
  console.log('[EMBED-ENV] Starting environment variable embedding process...');
  
  try {
    const envVars = createClientEnvFile();
    injectEnvScriptIntoHtml();
    
    // Warn about missing critical environment variables
    if (!envVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      console.log('[EMBED-ENV] ⚠️ WARNING: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set!');
      console.log('[EMBED-ENV] This will cause client-side authentication to fail.');
    }
    
    console.log('[EMBED-ENV] ✅ Environment embedding completed successfully');
  } catch (error) {
    console.error('[EMBED-ENV] ❌ Error during environment embedding:', error);
    process.exit(1);
  }
}

// Run the script
main();

module.exports = { main, createClientEnvFile }; 