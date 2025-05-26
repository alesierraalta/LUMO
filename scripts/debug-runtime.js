#!/usr/bin/env node

/**
 * Runtime debugging script for Choreo deployment
 * Helps identify the source of Next.js standalone errors
 */

console.log('[DEBUG] Starting runtime debugging...');

// Check Node.js version
console.log('[DEBUG] Node.js version:', process.version);
console.log('[DEBUG] Platform:', process.platform);
console.log('[DEBUG] Architecture:', process.arch);

// Check environment variables
console.log('[DEBUG] NODE_ENV:', process.env.NODE_ENV);
console.log('[DEBUG] Port:', process.env.PORT);

// Check critical Clerk variables (first 10 chars only)
console.log('[DEBUG] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY exists:', !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
console.log('[DEBUG] CLERK_SECRET_KEY exists:', !!process.env.CLERK_SECRET_KEY);

// Check file system
const fs = require('fs');
const path = require('path');

console.log('[DEBUG] Current working directory:', process.cwd());

// Check critical Next.js standalone files
const criticalFiles = [
  'server.js',
  '.next/static',
  '.next/server',
  '.next/standalone',
  '.next/standalone/server.js',
  'public',
  'next.config.ts',
  'postcss.config.mjs'
];

criticalFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`[DEBUG] ${file} exists:`, exists);
  if (exists && file === '.next/static') {
    try {
      const staticFiles = fs.readdirSync('.next/static');
      console.log(`[DEBUG] Files in .next/static:`, staticFiles.slice(0, 5)); // Show first 5
    } catch (e) {
      console.log(`[DEBUG] Error reading .next/static:`, e.message);
    }
  }
  if (exists && file === '.next/server') {
    try {
      const serverFiles = fs.readdirSync('.next/server');
      console.log(`[DEBUG] Files in .next/server:`, serverFiles.slice(0, 5)); // Show first 5
    } catch (e) {
      console.log(`[DEBUG] Error reading .next/server:`, e.message);
    }
  }
});

// CRITICAL: Check for server.js in multiple locations and try to create a working startup
console.log('[DEBUG] Checking for server.js in multiple locations...');

const serverLocations = [
  'server.js',
  '.next/standalone/server.js',
  '.next/server.js'
];

let serverFound = false;
let serverLocation = null;

for (const location of serverLocations) {
  if (fs.existsSync(location)) {
    console.log(`[DEBUG] Found server at: ${location}`);
    serverFound = true;
    serverLocation = location;
    break;
  }
}

if (!serverFound) {
  console.log('[DEBUG] No server.js found in expected locations');
  
  // Try to create a custom server.js that uses Next.js server
  console.log('[DEBUG] Attempting to create a custom server.js...');
  try {
    const customServer = `
const { createServer } = require('http');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const port = process.env.PORT || 8080;

console.log('[CUSTOM-SERVER] Starting Next.js application...');
console.log('[CUSTOM-SERVER] Environment:', process.env.NODE_ENV);
console.log('[CUSTOM-SERVER] Port:', port);

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(port, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log('[CUSTOM-SERVER] Next.js server ready on port', port);
  });
}).catch((ex) => {
  console.error('[CUSTOM-SERVER] Error starting server:', ex.message);
  process.exit(1);
});
`;
    
    fs.writeFileSync('server.js', customServer);
    console.log('[DEBUG] Custom server.js created successfully!');
    serverFound = true;
    serverLocation = 'server.js';
  } catch (error) {
    console.log('[DEBUG] Error creating custom server.js:', error.message);
  }
}

// If server.js exists in standalone but not in root, copy it
if (!fs.existsSync('server.js') && fs.existsSync('.next/standalone/server.js')) {
  console.log('[DEBUG] Found server.js in .next/standalone, copying to root...');
  try {
    fs.copyFileSync('.next/standalone/server.js', 'server.js');
    console.log('[DEBUG] server.js copied successfully!');
    serverFound = true;
    serverLocation = 'server.js';
  } catch (error) {
    console.log('[DEBUG] Error copying server.js:', error.message);
  }
}

// Enhanced CSS manifest checks
try {
  if (fs.existsSync('.next')) {
    const nextFiles = fs.readdirSync('.next');
    console.log('[DEBUG] Files in .next (first 10):', nextFiles.slice(0, 10));
    
    // Look for manifest files
    const manifestFiles = nextFiles.filter(f => f.includes('manifest') || f.includes('css'));
    console.log('[DEBUG] Manifest/CSS files:', manifestFiles);
    
    // Check for required-server-files.json
    if (fs.existsSync('.next/required-server-files.json')) {
      try {
        const requiredFiles = JSON.parse(fs.readFileSync('.next/required-server-files.json', 'utf8'));
        console.log('[DEBUG] Required server files config exists');
        if (requiredFiles.files) {
          console.log('[DEBUG] Required files count:', requiredFiles.files.length);
        }
      } catch (e) {
        console.log('[DEBUG] Error reading required-server-files.json:', e.message);
      }
    } else {
      console.log('[DEBUG] required-server-files.json NOT found');
    }
    
    // Try to create missing CSS manifest if needed
    if (!fs.existsSync('.next/static/css')) {
      console.log('[DEBUG] Creating missing .next/static/css directory...');
      fs.mkdirSync('.next/static/css', { recursive: true });
    }
  }
} catch (error) {
  console.log('[DEBUG] Error reading .next directory:', error.message);
}

