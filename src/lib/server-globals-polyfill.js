/**
 * SERVER GLOBALS POLYFILL
 * Provides safe fallbacks for browser globals during server-side builds
 * Prevents "self is not defined" and similar errors
 */

// Create a safe self implementation for server-side execution
const serverSelf = {
  // Webpack chunk management (critical for build)
  webpackChunk_N_E: [],
  
  // Basic global properties
  global: global,
  
  // Console for debugging
  console: console,
  
  // Timers
  setTimeout: global.setTimeout,
  clearTimeout: global.clearTimeout,
  setInterval: global.setInterval,
  clearInterval: global.clearInterval,
  
  // Process information
  process: global.process,
  
  // Buffer for Node.js compatibility
  Buffer: global.Buffer,
  
  // URL APIs
  URL: global.URL,
  URLSearchParams: global.URLSearchParams,
  
  // Event handling stubs (minimal implementation)
  addEventListener: function() {},
  removeEventListener: function() {},
  dispatchEvent: function() {},
  
  // Browser APIs that should be undefined on server
  window: undefined,
  document: undefined,
  navigator: undefined,
  location: undefined,
};

// Make self reference itself (circular reference like in browsers)
serverSelf.self = serverSelf;

// Export the polyfilled self
module.exports = serverSelf; 