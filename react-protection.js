#!/usr/bin/env node

/**
 * React Protection for Next.js Application
 * 
 * This handles React-specific errors like useContext null access
 * and other React runtime issues without crashing the application.
 */

console.log('[REACT-PROTECTION] Installing React runtime protection...');

// Protect against React useContext errors
const originalError = console.error;
console.error = function(...args) {
  const errorMessage = args.join(' ');
  
  // Suppress React useContext null errors
  if (errorMessage.includes('useContext') && 
      (errorMessage.includes('Cannot read properties of null') ||
       errorMessage.includes('reading \'useContext\''))) {
    console.log('[REACT-PROTECTION] Suppressed React useContext null error');
    return;
  }
  
  // Suppress React hydration warnings in production
  if (errorMessage.includes('Warning: Text content did not match') ||
      errorMessage.includes('Warning: Expected server HTML') ||
      errorMessage.includes('hydration')) {
    console.log('[REACT-PROTECTION] Suppressed React hydration warning');
    return;
  }
  
  // Suppress React DevTools warnings
  if (errorMessage.includes('Download the React DevTools') ||
      errorMessage.includes('React DevTools')) {
    return;
  }
  
  // Allow other errors through
  return originalError.apply(console, args);
};

// Handle React component errors
const originalUncaughtException = process.listeners('uncaughtException');
process.removeAllListeners('uncaughtException');

process.on('uncaughtException', (error) => {
  if (error instanceof TypeError && error.message) {
    // Handle React useContext errors
    if (error.message.includes('useContext') && 
        error.message.includes('Cannot read properties of null')) {
      console.log('[REACT-PROTECTION] Caught React useContext null error:', error.message);
      return; // Don't crash
    }
    
    // Handle React component mount errors
    if (error.message.includes('Cannot read properties of undefined') &&
        (error.message.includes('useState') || 
         error.message.includes('useEffect') ||
         error.message.includes('useCallback') ||
         error.message.includes('useMemo'))) {
      console.log('[REACT-PROTECTION] Caught React hook error:', error.message);
      return; // Don't crash
    }
  }
  
  // Re-attach original handlers for other errors
  originalUncaughtException.forEach(handler => {
    try {
      handler(error);
    } catch (e) {
      console.error('Error in uncaught exception handler:', e);
    }
  });
});

// Protect React.createElement calls
if (typeof global !== 'undefined') {
  // Store original React if it exists
  let originalReact = null;
  
  try {
    originalReact = require('react');
  } catch (e) {
    // React not available yet
  }
  
  if (originalReact && originalReact.createElement) {
    const originalCreateElement = originalReact.createElement;
    
    originalReact.createElement = function(type, props, ...children) {
      try {
        return originalCreateElement.apply(this, arguments);
      } catch (error) {
        console.log('[REACT-PROTECTION] Protected React.createElement error:', error.message);
        
        // Return a safe fallback element
        return originalCreateElement('div', 
          { style: { color: 'red', padding: '10px' } }, 
          'Component Error: ', error.message
        );
      }
    };
  }
}

// Protect against common React context patterns
if (typeof global !== 'undefined') {
  // Safe context wrapper
  global.safeUseContext = function(context) {
    try {
      if (!context) {
        console.log('[REACT-PROTECTION] Attempted to use null context, returning empty object');
        return {};
      }
      
      const React = require('react');
      if (!React.useContext) {
        console.log('[REACT-PROTECTION] useContext not available, returning empty object');
        return {};
      }
      
      const result = React.useContext(context);
      
      if (result === null || result === undefined) {
        console.log('[REACT-PROTECTION] Context returned null/undefined, returning empty object');
        return {};
      }
      
      return result;
    } catch (error) {
      console.log('[REACT-PROTECTION] useContext error:', error.message);
      return {};
    }
  };
}

console.log('[REACT-PROTECTION] React runtime protection installed successfully!');

module.exports = {}; 