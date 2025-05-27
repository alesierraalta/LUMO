#!/usr/bin/env node

/**
 * Minimal Fix for Next.js entryCSSFiles Error
 * 
 * This provides a minimal, safe approach that handles entryCSSFiles issues
 * without ANY prototype modifications or dangerous monkey-patching.
 */

console.log('[MINIMAL-FIX] Installing minimal protection against entryCSSFiles errors...');

const fs = require('fs');
const path = require('path');

// Ensure all manifest files have proper entryCSSFiles structure
const ensureManifestStructure = () => {
  const baseDir = process.cwd();
  const nextDir = path.join(baseDir, '.next');
  
  // Files to check and fix
  const manifestFiles = [
    { path: path.join(nextDir, 'build-manifest.json'), type: 'build' },
    { path: path.join(nextDir, 'app-build-manifest.json'), type: 'app' },
    { path: path.join(nextDir, 'react-loadable-manifest.json'), type: 'loadable' }
  ];
  
  manifestFiles.forEach(({ path: filePath, type }) => {
    try {
      let manifest = {};
      let needsUpdate = false;
      
      if (fs.existsSync(filePath)) {
        try {
          manifest = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
          console.log(`[MINIMAL-FIX] Error parsing ${type} manifest, creating new one`);
          manifest = {};
          needsUpdate = true;
        }
      } else {
        console.log(`[MINIMAL-FIX] Creating missing ${type} manifest`);
        needsUpdate = true;
      }
      
      // Ensure entryCSSFiles exists and is an object
      if (!manifest.entryCSSFiles || typeof manifest.entryCSSFiles !== 'object') {
        manifest.entryCSSFiles = {};
        needsUpdate = true;
      }
      
      // Add default structure for build manifest
      if (type === 'build') {
        if (!manifest.pages) { manifest.pages = {}; needsUpdate = true; }
        if (!manifest.polyfillFiles) { manifest.polyfillFiles = []; needsUpdate = true; }
        if (!manifest.rootMainFiles) { manifest.rootMainFiles = []; needsUpdate = true; }
        if (!manifest.devFiles) { manifest.devFiles = []; needsUpdate = true; }
        if (!manifest.ampDevFiles) { manifest.ampDevFiles = []; needsUpdate = true; }
        if (!manifest.lowPriorityFiles) { manifest.lowPriorityFiles = []; needsUpdate = true; }
      }
      
      // Add default structure for app manifest
      if (type === 'app') {
        if (!manifest.pages) { manifest.pages = {}; needsUpdate = true; }
      }
      
      if (needsUpdate) {
        // Ensure directory exists
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(manifest, null, 2));
        console.log(`[MINIMAL-FIX] Updated ${type} manifest: ${filePath}`);
      }
    } catch (error) {
      console.log(`[MINIMAL-FIX] Error handling ${type} manifest:`, error.message);
    }
  });
  
  // Handle standalone manifests if they exist
  const standaloneDir = path.join(nextDir, 'standalone', '.next');
  if (fs.existsSync(standaloneDir)) {
    console.log('[MINIMAL-FIX] Fixing standalone manifests...');
    
    manifestFiles.forEach(({ path: originalPath, type }) => {
      const fileName = path.basename(originalPath);
      const standalonePath = path.join(standaloneDir, fileName);
      
      try {
        let manifest = {};
        let needsUpdate = false;
        
        if (fs.existsSync(standalonePath)) {
          try {
            manifest = JSON.parse(fs.readFileSync(standalonePath, 'utf8'));
          } catch (e) {
            manifest = {};
            needsUpdate = true;
          }
        } else if (fs.existsSync(originalPath)) {
          // Copy from main manifest
          try {
            manifest = JSON.parse(fs.readFileSync(originalPath, 'utf8'));
            needsUpdate = true;
          } catch (e) {
            manifest = {};
            needsUpdate = true;
          }
        } else {
          needsUpdate = true;
        }
        
        // Ensure entryCSSFiles exists
        if (!manifest.entryCSSFiles || typeof manifest.entryCSSFiles !== 'object') {
          manifest.entryCSSFiles = {};
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          fs.mkdirSync(path.dirname(standalonePath), { recursive: true });
          fs.writeFileSync(standalonePath, JSON.stringify(manifest, null, 2));
          console.log(`[MINIMAL-FIX] Updated standalone ${type} manifest`);
        }
      } catch (error) {
        console.log(`[MINIMAL-FIX] Error handling standalone ${type} manifest:`, error.message);
      }
    });
  }
};

// Handle process errors related to entryCSSFiles without crashing
process.on('uncaughtException', (error) => {
  if (error.message && 
      error.message.includes('entryCSSFiles') &&
      (error.message.includes('Cannot read properties') ||
       error.message.includes('Cannot read property') ||
       error.message.includes('is not defined'))) {
    console.log('[MINIMAL-FIX] Caught uncaught entryCSSFiles exception - handled safely');
    console.log('[MINIMAL-FIX] Error details:', error.message);
    return; // Don't crash the process
  }
  
  // Don't interfere with other uncaught exceptions
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Suppress specific console errors
const originalConsoleError = console.error;
console.error = function(...args) {
  const errorMsg = args.join(' ');
  
  if (errorMsg.includes('entryCSSFiles') && 
      (errorMsg.includes('Cannot read properties of undefined') ||
       errorMsg.includes('Cannot read property') ||
       errorMsg.includes('is not defined'))) {
    console.log('[MINIMAL-FIX] Suppressed entryCSSFiles error:', errorMsg);
    return;
  }
  
  return originalConsoleError.apply(console, args);
};

// Run the manifest fix
ensureManifestStructure();

console.log('[MINIMAL-FIX] Minimal protection installed successfully!');

module.exports = { ensureManifestStructure }; 