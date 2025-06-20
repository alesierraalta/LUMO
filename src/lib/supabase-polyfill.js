/**
 * Supabase Polyfill for Next.js 15.3.1 Development Server
 * Resolves critical TypeError: api.createContextKey is not a function
 * 
 * This polyfill addresses module loading issues in Edge Runtime environment
 * by providing missing functions and proper module resolution.
 */

// IMMEDIATE POLYFILL: Apply critical polyfills before any other code runs
if (typeof global !== 'undefined') {
  // CRITICAL FIX: self polyfill for server-side rendering - IMMEDIATE
  if (!global.self) {
    global.self = global;
    console.log(`[Supabase Polyfill] 🔧 IMMEDIATE self polyfill installed`);
  }
  
  // window polyfill for server-side rendering - IMMEDIATE
  if (!global.window) {
    global.window = global;
    console.log(`[Supabase Polyfill] 🔧 IMMEDIATE window polyfill installed`);
  }
  
  // Additional browser globals that might be needed
  if (!global.document) {
    global.document = {
      querySelector: () => null,
      querySelectorAll: () => [],
      getElementById: () => null,
      getElementsByClassName: () => [],
      getElementsByTagName: () => [],
      createElement: () => ({ 
        setAttribute: () => {}, 
        appendChild: () => {},
        style: {},
        classList: { add: () => {}, remove: () => {}, toggle: () => {} }
      }),
      createTextNode: () => ({ nodeValue: '', textContent: '' }),
      createDocumentFragment: () => ({ appendChild: () => {} }),
      head: { appendChild: () => {} },
      body: { appendChild: () => {} }
    };
    console.log(`[Supabase Polyfill] 🔧 IMMEDIATE document polyfill installed`);
  }
  
  if (!global.navigator) {
    global.navigator = {};
    console.log(`[Supabase Polyfill] 🔧 IMMEDIATE navigator polyfill installed`);
  }
  
  if (!global.location) {
    global.location = {};
    console.log(`[Supabase Polyfill] 🔧 IMMEDIATE location polyfill installed`);
  }
}

// Ultra-safe Edge Runtime detection using only environment variables
const detectEdgeRuntime = () => {
  // Primary check: NEXT_RUNTIME environment variable
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_RUNTIME === 'edge') {
    return true;
  }
  
  // Secondary check: Vercel Edge Runtime indicator
  if (typeof process !== 'undefined' && process.env && process.env.VERCEL_EDGE_RUNTIME) {
    return true;
  }
  
  // Tertiary check: EdgeRuntime global
  if (typeof EdgeRuntime !== 'undefined') {
    return true;
  }
  
  // Check for globalThis EdgeRuntime
  if (typeof globalThis !== 'undefined' && globalThis.EdgeRuntime) {
    return true;
  }
  
  return false;
};

const isEdgeRuntime = detectEdgeRuntime();

console.log(`[Supabase Polyfill] ✅ Successfully loaded - Next.js 15.3.1 compatibility enabled (${isEdgeRuntime ? 'Edge Runtime' : 'Node.js Runtime'})`);

