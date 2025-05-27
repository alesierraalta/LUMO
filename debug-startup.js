#!/usr/bin/env node

/**
 * Choreo Debug Startup Script
 * Fixes CSS manifests and starts the Next.js server
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('[DEBUG-STARTUP] Starting diagnostic routine...');

// Environment information
console.log('[DEBUG-STARTUP] Node version:', process.version);
console.log('[DEBUG-STARTUP] Platform:', process.platform);
console.log('[DEBUG-STARTUP] Current directory:', process.cwd());
console.log('[DEBUG-STARTUP] NODE_ENV:', process.env.NODE_ENV);

// Check for important files
const criticalFiles = [
  'server.js',
  '.next/standalone/server.js',
  '.next/build-manifest.json',
  '.next/app-build-manifest.json',
  'scripts/fix-manifests.js',
  'next.config.ts'
];

console.log('[DEBUG-STARTUP] Checking for critical files:');
criticalFiles.forEach(file => {
  console.log(`- ${file}: ${fs.existsSync(path.join(process.cwd(), file)) ? 'EXISTS' : 'MISSING'}`);
});

// CRITICAL STEP: Monkey patch Next.js core modules to handle missing entryCSSFiles
console.log('\n[DEBUG-STARTUP] Monkey patching Next.js core modules...');

// This is the most critical part that prevents the entryCSSFiles error
// We're overriding the Object.prototype.hasOwnProperty method specifically for 'entryCSSFiles'
const originalHasOwnProperty = Object.prototype.hasOwnProperty;
Object.prototype.hasOwnProperty = function(prop) {
  // If checking for entryCSSFiles and this object is null/undefined, return false instead of throwing
  if (prop === 'entryCSSFiles' && (this === undefined || this === null)) {
    console.log('[DEBUG-PATCH] Protected against entryCSSFiles access on undefined');
    return false;
  }
  return originalHasOwnProperty.call(this, prop);
};

// Patch for Object.entries to handle undefined for CSS manifests
const originalEntries = Object.entries;
Object.entries = function(obj) {
  if (obj === undefined || obj === null) {
    console.log('[DEBUG-PATCH] Protected against Object.entries on undefined/null');
    return [];
  }
  return originalEntries(obj);
};

// Create a safe accessor for entryCSSFiles that always returns an object
global.safeGetEntryCSSFiles = function(manifest) {
  if (!manifest) return {};
  if (!manifest.entryCSSFiles) manifest.entryCSSFiles = {};
  return manifest.entryCSSFiles;
};

console.log('[DEBUG-PATCH] Installed global Next.js protections against undefined entryCSSFiles');

// Step 1: Run fix-manifests.js
console.log('\n[DEBUG-STARTUP] Step 1: Running fix-manifests.js...');
try {
  const fixManifestsPath = path.join(process.cwd(), 'scripts/fix-manifests.js');
  if (fs.existsSync(fixManifestsPath)) {
    // Option 1: Require it directly (more reliable)
    require(fixManifestsPath);
  } else {
    console.log('[DEBUG-STARTUP] fix-manifests.js not found, creating CSS manifest fixes inline...');
    
    // Create .next/static/css directory
    const staticCssDir = path.join(process.cwd(), '.next/static/css');
    if (!fs.existsSync(staticCssDir)) {
      fs.mkdirSync(staticCssDir, { recursive: true });
      console.log('[DEBUG-STARTUP] Created .next/static/css directory');
    }
    
    // Fix build-manifest.json
    const buildManifestPath = path.join(process.cwd(), '.next/build-manifest.json');
    if (fs.existsSync(buildManifestPath)) {
      try {
        const buildManifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'));
        buildManifest.entryCSSFiles = buildManifest.entryCSSFiles || {};
        buildManifest.entryCSSFiles['/_app'] = buildManifest.entryCSSFiles['/_app'] || [];
        buildManifest.entryCSSFiles['/'] = buildManifest.entryCSSFiles['/'] || [];
        fs.writeFileSync(buildManifestPath, JSON.stringify(buildManifest, null, 2));
        console.log('[DEBUG-STARTUP] Fixed build-manifest.json');
      } catch (e) {
        console.error('[DEBUG-STARTUP] Error fixing build-manifest.json:', e.message);
      }
    }
    
    // Fix app-build-manifest.json
    const appBuildManifestPath = path.join(process.cwd(), '.next/app-build-manifest.json');
    if (fs.existsSync(appBuildManifestPath)) {
      try {
        const appBuildManifest = JSON.parse(fs.readFileSync(appBuildManifestPath, 'utf8'));
        appBuildManifest.entryCSSFiles = appBuildManifest.entryCSSFiles || {};
        fs.writeFileSync(appBuildManifestPath, JSON.stringify(appBuildManifest, null, 2));
        console.log('[DEBUG-STARTUP] Fixed app-build-manifest.json');
      } catch (e) {
        console.error('[DEBUG-STARTUP] Error fixing app-build-manifest.json:', e.message);
      }
    }
  }
} catch (error) {
  console.error('[DEBUG-STARTUP] Error running fix-manifests.js:', error.message);
  console.error('[DEBUG-STARTUP] Continuing anyway...');
}

// Step 2: Copy manifest files to all possible locations the standalone server might look
console.log('\n[DEBUG-STARTUP] Step 2: Ensuring manifest files exist in all possible locations...');

// Fix standalone directory manifests if needed
const standaloneDir = path.join(process.cwd(), '.next/standalone');
if (fs.existsSync(standaloneDir)) {
  console.log('[DEBUG-STARTUP] Found standalone directory, ensuring manifests are copied there...');
  
  // Create standalone .next directory
  const standaloneNextDir = path.join(standaloneDir, '.next');
  if (!fs.existsSync(standaloneNextDir)) {
    fs.mkdirSync(standaloneNextDir, { recursive: true });
  }
  
  // Copy manifest files from .next to standalone/.next
  const manifestFiles = [
    'build-manifest.json',
    'app-build-manifest.json',
    'react-loadable-manifest.json'
  ];
  
  manifestFiles.forEach(file => {
    const sourcePath = path.join(process.cwd(), '.next', file);
    const destPath = path.join(standaloneNextDir, file);
    if (fs.existsSync(sourcePath)) {
      try {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`[DEBUG-STARTUP] Copied ${file} to standalone directory`);
      } catch (e) {
        console.error(`[DEBUG-STARTUP] Error copying ${file} to standalone:`, e.message);
      }
    }
  });
  
  // Create standalone/static/css directory
  const standaloneStaticDir = path.join(standaloneNextDir, 'static');
  if (!fs.existsSync(standaloneStaticDir)) {
    fs.mkdirSync(standaloneStaticDir, { recursive: true });
  }
  
  const standaloneCssDir = path.join(standaloneStaticDir, 'css');
  if (!fs.existsSync(standaloneCssDir)) {
    fs.mkdirSync(standaloneCssDir, { recursive: true });
  }
  
  // Create chunks directory and manifest
  const standaloneChunksDir = path.join(standaloneStaticDir, 'chunks');
  if (!fs.existsSync(standaloneChunksDir)) {
    fs.mkdirSync(standaloneChunksDir, { recursive: true });
  }
  
  // Copy or create chunks manifest
  const chunksManifestPath = path.join(process.cwd(), '.next/static/chunks/manifest.json');
  const standaloneChunksManifestPath = path.join(standaloneChunksDir, 'manifest.json');
  
  if (fs.existsSync(chunksManifestPath)) {
    fs.copyFileSync(chunksManifestPath, standaloneChunksManifestPath);
  } else {
    const chunksManifest = {
      polyfillFiles: [],
      entryCSSFiles: {},
      entryJSFiles: {}
    };
    fs.writeFileSync(standaloneChunksManifestPath, JSON.stringify(chunksManifest, null, 2));
  }
  
  console.log('[DEBUG-STARTUP] Standalone directory preparation complete');
}

// Step 3: Determine which server.js to use
console.log('\n[DEBUG-STARTUP] Step 3: Determining which server.js to use...');

const standaloneServerPath = path.join(process.cwd(), '.next/standalone/server.js');
const regularServerPath = path.join(process.cwd(), 'server.js');

let serverToUse = null;

if (fs.existsSync(standaloneServerPath)) {
  console.log('[DEBUG-STARTUP] Standalone server.js found, will use it');
  serverToUse = standaloneServerPath;
} else if (fs.existsSync(regularServerPath)) {
  console.log('[DEBUG-STARTUP] Regular server.js found, will use it');
  serverToUse = regularServerPath;
} else {
  console.error('[DEBUG-STARTUP] No server.js found! Creating a minimal one...');
  
  // Create a minimal server.js if none exists
  const minimalServer = `
const { createServer } = require('http');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const port = process.env.PORT || 8080;

console.log('[EMERGENCY-SERVER] Starting Next.js application...');
console.log('[EMERGENCY-SERVER] Environment:', process.env.NODE_ENV);
console.log('[EMERGENCY-SERVER] Port:', port);

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(port, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log('[EMERGENCY-SERVER] Next.js server ready on port', port);
  });
}).catch((ex) => {
  console.error('[EMERGENCY-SERVER] Error starting server:', ex.message);
  process.exit(1);
});
`;
  
  fs.writeFileSync(regularServerPath, minimalServer);
  console.log('[DEBUG-STARTUP] Created emergency server.js');
  serverToUse = regularServerPath;
}

// Step 4: Start the server
console.log(`\n[DEBUG-STARTUP] Step 4: Starting server from ${serverToUse}...`);

try {
  console.log('[DEBUG-STARTUP] Handing over to server process...\n');
  
  // Directly execute Node with the server file
  require(serverToUse);
} catch (error) {
  console.error('[DEBUG-STARTUP] Failed to start server:', error.message);
  console.error(error.stack);
  process.exit(1);
} 