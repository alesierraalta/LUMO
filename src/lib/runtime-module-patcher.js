/**
 * ULTRA-MINIMAL RUNTIME MODULE PATCHER
 * Fastest possible module patching for Choreo dev environment
 */

const path = require('path');
const Module = require('module');

// Cache for performance
const patchCache = new Map();

// Minimal patching - only what's absolutely necessary
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  // Fast path - check cache first
  if (patchCache.has(id)) {
    return patchCache.get(id);
  }

  // Only patch problematic Supabase modules
  if (id === '@supabase/realtime-js' || id.includes('realtime-js')) {
    try {
      const fallbackPath = path.join(process.cwd(), 'src/lib/realtime-fallback.js');
      const fallback = originalRequire.call(this, fallbackPath);
      patchCache.set(id, fallback);
      return fallback;
    } catch (error) {
      // Silent fallback
      const mockFallback = {
        RealtimeClient: class MockRealtimeClient {
          constructor() {}
          connect() { return Promise.resolve(); }
          disconnect() { return Promise.resolve(); }
          channel() { return { subscribe: () => {}, unsubscribe: () => {} }; }
        }
      };
      patchCache.set(id, mockFallback);
      return mockFallback;
    }
  }

  // Default behavior for all other modules
  return originalRequire.call(this, id);
};

// Minimal initialization message
if (process.env.CHOREO_SILENT !== 'true') {
  console.log('🔧 Runtime patcher: Ready');
} 