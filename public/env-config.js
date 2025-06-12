// LUMO Inventory - Client Environment Variables
// Auto-generated during build process
(function() {
  'use strict';
  console.log('[LUMO-CLIENT-ENV] Loading client environment variables...');
  // Public environment variables safe for client-side
  var env = {
  "NODE_ENV": "test",
  "NEXT_PUBLIC_APP_VERSION": "1.0.0"
};
  // Set up window.__NEXT_ENV__ for Next.js compatibility
  if (typeof window !== 'undefined') {
    window.__NEXT_ENV__ = env;
    // Polyfill process.env for libraries that expect it
    if (!window.process) {
      window.process = {};
    }
    if (!window.process.env) {
      window.process.env = {};
    }
    // Copy environment variables to process.env polyfill
    Object.assign(window.process.env, env);
    console.log('[LUMO-CLIENT-ENV] ✅ Environment variables loaded');
    console.log('[LUMO-CLIENT-ENV] Available:', Object.keys(env));
  }
})();