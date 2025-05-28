#!/usr/bin/env node

/**
 * Fix CSS manifest files for Next.js
 * Resolves the "Cannot read properties of undefined (reading 'entryCSSFiles')" error
 */

const fs = require('fs');
const path = require('path');

console.log('[FIX-MANIFESTS] Starting CSS manifest fix...');

// Check if we're in the right directory
const nextConfigPath = path.join(process.cwd(), 'next.config.ts');
if (!fs.existsSync(nextConfigPath)) {
  console.log('[FIX-MANIFESTS] Warning: next.config.ts not found, make sure you are running this from the project root');
}

// Create .next directory if needed
const nextDir = path.join(process.cwd(), '.next');
if (!fs.existsSync(nextDir)) {
  console.log('[FIX-MANIFESTS] Creating missing .next directory');
  fs.mkdirSync(nextDir, { recursive: true });
}

// Ensure static/css directory exists
const staticDir = path.join(nextDir, 'static');
if (!fs.existsSync(staticDir)) {
  console.log('[FIX-MANIFESTS] Creating missing .next/static directory');
  fs.mkdirSync(staticDir, { recursive: true });
}

const staticCssDir = path.join(staticDir, 'css');
if (!fs.existsSync(staticCssDir)) {
  console.log('[FIX-MANIFESTS] Creating missing .next/static/css directory');
  fs.mkdirSync(staticCssDir, { recursive: true });
}

// Fix build-manifest.json
const buildManifestPath = path.join(nextDir, 'build-manifest.json');
try {
  let buildManifest;
  if (fs.existsSync(buildManifestPath)) {
    console.log('[FIX-MANIFESTS] Fixing existing build-manifest.json');
    try {
      buildManifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'));
    } catch (e) {
      console.log('[FIX-MANIFESTS] Error parsing build-manifest.json, creating new one');
      buildManifest = {};
    }
  } else {
    console.log('[FIX-MANIFESTS] Creating new build-manifest.json');
    buildManifest = {};
  }

  // Add required fields
  buildManifest.entryCSSFiles = buildManifest.entryCSSFiles || {};
  buildManifest.entryCSSFiles['/_app'] = buildManifest.entryCSSFiles['/_app'] || [];
  buildManifest.entryCSSFiles['/'] = buildManifest.entryCSSFiles['/'] || [];
  
  buildManifest.entryJSFiles = buildManifest.entryJSFiles || {};
  buildManifest.pages = buildManifest.pages || {};
  buildManifest.polyfillFiles = buildManifest.polyfillFiles || [];
  buildManifest.rootMainFiles = buildManifest.rootMainFiles || [];
  buildManifest.devFiles = buildManifest.devFiles || [];
  buildManifest.ampDevFiles = buildManifest.ampDevFiles || [];
  
  fs.writeFileSync(buildManifestPath, JSON.stringify(buildManifest, null, 2));
  console.log('[FIX-MANIFESTS] build-manifest.json fixed');
} catch (e) {
  console.error('[FIX-MANIFESTS] Error fixing build-manifest.json:', e.message);
}

// Fix app-build-manifest.json
const appBuildManifestPath = path.join(nextDir, 'app-build-manifest.json');
try {
  let appBuildManifest;
  if (fs.existsSync(appBuildManifestPath)) {
    console.log('[FIX-MANIFESTS] Fixing existing app-build-manifest.json');
    try {
      appBuildManifest = JSON.parse(fs.readFileSync(appBuildManifestPath, 'utf8'));
    } catch (e) {
      console.log('[FIX-MANIFESTS] Error parsing app-build-manifest.json, creating new one');
      appBuildManifest = {};
    }
  } else {
    console.log('[FIX-MANIFESTS] Creating new app-build-manifest.json');
    appBuildManifest = {};
  }

  // Add required fields
  appBuildManifest.entryCSSFiles = appBuildManifest.entryCSSFiles || {};
  appBuildManifest.pages = appBuildManifest.pages || {};
  
  fs.writeFileSync(appBuildManifestPath, JSON.stringify(appBuildManifest, null, 2));
  console.log('[FIX-MANIFESTS] app-build-manifest.json fixed');
} catch (e) {
  console.error('[FIX-MANIFESTS] Error fixing app-build-manifest.json:', e.message);
}

// Create or fix chunks manifest file
const chunksDir = path.join(staticDir, 'chunks');
if (!fs.existsSync(chunksDir)) {
  console.log('[FIX-MANIFESTS] Creating missing .next/static/chunks directory');
  fs.mkdirSync(chunksDir, { recursive: true });
}

const chunksManifestPath = path.join(chunksDir, 'manifest.json');
try {
  let chunksManifest;
  if (fs.existsSync(chunksManifestPath)) {
    console.log('[FIX-MANIFESTS] Fixing existing chunks manifest.json');
    try {
      chunksManifest = JSON.parse(fs.readFileSync(chunksManifestPath, 'utf8'));
    } catch (e) {
      console.log('[FIX-MANIFESTS] Error parsing chunks manifest.json, creating new one');
      chunksManifest = {};
    }
  } else {
    console.log('[FIX-MANIFESTS] Creating new chunks manifest.json');
    chunksManifest = {};
  }

  // Add required fields
  chunksManifest.polyfillFiles = chunksManifest.polyfillFiles || [];
  chunksManifest.entryCSSFiles = chunksManifest.entryCSSFiles || {};
  chunksManifest.entryJSFiles = chunksManifest.entryJSFiles || {};
  
  fs.writeFileSync(chunksManifestPath, JSON.stringify(chunksManifest, null, 2));
  console.log('[FIX-MANIFESTS] chunks manifest.json fixed');
} catch (e) {
  console.error('[FIX-MANIFESTS] Error fixing chunks manifest.json:', e.message);
}

// Create empty css file to ensure CSS directory isn't empty
const emptyCssPath = path.join(staticCssDir, 'empty.css');
if (!fs.existsSync(emptyCssPath)) {
  fs.writeFileSync(emptyCssPath, '/* Empty CSS file to ensure directory exists */');
  console.log('[FIX-MANIFESTS] Created empty.css file');
}

console.log('[FIX-MANIFESTS] CSS manifest fix complete!'); 