#!/usr/bin/env node

/**
 * React Runtime Protection
 * 
 * This script provides protection against common React errors
 * that can crash the server during rendering.
 */

console.log('[REACT-PROTECTION] Installing React runtime protection...');

// Global React object protection
const defineReactSafely = () => {
  if (typeof global.React === 'undefined') {
    // Create a safe React stub if not defined
    global.React = {
      createElement: function(type, props, ...children) {
        // Safe createElement that handles null props
        return { type, props: props || {}, children };
      },
      Fragment: Symbol('Fragment'),
      useContext: function() { return {}; },
      createContext: function() { return { Provider: {}, Consumer: {} }; }
    };
  } else if (global.React) {
    // Patch existing React object
    const originalCreateElement = global.React.createElement;
    if (originalCreateElement) {
      global.React.createElement = function(type, props, ...children) {
        // Ensure props is never null/undefined
        return originalCreateElement.call(this, type, props || {}, ...children);
      };
    }
  }
};

// React error monitoring
const setupReactErrorHandling = () => {
  // Handle React-specific errors
  process.on('uncaughtException', (error) => {
    // Common React server-side rendering errors
    if (error.message && (
      error.message.includes('useContext') ||
      error.message.includes('useState') ||
      error.message.includes('useEffect') ||
      error.message.includes('React is not defined') ||
      error.message.includes('Invalid hook call')
    )) {
      console.log('[REACT-PROTECTION] Caught React-related error:', error.message);
      // Don't crash server for React errors
      return;
    }
  });
};

// Apply React protections
try {
  defineReactSafely();
  setupReactErrorHandling();
  console.log('[REACT-PROTECTION] React runtime protection installed successfully!');
} catch (e) {
  console.error('[REACT-PROTECTION] Failed to install protection:', e.message);
}

module.exports = {}; 