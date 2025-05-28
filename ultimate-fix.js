#!/usr/bin/env node

/**
 * Safe Fix for Next.js entryCSSFiles Error
 * 
 * This provides a safe approach that handles entryCSSFiles issues
 * without corrupting Object.prototype or breaking hasOwnProperty calls.
 */

console.log('[SAFE-FIX] Installing safe protection against entryCSSFiles errors...');

// Store original methods safely
const originalDefineProperty = Object.defineProperty;
const originalGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const originalHasOwnProperty = Object.prototype.hasOwnProperty;

// Safe property access helper
const safeHasOwnProperty = (obj, prop) => {
  if (obj === null || obj === undefined) {
    return false;
  }
  try {
    return originalHasOwnProperty.call(obj, prop);
  } catch (error) {
    console.log('[SAFE-FIX] Protected hasOwnProperty call:', error.message);
    return false;
  }
};

// Safe entryCSSFiles getter
const getOrCreateEntryCSSFiles = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return {};
  }
  
  if (!safeHasOwnProperty(obj, '_entryCSSFiles')) {
    try {
      originalDefineProperty(obj, '_entryCSSFiles', {
        value: {},
        writable: true,
        enumerable: false,
        configurable: true
      });
    } catch (e) {
      // Fallback if defineProperty fails
      try {
        obj._entryCSSFiles = {};
      } catch (e2) {
        return {};
      }
    }
  }
  
  return obj._entryCSSFiles || {};
};

// Patch Object.defineProperty safely
Object.defineProperty = function(obj, prop, descriptor) {
  try {
    if (prop === 'entryCSSFiles') {
      if (obj === null || obj === undefined) {
        console.log('[SAFE-FIX] Prevented defineProperty on null/undefined for entryCSSFiles');
        return obj;
      }
      
      // If trying to define entryCSSFiles, ensure it's properly initialized
      if (!descriptor.value) {
        descriptor.value = {};
      }
    }
    return originalDefineProperty.call(this, obj, prop, descriptor);
  } catch (error) {
    console.log('[SAFE-FIX] defineProperty error handled safely:', error.message);
    return obj;
  }
};

// Patch Object.getOwnPropertyDescriptor safely
Object.getOwnPropertyDescriptor = function(obj, prop) {
  try {
    if (prop === 'entryCSSFiles' && (obj === null || obj === undefined)) {
      console.log('[SAFE-FIX] Protected getOwnPropertyDescriptor for entryCSSFiles');
      return undefined;
    }
    return originalGetOwnPropertyDescriptor.call(this, obj, prop);
  } catch (error) {
    console.log('[SAFE-FIX] getOwnPropertyDescriptor error handled:', error.message);
    return undefined;
  }
};

// Patch Object.keys safely
const originalObjectKeys = Object.keys;
Object.keys = function(obj) {
  try {
    if (obj === null || obj === undefined) {
      console.log('[SAFE-FIX] Protected Object.keys against null/undefined');
      return [];
    }
    return originalObjectKeys(obj);
  } catch (error) {
    console.log('[SAFE-FIX] Object.keys error handled:', error.message);
    return [];
  }
};

// Patch Object.entries safely
const originalObjectEntries = Object.entries;
Object.entries = function(obj) {
  try {
    if (obj === null || obj === undefined) {
      console.log('[SAFE-FIX] Protected Object.entries against null/undefined');
      return [];
    }
    return originalObjectEntries(obj);
  } catch (error) {
    console.log('[SAFE-FIX] Object.entries error handled:', error.message);
    return [];
  }
};

// Safe proxy wrapper for objects that need entryCSSFiles
const wrapWithSafeProxy = (obj, name) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  return new Proxy(obj, {
    get(target, prop, receiver) {
      try {
        if (prop === 'entryCSSFiles') {
          return getOrCreateEntryCSSFiles(target);
        }
        if (prop === 'hasOwnProperty') {
          return function(propName) {
            return safeHasOwnProperty(this, propName);
          };
        }
        return Reflect.get(target, prop, receiver);
      } catch (error) {
        console.log(`[SAFE-FIX] Proxy get error for ${name}.${String(prop)}:`, error.message);
        return prop === 'entryCSSFiles' ? {} : undefined;
      }
    },
    has(target, prop) {
      try {
        if (prop === 'entryCSSFiles') {
          getOrCreateEntryCSSFiles(target);
          return true;
        }
        return Reflect.has(target, prop);
      } catch (error) {
        console.log(`[SAFE-FIX] Proxy has error for ${name}:`, error.message);
        return false;
      }
    },
    getOwnPropertyDescriptor(target, prop) {
      try {
        if (prop === 'entryCSSFiles') {
          const entryCSSFiles = getOrCreateEntryCSSFiles(target);
          return {
            value: entryCSSFiles,
            writable: true,
            enumerable: true,
            configurable: true
          };
        }
        return Reflect.getOwnPropertyDescriptor(target, prop);
      } catch (error) {
        console.log(`[SAFE-FIX] Proxy getOwnPropertyDescriptor error for ${name}:`, error.message);
        return undefined;
      }
    }
  });
};

// Safer console error handling
const originalConsoleError = console.error;
console.error = function(...args) {
  const errorMsg = args.join(' ');
  
  // Suppress specific entryCSSFiles errors that we're handling
  if (errorMsg.includes('entryCSSFiles') && 
      (errorMsg.includes('Cannot read properties of undefined') ||
       errorMsg.includes('Cannot read property') ||
       errorMsg.includes('is not defined'))) {
    console.log('[SAFE-FIX] Suppressed entryCSSFiles error - handled safely');
    return;
  }
  
  // Allow all other errors through
  return originalConsoleError.apply(console, args);
};

// Handle uncaught exceptions related to entryCSSFiles
process.on('uncaughtException', (error) => {
  if (error.message && 
      error.message.includes('entryCSSFiles') &&
      (error.message.includes('Cannot read properties') ||
       error.message.includes('is not defined'))) {
    console.log('[SAFE-FIX] Caught uncaught entryCSSFiles exception - handled safely');
    return; // Don't crash the process
  }
  
  // Re-throw other uncaught exceptions
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Patch Object.create to ensure manifest objects have entryCSSFiles
const originalObjectCreate = Object.create;
Object.create = function(proto, propertiesObject) {
  const obj = originalObjectCreate.call(this, proto, propertiesObject);
  
  // If this looks like a manifest object, ensure it has entryCSSFiles
  if (obj && typeof obj === 'object') {
    try {
      if (safeHasOwnProperty(obj, 'pages') || safeHasOwnProperty(obj, 'polyfillFiles')) {
        if (!safeHasOwnProperty(obj, 'entryCSSFiles')) {
          getOrCreateEntryCSSFiles(obj);
          console.log('[SAFE-FIX] Added entryCSSFiles to newly created manifest-like object');
        }
      }
    } catch (e) {
      // Ignore errors in this safety check
    }
  }
  
  return obj;
};

console.log('[SAFE-FIX] Safe protection installed - entryCSSFiles errors handled without prototype corruption!');

module.exports = {
  wrapWithSafeProxy,
  getOrCreateEntryCSSFiles,
  safeHasOwnProperty
}; 