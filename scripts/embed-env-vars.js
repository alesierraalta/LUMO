/**
 * Embed Environment Variables for Client-Side Access
 * 
 * Ensures NEXT_PUBLIC environment variables are properly embedded
 * in the client-side bundle for Choreo deployment.
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env files
function loadEnvFiles() {
  console.log('[EMBED-ENV] Loading environment files...');
  
  // Try to load common .env files
  const envFiles = ['.env', '.env.local', '.env.production'];
  
  envFiles.forEach(envFile => {
    const envPath = path.join(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      console.log(`[EMBED-ENV] Loading ${envFile}...`);
      try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const lines = envContent.split('\n');
        
        lines.forEach(line => {
          const trimmedLine = line.trim();
          if (trimmedLine && !trimmedLine.startsWith('#') && trimmedLine.includes('=')) {
            const [key, ...valueParts] = trimmedLine.split('=');
            const value = valueParts.join('=');
            if (key && value && !process.env[key.trim()]) {
              process.env[key.trim()] = value.trim();
            }
          }
        });
        
        console.log(`[EMBED-ENV] ✅ Loaded ${envFile}`);
      } catch (error) {
        console.log(`[EMBED-ENV] ⚠️ Error loading ${envFile}:`, error.message);
      }
    } else {
      console.log(`[EMBED-ENV] ${envFile} not found`);
    }
  });
}

function createClientEnvFile() {
  console.log('[EMBED-ENV] Creating client environment configuration...');
  
  // Get public environment variables only
  const publicEnvVars = {};
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('NEXT_PUBLIC_')) {
      publicEnvVars[key] = process.env[key];
    }
  });
  
  // Add NODE_ENV for completeness
  publicEnvVars.NODE_ENV = process.env.NODE_ENV || 'production';
  
  // COMENTADO: Detección automática de claves inválidas
  // Si quieres usar Clerk real, asegúrate de tener NEXT_PUBLIC_SKIP_CLERK_AUTH=false
  // y claves reales de Clerk
  /*
  // Check if Clerk key is invalid (base64 placeholder)
  const clerkKey = publicEnvVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isInvalidKey = clerkKey && (
    clerkKey.includes('Y2xlcmsuY2hvcmVvYXBwcy5kZXYk') || // "clerk.choreoapps.dev$"
    clerkKey.includes('d2lubmluZy13YWxsYWJ5LTUuY2xlcmsuYWNjb3VudHMuZGV2JA') // placeholder
  );
  
  if (isInvalidKey) {
    console.log('[EMBED-ENV] ⚠️ Detected invalid/placeholder Clerk key, enabling skip auth mode');
    publicEnvVars.NEXT_PUBLIC_SKIP_CLERK_AUTH = 'true';
  }
  */
  
  console.log('[EMBED-ENV] Environment variables to embed:', {
    ...Object.keys(publicEnvVars).reduce((acc, key) => {
      if (key.includes('CLERK_PUBLISHABLE_KEY')) {
        acc[key] = publicEnvVars[key] ? publicEnvVars[key].substring(0, 15) + '...' : 'undefined';
      } else {
        acc[key] = publicEnvVars[key];
      }
      return acc;
    }, {}),
    invalidKeyDetected: false
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
  console.log('[EMBED-ENV] Current working directory:', process.cwd());
  console.log('[EMBED-ENV] All environment variables starting with NEXT_PUBLIC_:');
  
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('NEXT_PUBLIC_')) {
      console.log(`[EMBED-ENV]   ${key}: ${process.env[key] ? process.env[key].substring(0, 15) + '...' : 'undefined'}`);
    }
  });
  
  try {
    // Load environment files first
    loadEnvFiles();
    
    const envVars = createClientEnvFile();
    injectEnvScriptIntoHtml();
    
    // Warn about missing critical environment variables
    if (!envVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      console.log('[EMBED-ENV] ⚠️ WARNING: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set!');
      console.log('[EMBED-ENV] This will cause client-side authentication to fail.');
      console.log('[EMBED-ENV] Available NEXT_PUBLIC_ environment variables:');
      Object.keys(process.env).forEach(key => {
        if (key.startsWith('NEXT_PUBLIC_')) {
          console.log(`[EMBED-ENV]   ${key}: ${process.env[key] ? 'SET' : 'NOT SET'}`);
        }
      });
    } else {
      console.log('[EMBED-ENV] ✅ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is properly set');
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