// Check package.json and dependencies
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('[DEBUG] App name:', packageJson.name);
  console.log('[DEBUG] App version:', packageJson.version);
  console.log('[DEBUG] Next.js version:', packageJson.dependencies?.['next'] || 'not found');
  console.log('[DEBUG] PostCSS available:', !!packageJson.dependencies?.['postcss']);
  console.log('[DEBUG] Tailwind available:', !!packageJson.dependencies?.['tailwindcss']);
} catch (error) {
  console.log('[DEBUG] Error reading package.json:', error.message);
}

// Check if we can import Next.js modules
try {
  console.log('[DEBUG] Testing Next.js import...');
  const nextPackage = require('next/package.json');
  console.log('[DEBUG] Next.js package version:', nextPackage.version);
} catch (error) {
  console.log('[DEBUG] Error importing Next.js:', error.message);
}

// Check for common CSS processing modules
const cssModules = ['postcss', 'tailwindcss', '@tailwindcss/postcss'];
cssModules.forEach(module => {
  try {
    require.resolve(module);
    console.log(`[DEBUG] ${module}: available`);
  } catch (e) {
    console.log(`[DEBUG] ${module}: NOT available`);
  }
});

// List current directory structure
try {
  const currentDirFiles = fs.readdirSync('.');
  console.log('[DEBUG] Current directory files:', currentDirFiles);
} catch (error) {
  console.log('[DEBUG] Error listing current directory:', error.message);
}

// Fix CSS manifest files to prevent entryCSSFiles error
try {
  console.log('[DEBUG] Fixing CSS manifest files...');
  
  // Fix build-manifest.json (most critical for entryCSSFiles error)
  const buildManifestPath = '.next/build-manifest.json';
  if (fs.existsSync(buildManifestPath)) {
    try {
      const buildManifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'));
      console.log('[DEBUG] Current build manifest keys:', Object.keys(buildManifest));
      
      // Ensure entryCSSFiles exists
      if (!buildManifest.entryCSSFiles) {
        console.log('[DEBUG] Adding missing entryCSSFiles to build manifest');
        buildManifest.entryCSSFiles = {};
      }
      
      // Ensure other required CSS fields exist
      if (!buildManifest.entryJSFiles) {
        buildManifest.entryJSFiles = {};
      }
      
      // Write back the fixed manifest
      fs.writeFileSync(buildManifestPath, JSON.stringify(buildManifest, null, 2));
      console.log('[DEBUG] build-manifest.json fixed');
    } catch (e) {
      console.log('[DEBUG] Error reading build-manifest.json:', e.message);
      console.log('[DEBUG] Creating new build-manifest.json');
      const fallbackBuildManifest = {
        polyfillFiles: [],
        entryCSSFiles: {},
        entryJSFiles: {},
        devFiles: [],
        ampDevFiles: [],
        lowPriorityFiles: [],
        rootMainFiles: [],
        pages: {}
      };
      fs.writeFileSync(buildManifestPath, JSON.stringify(fallbackBuildManifest, null, 2));
    }
  } else {
    console.log('[DEBUG] Creating missing build-manifest.json');
    const fallbackBuildManifest = {
      polyfillFiles: [],
      entryCSSFiles: {},
      entryJSFiles: {},
      devFiles: [],
      ampDevFiles: [],
      lowPriorityFiles: [],
      rootMainFiles: [],
      pages: {}
    };
    fs.writeFileSync(buildManifestPath, JSON.stringify(fallbackBuildManifest, null, 2));
  }
  
  // Fix app-build-manifest.json if it exists
  const appBuildManifestPath = '.next/app-build-manifest.json';
  if (fs.existsSync(appBuildManifestPath)) {
    try {
      const appBuildManifest = JSON.parse(fs.readFileSync(appBuildManifestPath, 'utf8'));
      if (!appBuildManifest.pages) {
        appBuildManifest.pages = {};
      }
      fs.writeFileSync(appBuildManifestPath, JSON.stringify(appBuildManifest, null, 2));
      console.log('[DEBUG] app-build-manifest.json verified');
    } catch (e) {
      console.log('[DEBUG] Error with app-build-manifest.json:', e.message);
    }
  }
  
  // Create chunks manifest fallback
  fs.mkdirSync('.next/static/chunks', { recursive: true });
  const chunksManifestPath = '.next/static/chunks/manifest.json';
  if (!fs.existsSync(chunksManifestPath)) {
    const fallbackChunksManifest = {
      entryCSSFiles: {},
      entryJSFiles: {},
      polyfillFiles: []
    };
    fs.writeFileSync(chunksManifestPath, JSON.stringify(fallbackChunksManifest, null, 2));
    console.log('[DEBUG] chunks manifest created');
  }
  
  console.log('[DEBUG] CSS manifest fixes completed');
} catch (error) {
  console.log('[DEBUG] Error fixing CSS manifests:', error.message);
}

// Final check after all operations
console.log('[DEBUG] Final server.js check:', fs.existsSync('server.js') ? 'EXISTS' : 'MISSING');
console.log('[DEBUG] Recommended startup method:', serverFound ? `node ${serverLocation}` : 'npx next start');

console.log('[DEBUG] Debug complete. Starting application...'); 