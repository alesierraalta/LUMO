/**
 * Runtime CSS Fix for Next.js 15.3.1
 * 
 * This script directly patches the Next.js CSS handling functions
 * to prevent 505 errors related to entryCSSFiles.
 */

const fs = require('fs');
const path = require('path');
const Module = require('module');

console.log('[RUNTIME-FIX] Installing targeted CSS handling patch...');

// Store original require function
const originalRequire = Module.prototype.require;

// Track if we've patched certain modules
const patchedModules = new Set();

// Create patched client files handler
const patchClientFilesManifest = (manifest) => {
  // Safety check for undefined manifest
  if (!manifest) return {};
  
  // Ensure entryCSSFiles exists
  if (!manifest.entryCSSFiles) {
    manifest.entryCSSFiles = {};
  }
  
  // Ensure key properties exist
  if (!manifest.pages) manifest.pages = {};
  if (!manifest.rootMainFiles) manifest.rootMainFiles = [];
  
  return manifest;
};

// Create CSS collection patch function
function createSafeCssLoader(original) {
  return function safeCssLoader(...args) {
    try {
      // If the original function exists, try to call it
      if (typeof original === 'function') {
        return original.apply(this, args);
      }
      // Otherwise return empty array as fallback
      return [];
    } catch (e) {
      // On any error, return empty array
      console.log('[RUNTIME-FIX] Caught CSS loader error:', e.message);
      return [];
    }
  };
}

// Patch Module.prototype.require to intercept Next.js modules
Module.prototype.require = function(id) {
  // Get the original module
  const originalModule = originalRequire.apply(this, arguments);
  
  try {
    // Handle modules containing CSS loading logic
    if (typeof id === 'string') {
      
      // Patch the build manifest handler
      if (id.includes('build-manifest') && !patchedModules.has(id)) {
        console.log(`[RUNTIME-FIX] Patching build manifest module: ${id}`);
        patchedModules.add(id);
        
        if (originalModule && typeof originalModule === 'object') {
          // Apply our patched manifest
          const patchedModule = patchClientFilesManifest(originalModule);
          return patchedModule;
        }
      }
      
      // Patch Next.js CSS handling
      if (id.includes('next/dist/server/render') && !patchedModules.has(id)) {
        console.log(`[RUNTIME-FIX] Patching Next.js CSS rendering: ${id}`);
        patchedModules.add(id);
        
        if (originalModule && typeof originalModule === 'object') {
          // Patch CSS collection functions
          if (originalModule.getCssInlinedLinkTags) {
            originalModule.getCssInlinedLinkTags = createSafeCssLoader(originalModule.getCssInlinedLinkTags);
          }
          if (originalModule.getPreloadableFonts) {
            originalModule.getPreloadableFonts = createSafeCssLoader(originalModule.getPreloadableFonts);
          }
          if (originalModule.getCssLinkTags) {
            originalModule.getCssLinkTags = createSafeCssLoader(originalModule.getCssLinkTags);
          }
        }
      }
      
      // Patch HTML rendering to handle CSS safely
      if ((id.includes('next/dist/server/app-render') || id.includes('next/dist/server/base-server')) && !patchedModules.has(id)) {
        console.log(`[RUNTIME-FIX] Patching Next.js HTML rendering: ${id}`);
        patchedModules.add(id);
        
        // Add safe handling for critical CSS functions
        if (originalModule && typeof originalModule === 'object') {
          const renderFunctions = [
            'renderToHTML', 
            'renderToHTMLOrFlight',
            'renderDocument',
            'renderHTML'
          ];
          
          renderFunctions.forEach(funcName => {
            if (typeof originalModule[funcName] === 'function') {
              const original = originalModule[funcName];
              originalModule[funcName] = function(...args) {
                try {
                  return original.apply(this, args);
                } catch (error) {
                  if (error.message && error.message.includes('entryCSSFiles')) {
                    console.log(`[RUNTIME-FIX] Handled CSS error in ${funcName}`);
                    
                    // For renderToHTML functions, return a basic HTML page
                    if (funcName.includes('renderToHTML')) {
                      return `<!DOCTYPE html><html><head><title>Loading...</title></head>
                        <body><div>Application is loading, please wait...</div></body></html>`;
                    }
                    
                    // Re-throw other errors
                    throw error;
                  }
                  // Re-throw other errors
                  throw error;
                }
              };
            }
          });
        }
      }
    }
  } catch (error) {
    console.log('[RUNTIME-FIX] Error patching module:', error.message);
  }
  
  return originalModule;
};

// Create a proxy for global CSS functions
const originalGetComputedStyle = global.getComputedStyle;
global.getComputedStyle = function(...args) {
  try {
    if (originalGetComputedStyle) {
      return originalGetComputedStyle.apply(this, args);
    }
    // Return empty style object if function is missing
    return { 
      getPropertyValue: () => '' 
    };
  } catch (error) {
    console.log('[RUNTIME-FIX] CSS style error handled:', error.message);
    // Return empty style object
    return { 
      getPropertyValue: () => '' 
    };
  }
};

// Prevent CSS-related unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  const errorMessage = reason?.message || String(reason);
  if (errorMessage.includes('entryCSSFiles') || errorMessage.includes('CSS')) {
    console.log('[RUNTIME-FIX] Handled unhandled CSS promise rejection:', errorMessage);
    return;
  }
  
  // Let other unhandled rejections through
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log('[RUNTIME-FIX] CSS handling patch installed successfully');

module.exports = { patchClientFilesManifest }; 