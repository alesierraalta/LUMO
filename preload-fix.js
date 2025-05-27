#!/usr/bin/env node

/**
 * Comprehensive manifest preloader and fixer
 * This runs before the server starts to ensure all manifests are properly structured
 */

console.log('[PRELOAD-FIX] Starting comprehensive manifest fix...');

const fs = require('fs');
const path = require('path');

// Function to ensure a directory exists
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`[PRELOAD-FIX] Created directory: ${dirPath}`);
  }
};

// Function to fix a manifest file
const fixManifestFile = (filePath, isBuildManifest = true) => {
  try {
    let manifest = {};
    let isNew = false;
    
    if (fs.existsSync(filePath)) {
      try {
        manifest = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log(`[PRELOAD-FIX] Loaded existing manifest: ${filePath}`);
      } catch (e) {
        console.log(`[PRELOAD-FIX] Error parsing ${filePath}, creating new one`);
        manifest = {};
        isNew = true;
      }
    } else {
      console.log(`[PRELOAD-FIX] Creating new manifest: ${filePath}`);
      isNew = true;
    }
    
    // Fix build-manifest.json structure
    if (isBuildManifest) {
      manifest.entryCSSFiles = manifest.entryCSSFiles || {};
      manifest.entryCSSFiles['/_app'] = manifest.entryCSSFiles['/_app'] || [];
      manifest.entryCSSFiles['/'] = manifest.entryCSSFiles['/'] || [];
      manifest.entryJSFiles = manifest.entryJSFiles || {};
      manifest.pages = manifest.pages || {};
      manifest.polyfillFiles = manifest.polyfillFiles || [];
      manifest.rootMainFiles = manifest.rootMainFiles || [];
      manifest.devFiles = manifest.devFiles || [];
      manifest.ampDevFiles = manifest.ampDevFiles || [];
      manifest.lowPriorityFiles = manifest.lowPriorityFiles || [];
    } else {
      // Fix app-build-manifest.json structure
      manifest.entryCSSFiles = manifest.entryCSSFiles || {};
      manifest.pages = manifest.pages || {};
    }
    
    // Ensure the directory exists
    ensureDir(path.dirname(filePath));
    
    // Write the fixed manifest
    fs.writeFileSync(filePath, JSON.stringify(manifest, null, 2));
    console.log(`[PRELOAD-FIX] ${isNew ? 'Created' : 'Fixed'} manifest: ${filePath}`);
    
    return manifest;
  } catch (error) {
    console.error(`[PRELOAD-FIX] Error fixing ${filePath}:`, error.message);
    return null;
  }
};

// Function to create a default react-loadable-manifest.json
const createReactLoadableManifest = (filePath) => {
  const manifest = {
    entryCSSFiles: {},
    entryJSFiles: {}
  };
  
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(manifest, null, 2));
  console.log(`[PRELOAD-FIX] Created react-loadable-manifest: ${filePath}`);
};

// Main fixing logic
const runComprehensiveFix = () => {
  const baseDir = process.cwd();
  console.log(`[PRELOAD-FIX] Working directory: ${baseDir}`);
  
  // Ensure base .next directory exists
  const nextDir = path.join(baseDir, '.next');
  ensureDir(nextDir);
  
  // Fix main manifest files
  const manifestPaths = [
    { path: path.join(nextDir, 'build-manifest.json'), isBuild: true },
    { path: path.join(nextDir, 'app-build-manifest.json'), isBuild: false }
  ];
  
  manifestPaths.forEach(({ path: filePath, isBuild }) => {
    fixManifestFile(filePath, isBuild);
  });
  
  // Create react-loadable-manifest if missing
  const reactLoadablePath = path.join(nextDir, 'react-loadable-manifest.json');
  if (!fs.existsSync(reactLoadablePath)) {
    createReactLoadableManifest(reactLoadablePath);
  }
  
  // Ensure static directories exist
  const staticDir = path.join(nextDir, 'static');
  ensureDir(staticDir);
  
  const cssDir = path.join(staticDir, 'css');
  ensureDir(cssDir);
  
  const chunksDir = path.join(staticDir, 'chunks');
  ensureDir(chunksDir);
  
  // Create chunks manifest
  const chunksManifestPath = path.join(chunksDir, 'manifest.json');
  if (!fs.existsSync(chunksManifestPath)) {
    const chunksManifest = {
      polyfillFiles: [],
      entryCSSFiles: {},
      entryJSFiles: {}
    };
    fs.writeFileSync(chunksManifestPath, JSON.stringify(chunksManifest, null, 2));
    console.log(`[PRELOAD-FIX] Created chunks manifest: ${chunksManifestPath}`);
  }
  
  // Create empty CSS file to ensure directory isn't empty
  const emptyCssPath = path.join(cssDir, 'empty.css');
  if (!fs.existsSync(emptyCssPath)) {
    fs.writeFileSync(emptyCssPath, '/* Empty CSS file to ensure directory exists */');
    console.log(`[PRELOAD-FIX] Created empty CSS file: ${emptyCssPath}`);
  }
  
  // Check for standalone directory and fix those manifests too
  const standaloneDir = path.join(baseDir, '.next', 'standalone');
  if (fs.existsSync(standaloneDir)) {
    console.log('[PRELOAD-FIX] Found standalone directory, fixing standalone manifests...');
    
    const standaloneNextDir = path.join(standaloneDir, '.next');
    ensureDir(standaloneNextDir);
    
    // Copy and fix manifests in standalone directory
    manifestPaths.forEach(({ path: originalPath, isBuild }) => {
      const fileName = path.basename(originalPath);
      const standalonePath = path.join(standaloneNextDir, fileName);
      
      // Copy from main .next if standalone doesn't exist
      if (!fs.existsSync(standalonePath) && fs.existsSync(originalPath)) {
        fs.copyFileSync(originalPath, standalonePath);
        console.log(`[PRELOAD-FIX] Copied ${fileName} to standalone directory`);
      }
      
      // Fix the standalone manifest
      fixManifestFile(standalonePath, isBuild);
    });
    
    // Ensure standalone static directories
    const standaloneStaticDir = path.join(standaloneNextDir, 'static');
    ensureDir(standaloneStaticDir);
    ensureDir(path.join(standaloneStaticDir, 'css'));
    ensureDir(path.join(standaloneStaticDir, 'chunks'));
    
    // Create standalone chunks manifest
    const standaloneChunksManifestPath = path.join(standaloneStaticDir, 'chunks', 'manifest.json');
    if (!fs.existsSync(standaloneChunksManifestPath)) {
      const chunksManifest = {
        polyfillFiles: [],
        entryCSSFiles: {},
        entryJSFiles: {}
      };
      fs.writeFileSync(standaloneChunksManifestPath, JSON.stringify(chunksManifest, null, 2));
      console.log(`[PRELOAD-FIX] Created standalone chunks manifest`);
    }
  }
  
  console.log('[PRELOAD-FIX] Comprehensive manifest fix completed successfully!');
};

// Run the fix if this file is executed directly
if (require.main === module) {
  runComprehensiveFix();
}

module.exports = { runComprehensiveFix }; 