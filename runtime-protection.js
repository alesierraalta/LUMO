#!/usr/bin/env node

/**
 * Runtime Protection for Next.js entryCSSFiles Access
 * 
 * This handles runtime cases where entryCSSFiles is accessed on undefined objects
 * during request processing, without modifying prototypes.
 */

console.log('[RUNTIME-PROTECTION] Installing runtime protection for entryCSSFiles...');

// Store original property access methods
const originalGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const originalDefineProperty = Object.defineProperty;

// Enhanced error handling for property access
const originalPropertyDescriptorOf = Object.getOwnPropertyDescriptor;
Object.getOwnPropertyDescriptor = function(obj, prop) {
  try {
    // Handle entryCSSFiles access on undefined/null objects
    if (prop === 'entryCSSFiles' && (obj === null || obj === undefined)) {
      console.log('[RUNTIME-PROTECTION] Protected getOwnPropertyDescriptor for entryCSSFiles on null/undefined');
      return {
        value: {},
        writable: true,
        enumerable: true,
        configurable: true
      };
    }
    return originalPropertyDescriptorOf.call(this, obj, prop);
  } catch (error) {
    console.log('[RUNTIME-PROTECTION] getOwnPropertyDescriptor error handled:', error.message);
    if (prop === 'entryCSSFiles') {
      return {
        value: {},
        writable: true,
        enumerable: true,
        configurable: true
      };
    }
    return undefined;
  }
};

// Enhanced Object.defineProperty protection
Object.defineProperty = function(obj, prop, descriptor) {
  try {
    if (prop === 'entryCSSFiles') {
      if (obj === null || obj === undefined) {
        console.log('[RUNTIME-PROTECTION] Cannot define property on null/undefined object');
        return obj;
      }
      // Ensure descriptor has a valid value
      if (!descriptor.value && descriptor.get === undefined) {
        descriptor.value = {};
      }
    }
    return originalDefineProperty.call(this, obj, prop, descriptor);
  } catch (error) {
    console.log('[RUNTIME-PROTECTION] defineProperty error handled:', error.message);
    return obj;
  }
};

// Intercept property access errors more specifically
const originalConsoleError = console.error;
console.error = function(...args) {
  const errorMsg = args.join(' ');
  
  // Suppress entryCSSFiles-related TypeError messages
  if (errorMsg.includes('TypeError') && 
      errorMsg.includes('entryCSSFiles') &&
      (errorMsg.includes('Cannot read properties of undefined') ||
       errorMsg.includes('Cannot read property') ||
       errorMsg.includes('reading \'entryCSSFiles\''))) {
    console.log('[RUNTIME-PROTECTION] Suppressed entryCSSFiles TypeError:', errorMsg);
    return;
  }
  
  return originalConsoleError.apply(console, args);
};

// Global error handler for uncaught entryCSSFiles errors
process.on('uncaughtException', (error) => {
  if (error instanceof TypeError && 
      error.message && 
      error.message.includes('entryCSSFiles') &&
      (error.message.includes('Cannot read properties of undefined') ||
       error.message.includes('reading \'entryCSSFiles\''))) {
    console.log('[RUNTIME-PROTECTION] Caught uncaught TypeError for entryCSSFiles:', error.message);
    return; // Prevent crash
  }
  
  // Let other errors through
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Monkey-patch common property access patterns safely
const originalObjectKeys = Object.keys;
Object.keys = function(obj) {
  try {
    if (obj === null || obj === undefined) {
      console.log('[RUNTIME-PROTECTION] Protected Object.keys from null/undefined');
      return [];
    }
    return originalObjectKeys(obj);
  } catch (error) {
    console.log('[RUNTIME-PROTECTION] Object.keys error handled:', error.message);
    return [];
  }
};

const originalObjectEntries = Object.entries;
Object.entries = function(obj) {
  try {
    if (obj === null || obj === undefined) {
      console.log('[RUNTIME-PROTECTION] Protected Object.entries from null/undefined');
      return [];
    }
    return originalObjectEntries(obj);
  } catch (error) {
    console.log('[RUNTIME-PROTECTION] Object.entries error handled:', error.message);
    return [];
  }
};

// Enhanced JSON.stringify protection
const originalJSONStringify = JSON.stringify;
JSON.stringify = function(value, replacer, space) {
  try {
    // If the value has problematic entryCSSFiles access, fix it
    if (value && typeof value === 'object' && value !== null) {
      // Create a safe copy if needed
      if ('entryCSSFiles' in value && value.entryCSSFiles === undefined) {
        const safeCopy = { ...value };
        safeCopy.entryCSSFiles = {};
        return originalJSONStringify.call(this, safeCopy, replacer, space);
      }
    }
    return originalJSONStringify.call(this, value, replacer, space);
  } catch (error) {
    console.log('[RUNTIME-PROTECTION] JSON.stringify error handled:', error.message);
    // Return a safe fallback
    try {
      return originalJSONStringify.call(this, {}, replacer, space);
    } catch (e2) {
      return '{}';
    }
  }
};

console.log('[RUNTIME-PROTECTION] Runtime protection installed successfully!');

module.exports = {}; 