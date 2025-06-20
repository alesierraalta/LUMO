/**
 * RUNTIME MODULE PATCHER
 * Patches Node.js module system to redirect @supabase/realtime-js imports
 * Works at runtime regardless of webpack configuration
 */

const path = require('path');
const Module = require('module');

// Store original require function
const originalRequire = Module.prototype.require;

// Create comprehensive fallback path
const fallbackPath = path.resolve(__dirname, 'realtime-fallback.js');

console.log('🔧 Runtime Module Patcher: Initializing Supabase realtime fallback');
console.log('📁 Fallback path:', fallbackPath);

// Patch Module.prototype.require
Module.prototype.require = function(id) {
  // Intercept all @supabase/realtime-js related imports
  if (id === '@supabase/realtime-js' || 
      id.startsWith('@supabase/realtime-js/') ||
      id.includes('realtime-js')) {
    
    console.log('🔄 Intercepted realtime-js import:', id, '-> redirecting to fallback');
    
    try {
      // Return our fallback module
      return originalRequire.call(this, fallbackPath);
    } catch (error) {
      console.warn('⚠️ Fallback module load failed:', error.message);
      // Return minimal fallback if file doesn't exist
      return {
        RealtimeClient: class { 
          constructor() { this.channels = []; }
          connect() { return Promise.resolve(); }
          disconnect() { return Promise.resolve(); }
          channel() { return { subscribe: () => Promise.resolve(), unsubscribe: () => Promise.resolve() }; }
        },
        RealtimeChannel: class {
          constructor() { this.state = 'closed'; }
          subscribe() { return Promise.resolve(); }
          unsubscribe() { return Promise.resolve(); }
        }
      };
    }
  }
  
  // For all other modules, use original require
  return originalRequire.call(this, id);
};

// Also patch require.resolve for module resolution
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent, isMain) {
  if (request === '@supabase/realtime-js' || 
      request.startsWith('@supabase/realtime-js/') ||
      request.includes('realtime-js')) {
    
    console.log('🔍 Resolving realtime-js module:', request, '-> redirecting to fallback');
    return fallbackPath;
  }
  
  return originalResolve.call(this, request, parent, isMain);
};

// Export for confirmation
module.exports = {
  patched: true,
  fallbackPath,
  timestamp: new Date().toISOString()
};

console.log('✅ Runtime Module Patcher: Successfully initialized');
console.log('🛡️ All @supabase/realtime-js imports will be redirected to fallback'); 