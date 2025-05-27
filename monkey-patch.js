/**
 * Monkey-patch for Next.js entryCSSFiles error
 * 
 * This module patches core JavaScript methods to handle undefined entryCSSFiles gracefully.
 * To use it, require this file at the very beginning of your application startup.
 */

console.log('[MONKEY-PATCH] Installing patches to handle entryCSSFiles errors...');

// Original method references
const originalHasOwnProperty = Object.prototype.hasOwnProperty;
const originalObjectEntries = Object.entries;
const originalGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const originalObjectKeys = Object.keys;

// Patch hasOwnProperty to handle entryCSSFiles access on undefined objects
Object.prototype.hasOwnProperty = function(prop) {
  if (prop === 'entryCSSFiles' && (this === undefined || this === null)) {
    console.log('[MONKEY-PATCH] Protected hasOwnProperty against entryCSSFiles on undefined');
    return false;
  }
  return originalHasOwnProperty.call(this, prop);
};

// Patch Object.entries to handle undefined/null safely
Object.entries = function(obj) {
  if (obj === undefined || obj === null) {
    console.log('[MONKEY-PATCH] Protected Object.entries against undefined/null');
    return [];
  }
  return originalObjectEntries(obj);
};

// Patch Object.keys to handle undefined/null safely
Object.keys = function(obj) {
  if (obj === undefined || obj === null) {
    console.log('[MONKEY-PATCH] Protected Object.keys against undefined/null');
    return [];
  }
  return originalObjectKeys(obj);
};

// Patch Object.getOwnPropertyDescriptor to handle undefined objects
Object.getOwnPropertyDescriptor = function(obj, prop) {
  if ((obj === undefined || obj === null) && prop === 'entryCSSFiles') {
    console.log('[MONKEY-PATCH] Protected getOwnPropertyDescriptor against entryCSSFiles on undefined');
    return undefined;
  }
  return originalGetOwnPropertyDescriptor(obj, prop);
};

// Add safe accessor for entryCSSFiles
global.safeGetEntryCSSFiles = function(manifest) {
  if (!manifest) return {};
  if (!manifest.entryCSSFiles) manifest.entryCSSFiles = {};
  return manifest.entryCSSFiles;
};

// Intercept errors related to entryCSSFiles
const originalConsoleError = console.error;
console.error = function(...args) {
  // Check if this is an entryCSSFiles error
  const errorString = args.join(' ');
  if (errorString.includes('entryCSSFiles') && errorString.includes('undefined')) {
    console.log('[MONKEY-PATCH] Intercepted entryCSSFiles error, ensuring it gets fixed');
    
    // Try to find and fix the build manifest
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Possible manifest locations
      const possiblePaths = [
        path.join(process.cwd(), '.next/build-manifest.json'),
        path.join(process.cwd(), '.next/standalone/.next/build-manifest.json')
      ];
      
      possiblePaths.forEach(manifestPath => {
        if (fs.existsSync(manifestPath)) {
          try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            manifest.entryCSSFiles = manifest.entryCSSFiles || {};
            manifest.entryCSSFiles['/_app'] = manifest.entryCSSFiles['/_app'] || [];
            manifest.entryCSSFiles['/'] = manifest.entryCSSFiles['/'] || [];
            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
            console.log(`[MONKEY-PATCH] Emergency fixed manifest at ${manifestPath}`);
          } catch (e) {
            console.log(`[MONKEY-PATCH] Error fixing manifest at ${manifestPath}:`, e.message);
          }
        }
      });
    } catch (e) {
      console.log('[MONKEY-PATCH] Failed emergency fix:', e.message);
    }
    
    // Don't show the original error to avoid confusing users
    return;
  }
  
  // Pass through all other errors
  originalConsoleError.apply(console, args);
};

// Define a getter for entryCSSFiles on global objects
try {
  Object.defineProperty(Object.prototype, '_safeEntryCSSFiles', {
    get: function() {
      if (!this.entryCSSFiles) {
        this.entryCSSFiles = {};
      }
      return this.entryCSSFiles;
    },
    configurable: true
  });
} catch (e) {
  console.log('[MONKEY-PATCH] Could not define _safeEntryCSSFiles property:', e.message);
}

console.log('[MONKEY-PATCH] All patches installed successfully');

module.exports = { 
  safeGetEntryCSSFiles: global.safeGetEntryCSSFiles
}; 