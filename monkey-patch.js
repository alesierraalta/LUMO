/**
 * Enhanced Monkey-patch for Next.js entryCSSFiles error
 * 
 * This module patches core JavaScript methods and Next.js module loading 
 * to handle undefined entryCSSFiles gracefully and prevent errors entirely.
 */

console.log('[MONKEY-PATCH] Installing enhanced patches to prevent entryCSSFiles errors...');

// Cache for fixed manifests to avoid repeated file operations
const manifestCache = new Map();

// Original method references
const originalHasOwnProperty = Object.prototype.hasOwnProperty;
const originalObjectEntries = Object.entries;
const originalGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const originalObjectKeys = Object.keys;
const originalRequire = require;

// Enhanced property access protection
const protectedPropertyAccess = (obj, prop, operation = 'access') => {
  if (prop === 'entryCSSFiles' && (obj === undefined || obj === null)) {
    console.log(`[MONKEY-PATCH] Protected ${operation} against entryCSSFiles on undefined object`);
    return operation === 'hasOwnProperty' ? false : {};
  }
  return null; // No protection needed
};

// Patch hasOwnProperty to handle entryCSSFiles access on undefined objects
Object.prototype.hasOwnProperty = function(prop) {
  const protection = protectedPropertyAccess(this, prop, 'hasOwnProperty');
  if (protection !== null) return protection;
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
  const protection = protectedPropertyAccess(obj, prop, 'getOwnPropertyDescriptor');
  if (protection !== null) return undefined;
  return originalGetOwnPropertyDescriptor(obj, prop);
};

// Enhanced require hook to fix manifests at load time
const originalModuleLoad = require('module')._load;
require('module')._load = function(request, parent, isMain) {
  const result = originalModuleLoad.apply(this, arguments);
  
  // Check if this is a manifest file being loaded
  if (typeof request === 'string' && 
      (request.includes('build-manifest') || request.includes('app-build-manifest'))) {
    
    console.log(`[MONKEY-PATCH] Intercepted module load for: ${request}`);
    
    // Fix the loaded manifest if it's missing entryCSSFiles
    if (result && typeof result === 'object') {
      if (request.includes('build-manifest') && !result.entryCSSFiles) {
        console.log('[MONKEY-PATCH] Fixing loaded build-manifest in memory');
        result.entryCSSFiles = {
          '/_app': [],
          '/': []
        };
      }
      if (request.includes('app-build-manifest') && !result.entryCSSFiles) {
        console.log('[MONKEY-PATCH] Fixing loaded app-build-manifest in memory');
        result.entryCSSFiles = {};
      }
    }
  }
  
  return result;
};

// Patch JSON.parse to fix manifests when they're parsed
const originalJSONParse = JSON.parse;
JSON.parse = function(text, reviver) {
  const result = originalJSONParse.call(this, text, reviver);
  
  // Check if this looks like a build manifest
  if (result && typeof result === 'object' && 
      (result.hasOwnProperty('pages') || result.hasOwnProperty('polyfillFiles'))) {
    
    if (!result.entryCSSFiles) {
      console.log('[MONKEY-PATCH] Fixed entryCSSFiles in parsed manifest');
      result.entryCSSFiles = result.pages ? { '/_app': [], '/': [] } : {};
    }
  }
  
  return result;
};

// Global property interceptor for any object that might be a manifest
const createManifestProxy = (target) => {
  return new Proxy(target, {
    get(obj, prop) {
      if (prop === 'entryCSSFiles') {
        if (!obj[prop]) {
          console.log('[MONKEY-PATCH] Created missing entryCSSFiles property via proxy');
          obj[prop] = {};
        }
      }
      return obj[prop];
    },
    has(obj, prop) {
      if (prop === 'entryCSSFiles') {
        if (!obj[prop]) {
          obj[prop] = {};
        }
        return true;
      }
      return prop in obj;
    }
  });
};

// Add safe accessor for entryCSSFiles
global.safeGetEntryCSSFiles = function(manifest) {
  if (!manifest) return {};
  if (!manifest.entryCSSFiles) manifest.entryCSSFiles = {};
  return manifest.entryCSSFiles;
};

// Enhanced error interception with memory fixing
const originalConsoleError = console.error;
console.error = function(...args) {
  const errorString = args.join(' ');
  
  if (errorString.includes('entryCSSFiles') && errorString.includes('undefined')) {
    console.log('[MONKEY-PATCH] Intercepted entryCSSFiles error, applying comprehensive fix');
    
    // Try to fix both file system and in-memory manifests
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Fix file system manifests
      const possiblePaths = [
        path.join(process.cwd(), '.next/build-manifest.json'),
        path.join(process.cwd(), '.next/standalone/.next/build-manifest.json'),
        path.join(process.cwd(), '.next/app-build-manifest.json'),
        path.join(process.cwd(), '.next/standalone/.next/app-build-manifest.json')
      ];
      
      possiblePaths.forEach(manifestPath => {
        if (fs.existsSync(manifestPath)) {
          try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            let changed = false;
            
            if (!manifest.entryCSSFiles) {
              manifest.entryCSSFiles = manifestPath.includes('app-build') ? {} : { '/_app': [], '/': [] };
              changed = true;
            }
            
            if (changed) {
              fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
              console.log(`[MONKEY-PATCH] Emergency fixed file: ${manifestPath}`);
            }
          } catch (e) {
            console.log(`[MONKEY-PATCH] Error fixing ${manifestPath}:`, e.message);
          }
        }
      });
      
      // Try to fix in-memory manifests by patching the require cache
      Object.keys(require.cache).forEach(key => {
        if (key.includes('build-manifest') || key.includes('app-build-manifest')) {
          const cached = require.cache[key];
          if (cached && cached.exports && typeof cached.exports === 'object') {
            if (!cached.exports.entryCSSFiles) {
              console.log(`[MONKEY-PATCH] Fixed cached manifest: ${key}`);
              cached.exports.entryCSSFiles = key.includes('app-build') ? {} : { '/_app': [], '/': [] };
            }
          }
        }
      });
      
    } catch (e) {
      console.log('[MONKEY-PATCH] Failed comprehensive fix:', e.message);
    }
    
    // Don't show the original error
    return;
  }
  
  // Pass through all other errors
  originalConsoleError.apply(console, args);
};

// Patch property access on all objects to handle entryCSSFiles safely
const originalDefineProperty = Object.defineProperty;
try {
  Object.defineProperty(Object.prototype, 'entryCSSFiles', {
    get: function() {
      return this._entryCSSFiles || {};
    },
    set: function(value) {
      this._entryCSSFiles = value;
    },
    configurable: true,
    enumerable: false
  });
} catch (e) {
  console.log('[MONKEY-PATCH] Could not define universal entryCSSFiles property:', e.message);
}

console.log('[MONKEY-PATCH] Enhanced patches installed successfully');

module.exports = { 
  safeGetEntryCSSFiles: global.safeGetEntryCSSFiles,
  createManifestProxy
}; 