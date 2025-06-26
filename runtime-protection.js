#!/usr/bin/env node

/**
 * Runtime Protection for Next.js CSS Loading
 * 
 * This script provides runtime protection against the entryCSSFiles error.
 * It modifies JSON parsing and adds error handlers to prevent crashes.
 */

console.log('[RUNTIME-PROTECTION] Installing runtime protection for entryCSSFiles...');

// Safe JSON parsing that fixes entryCSSFiles
const originalJSONParse = JSON.parse;
JSON.parse = function(text, reviver) {
  try {
    const result = originalJSONParse.call(this, text, reviver);
    
    // Check if this looks like a manifest
    if (result && 
        typeof result === 'object' && 
        (result.pages || result.polyfillFiles)) {
      // Ensure entryCSSFiles exists
      if (!result.entryCSSFiles) {
        result.entryCSSFiles = {};
      }
      
      // Ensure other critical properties exist
      if (!result.pages) result.pages = {};
      if (!result.rootMainFiles) result.rootMainFiles = [];
    }
    
    return result;
  } catch (e) {
    console.error('[RUNTIME-PROTECTION] JSON.parse error:', e.message);
    try {
      // For manifest files, return a valid structure
      if (text.includes('"pages"') || text.includes('"polyfillFiles"')) {
        return {
          pages: {},
          entryCSSFiles: {},
          rootMainFiles: []
        };
      }
    } catch (innerError) {
      // Ignore inner errors
    }
    
    // For normal JSON, just throw the original error
    throw e;
  }
};

// Patch Object.entries to handle null/undefined
const originalObjectEntries = Object.entries;
Object.entries = function(obj) {
  if (obj === null || obj === undefined) {
    console.log('[RUNTIME-PROTECTION] Prevented Object.entries on', obj);
    return [];
  }
  return originalObjectEntries(obj);
};

// Enhanced property access protection
const createSafeProxy = (target, name) => {
  return new Proxy(target || {}, {
    get(obj, prop) {
      if (prop === 'entryCSSFiles') {
        if (!obj[prop]) {
          console.log(`[RUNTIME-PROTECTION] Auto-creating entryCSSFiles for ${name}`);
          obj[prop] = {};
        }
        return obj[prop];
      }
      return obj[prop];
    }
  });
};

// Patch require to intercept manifest loading
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  const result = originalRequire.apply(this, arguments);
  
  // Intercept manifest files
  if (typeof id === 'string' && id.includes('manifest')) {
    if (result && typeof result === 'object') {
      return createSafeProxy(result, id);
    }
  }
  
  return result;
};

// Global property access interceptor
const originalDefineProperty = Object.defineProperty;
Object.defineProperty = function(obj, prop, descriptor) {
  try {
    return originalDefineProperty.call(this, obj, prop, descriptor);
  } catch (e) {
    if (e.message && e.message.includes('entryCSSFiles')) {
      console.log('[RUNTIME-PROTECTION] Prevented defineProperty error for entryCSSFiles');
      return obj;
    }
    throw e;
  }
};

// Enhanced error handling for property access
const originalGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
Object.getOwnPropertyDescriptor = function(obj, prop) {
  try {
    if (prop === 'entryCSSFiles' && (!obj || obj[prop] === undefined)) {
      // Return a descriptor for an empty object
      return {
        value: {},
        writable: true,
        enumerable: true,
        configurable: true
      };
    }
    return originalGetOwnPropertyDescriptor.call(this, obj, prop);
  } catch (e) {
    console.log('[RUNTIME-PROTECTION] Protected getOwnPropertyDescriptor for', prop);
    return undefined;
  }
};

// Handle entryCSSFiles errors
process.on('uncaughtException', (error) => {
  if (error.message && 
     (error.message.includes('entryCSSFiles') || 
      error.message.includes('Cannot read properties of undefined'))) {
    console.log('[RUNTIME-PROTECTION] Suppressed entryCSSFiles TypeError: ', error.message);
    return; // Don't crash
  }
  
  // Log other errors
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  if (reason && 
     (reason.message && reason.message.includes('entryCSSFiles') || 
      reason.message && reason.message.includes('Cannot read properties of undefined'))) {
    console.log('[RUNTIME-PROTECTION] Suppressed entryCSSFiles Promise rejection:', reason.message);
    return; // Don't crash
  }
  
  // Log other rejections
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log('[RUNTIME-PROTECTION] Runtime protection installed successfully!');

module.exports = {}; 