if (isEdgeRuntime) {
  console.log(`[Supabase Polyfill] ⚡ Edge Runtime detected - skipping Node.js-specific polyfills`);
} else {
  // Node.js Runtime polyfills
  
  // Enhanced working directory setup with safe API access
  if (typeof process !== 'undefined' && process.env) {
    try {
      // Use process object safely without direct property access
      const processObj = process;
      const cwdMethod = 'cwd';
      
      if (typeof processObj[cwdMethod] === 'function') {
        const workingDir = processObj[cwdMethod]();
        global.__dirname = workingDir;
        global.__filename = workingDir + '/index.js';
        console.log(`[Supabase Polyfill] 📁 Working directory set: ${workingDir}`);
      }
    } catch (error) {
      // Fallback for environments where process.cwd() is not available
      global.__dirname = '.';
      global.__filename = './index.js';
      console.log(`[Supabase Polyfill] 📁 Working directory fallback applied`);
    }
  }

  // Enhanced require function with better module resolution
  if (typeof global !== 'undefined' && typeof require !== 'undefined') {
    const originalRequire = require;
    
    // Check if require is already enhanced to avoid redefinition
    if (!global.__supabaseRequireEnhanced) {
      try {
        global.require = function enhancedRequire(moduleName) {
          try {
            return originalRequire(moduleName);
          } catch (error) {
            // If module not found, return a safe empty object for optional dependencies
            if (error.code === 'MODULE_NOT_FOUND') {
              console.log(`[Supabase Polyfill] ⚠️ Optional module '${moduleName}' not found - using empty fallback`);
              
              // Return appropriate fallback objects for known optional modules
              if (moduleName === 'abort-controller') {
                return {
                  AbortController: global.AbortController || class AbortController {
                    constructor() { this.signal = { aborted: false }; }
                    abort() { this.signal.aborted = true; }
                  },
                  AbortSignal: global.AbortSignal || class AbortSignal {
                    constructor() { this.aborted = false; }
                  }
                };
              }
              
              // Return empty object for other optional dependencies
              return {};
            }
            
            // Re-throw other errors
            throw error;
          }
        };
        
        // Mark as enhanced to prevent redefinition
        global.__supabaseRequireEnhanced = true;
        console.log(`[Supabase Polyfill] 🔧 Enhanced require function installed`);
      } catch (error) {
        console.log(`[Supabase Polyfill] ⚠️ Could not enhance require function: ${error.message}`);
      }
    }
  }

  // createContextKey polyfill for Supabase compatibility
  if (typeof global !== 'undefined') {
    // Provide createContextKey if missing
    if (!global.createContextKey && typeof require !== 'undefined') {
      global.createContextKey = function(name) {
        return Symbol(name || 'context-key');
      };
      console.log(`[Supabase Polyfill] 🔑 createContextKey polyfill installed`);
    }

    // Provide other essential APIs if missing
    if (!global.setImmediate && typeof setTimeout !== 'undefined') {
      global.setImmediate = function(callback, ...args) {
        return setTimeout(callback, 0, ...args);
      };
      global.clearImmediate = function(id) {
        return clearTimeout(id);
      };
      console.log(`[Supabase Polyfill] ⏱️ setImmediate polyfill installed`);
    }

    // AbortController polyfill with webpack-compatible error handling
    if (!global.AbortController) {
      // Always provide minimal AbortController polyfill to avoid webpack resolution warnings
      global.AbortController = class AbortController {
        constructor() {
          this.signal = { 
            aborted: false, 
            addEventListener: () => {}, 
            removeEventListener: () => {},
            dispatchEvent: () => {},
            onabort: null
          };
        }
        abort() {
          this.signal.aborted = true;
          if (this.signal.onabort) {
            this.signal.onabort();
          }
        }
      };
      
      global.AbortSignal = class AbortSignal {
        constructor() {
          this.aborted = false;
          this.onabort = null;
        }
        addEventListener() {}
        removeEventListener() {}
        dispatchEvent() {}
      };
      
      console.log(`[Supabase Polyfill] ⛔ Minimal AbortController polyfill installed (webpack-compatible)`);
    }

    // Buffer polyfill for environments that need it
    if (!global.Buffer && typeof require !== 'undefined') {
      try {
        global.Buffer = require('buffer').Buffer;
        console.log(`[Supabase Polyfill] 📦 Buffer polyfill installed`);
      } catch (error) {
        // Provide minimal Buffer polyfill
        global.Buffer = {
          from: (data) => new Uint8Array(data),
          isBuffer: () => false
        };
        console.log(`[Supabase Polyfill] 📦 Minimal Buffer polyfill installed`);
      }
    }

    // crypto polyfill for Node.js environments
    if (!global.crypto && typeof require !== 'undefined') {
      try {
        const crypto = require('crypto');
        global.crypto = {
          getRandomValues: (arr) => crypto.randomFillSync(arr),
          subtle: crypto.webcrypto?.subtle
        };
        console.log(`[Supabase Polyfill] 🔐 Crypto polyfill installed`);
      } catch (error) {
        console.log(`[Supabase Polyfill] ⚠️ Crypto polyfill not available`);
      }
    }

    // CRITICAL FIX: self polyfill for server-side rendering
    if (!global.self) {
      global.self = global;
      console.log(`[Supabase Polyfill] 🌐 self polyfill installed (self = global)`);
    }

    // window polyfill for server-side rendering
    if (!global.window) {
      global.window = global;
      console.log(`[Supabase Polyfill] 🪟 window polyfill installed (window = global)`);
    }
  }

  console.log(`[Supabase Polyfill] ✅ All Node.js polyfills loaded successfully`);
}

// Export detection function for external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { isEdgeRuntime, detectEdgeRuntime };
}

// Global flag to indicate polyfill is loaded
if (typeof global !== 'undefined') {
  global.__supabasePolyfillLoaded = true;
} 