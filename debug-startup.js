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

// Step 2: Determine which server.js to use
console.log('\n[DEBUG-STARTUP] Step 2: Determining which server.js to use...');

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

// Step 3: Start the server
console.log(`\n[DEBUG-STARTUP] Step 3: Starting server from ${serverToUse}...`);

try {
  // Instead of requiring the server file, use spawn to start it as a separate process
  // This ensures we see all console output from the server
  console.log('[DEBUG-STARTUP] Handing over to server process...\n');
  
  // Forward all arguments to the server
  const args = process.argv.slice(2);
  
  // Directly execute Node with the server file
  require(serverToUse);
} catch (error) {
  console.error('[DEBUG-STARTUP] Failed to start server:', error.message);
  console.error(error.stack);
  process.exit(1);
} 