/**
 * Runtime Environment Fix
 * 
 * This script runs at container startup to ensure environment variables
 * are properly embedded even if they weren't available during build time.
 * Specifically designed for Choreo deployment where env vars are runtime-only.
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env files
function loadEnvFiles() {
  console.log('[RUNTIME-ENV-FIX] Loading environment files...');
  
  // Try to load common .env files
  const envFiles = ['.env', '.env.local', '.env.production'];
  
  envFiles.forEach(envFile => {
    const envPath = path.join(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      console.log(`[RUNTIME-ENV-FIX] Loading ${envFile}...`);
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
        
        console.log(`[RUNTIME-ENV-FIX] ✅ Loaded ${envFile}`);
      } catch (error) {
        console.log(`[RUNTIME-ENV-FIX] ⚠️ Error loading ${envFile}:`, error.message);
      }
    } else {
      console.log(`[RUNTIME-ENV-FIX] ${envFile} not found`);
    }
  });
}

function checkCurrentEnvConfig() {
  console.log('[RUNTIME-ENV-FIX] Checking current environment configuration...');
  
  // Check if static file exists and what it contains
  const publicEnvPath = path.join(process.cwd(), 'public', 'env-config.js');
  if (fs.existsSync(publicEnvPath)) {
    try {
      const content = fs.readFileSync(publicEnvPath, 'utf8');
      const hasClerkKey = content.includes('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY') && 
                          !content.includes('"NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": ""') &&
                          !content.includes('"NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": null');
      
      console.log('[RUNTIME-ENV-FIX] Static file status:', {
        exists: true,
        hasClerkKey,
        preview: content.substring(0, 200) + '...'
      });
      
      return hasClerkKey;
    } catch (error) {
      console.log('[RUNTIME-ENV-FIX] Error reading static file:', error.message);
      return false;
    }
  } else {
    console.log('[RUNTIME-ENV-FIX] Static file does not exist');
    return false;
  }
}

function regenerateEnvConfig() {
  console.log('[RUNTIME-ENV-FIX] Regenerating environment configuration...');
  
  // Get current runtime environment variables
  const publicEnvVars = {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SKIP_CLERK_AUTH: process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH || 'false',
    NODE_ENV: process.env.NODE_ENV || 'production'
  };
  
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
    console.log('[RUNTIME-ENV-FIX] ⚠️ Detected invalid/placeholder Clerk key, enabling skip auth mode');
    publicEnvVars.NEXT_PUBLIC_SKIP_CLERK_AUTH = 'true';
  }
  */
  
  console.log('[RUNTIME-ENV-FIX] Runtime environment variables:', {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: publicEnvVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 
      publicEnvVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.substring(0, 15) + '...' : 'missing',
    NEXT_PUBLIC_SKIP_CLERK_AUTH: publicEnvVars.NEXT_PUBLIC_SKIP_CLERK_AUTH,
    NODE_ENV: publicEnvVars.NODE_ENV,
    invalidKeyDetected: false
  });
  
  // Create the JavaScript content
  const jsContent = `// Auto-generated client environment configuration (runtime fix)
// This file ensures NEXT_PUBLIC environment variables are available client-side
window.__NEXT_ENV__ = ${JSON.stringify(publicEnvVars, null, 2)};

// Polyfill process.env for client-side access
if (typeof window !== 'undefined' && !window.process) {
  window.process = { env: ${JSON.stringify(publicEnvVars, null, 2)} };
}
`;

  // Write to all possible locations
  const locations = [
    path.join(process.cwd(), 'public', 'env-config.js'),
    path.join(process.cwd(), '.next', 'standalone', 'public', 'env-config.js'),
    path.join(process.cwd(), '.next', 'standalone', 'env-config.js'),
    path.join(process.cwd(), '.next', 'standalone', '.next', 'env-config.js')
  ];
  
  locations.forEach(location => {
    try {
      // Ensure directory exists
      const dir = path.dirname(location);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log('[RUNTIME-ENV-FIX] Created directory:', dir);
      }
      
      // Write the file
      fs.writeFileSync(location, jsContent, 'utf8');
      console.log('[RUNTIME-ENV-FIX] ✅ Updated:', location);
    } catch (error) {
      console.log('[RUNTIME-ENV-FIX] ⚠️ Could not write to:', location, error.message);
    }
  });
  
  return publicEnvVars;
}

function main() {
  console.log('[RUNTIME-ENV-FIX] Starting runtime environment fix...');
  
  // Load environment files first
  loadEnvFiles();
  
  // Check if we have the required environment variables
  const hasClerkKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  console.log('[RUNTIME-ENV-FIX] Runtime environment check:', {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: hasClerkKey ? 'SET' : 'MISSING'
  });
  
  if (!hasClerkKey) {
    console.log('[RUNTIME-ENV-FIX] ⚠️ No Clerk key available at runtime, cannot fix environment');
    return;
  }
  
  // Check current configuration
  const staticFileHasKey = checkCurrentEnvConfig();
  
  if (!staticFileHasKey) {
    console.log('[RUNTIME-ENV-FIX] Static file missing Clerk key, regenerating...');
    const envVars = regenerateEnvConfig();
    
    if (envVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      console.log('[RUNTIME-ENV-FIX] ✅ Successfully fixed environment configuration');
    } else {
      console.log('[RUNTIME-ENV-FIX] ❌ Failed to fix environment configuration');
    }
  } else {
    console.log('[RUNTIME-ENV-FIX] ✅ Static file already has correct configuration');
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = { main, regenerateEnvConfig, checkCurrentEnvConfig }; 