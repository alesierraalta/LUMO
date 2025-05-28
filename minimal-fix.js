#!/usr/bin/env node

/**
 * Minimal Runtime Fixes for Next.js Deployment
 * 
 * This script applies critical runtime fixes for Next.js deployment 
 * issues in containerized environments like Choreo.
 */

// Fix process.env.APP_NEXT_ROOT_DIR
if (!process.env.APP_NEXT_ROOT_DIR) {
  process.env.APP_NEXT_ROOT_DIR = process.cwd();
  console.log('[MINIMAL-FIX] Set APP_NEXT_ROOT_DIR to', process.env.APP_NEXT_ROOT_DIR);
}

// Set next telemetry to disabled
process.env.NEXT_TELEMETRY_DISABLED = '1';

// Fix document missing error
try {
  if (typeof globalThis.document === 'undefined' && typeof document === 'undefined') {
    globalThis.document = {
      createElement: () => ({}),
      head: { appendChild: () => {} },
      documentElement: {
        style: {},
        setAttribute: () => {}
      }
    };
    console.log('[MINIMAL-FIX] Added placeholder document for SSR');
  }
} catch (e) {
  console.log('[MINIMAL-FIX] Error fixing document:', e.message);
}

// Patch console to avoid breaking on circular references
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

try {
  console.log = function(...args) {
    try {
      originalConsoleLog.apply(console, args);
    } catch (e) {
      originalConsoleLog('Error in console.log (circular reference):', e.message);
    }
  };
  
  console.error = function(...args) {
    try {
      originalConsoleError.apply(console, args);
    } catch (e) {
      originalConsoleLog('Error in console.error (circular reference):', e.message);
    }
  };
} catch (e) {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
}

// Fix entryCSSFiles not iterable error
try {
  const nextRequire = require('next/dist/server/require');
  if (nextRequire && nextRequire.default && nextRequire.default.onConfigurationChange) {
    const original = nextRequire.default.onConfigurationChange;
    nextRequire.default.onConfigurationChange = function(configuration) {
      try {
        return original(configuration);
      } catch (e) {
        if (e.message && e.message.includes('entryCSSFiles')) {
          console.log('[MINIMAL-FIX] Caught and fixed entryCSSFiles error');
          if (!configuration.entryCSSFiles) {
            configuration.entryCSSFiles = new Map();
          }
          return original(configuration);
        }
        throw e;
      }
    };
    console.log('[MINIMAL-FIX] Patched next/dist/server/require');
  }
} catch (e) {
  console.log('[MINIMAL-FIX] Could not patch entryCSSFiles error:', e.message);
}

// Fix potential 'Cannot read properties of null' error from React
try {
  const originalCreateElement = require('react').createElement;
  if (originalCreateElement) {
    require('react').createElement = function(type, props, ...children) {
      if (props === null) props = {};
      return originalCreateElement(type, props, ...children);
    };
    console.log('[MINIMAL-FIX] Patched React.createElement for null props');
  }
} catch (e) {
  console.log('[MINIMAL-FIX] Could not patch React.createElement:', e.message);
}

// Network connectivity check
try {
  const http = require('http');
  const testConnectivity = () => {
    const req = http.get('http://127.0.0.1:' + (process.env.PORT || 8080) + '/health', res => {
      console.log('[MINIMAL-FIX] Local connectivity test: HTTP', res.statusCode);
    });
    
    req.on('error', (e) => {
      console.log('[MINIMAL-FIX] Local connectivity test: Failed -', e.message);
    });
    
    req.setTimeout(1000, () => {
      req.destroy();
    });
  };
  
  // Run connectivity test after server startup (assume 5 seconds)
  setTimeout(testConnectivity, 5000);
} catch (e) {
  console.log('[MINIMAL-FIX] Connectivity test error:', e.message);
}

console.log('[MINIMAL-FIX] Applied minimal runtime fixes for Next.js deployment');

module.exports = { ensureManifestStructure }; 