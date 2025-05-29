'use client';

import { useEffect } from 'react';

/**
 * Component to fix SSL certificate issues with Clerk on Choreo deployments
 * This intercepts requests to the problematic subdomain and redirects to the official CDN
 */
export function ClerkSSLFix() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Check if we're on Choreo
    const isChoreo = window.location.hostname.includes('.choreoapps.dev');
    if (!isChoreo) return;
    
    console.log('[CLERK-SSL-FIX] Applying SSL certificate fix for Choreo');
    
    // Override fetch to intercept Clerk JS requests
    const originalFetch = window.fetch;
    
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      
      // Check if this is a Clerk JS request to a problematic subdomain
      if (url.includes('.choreoapps.dev/npm/@clerk/clerk-js') || 
          url.includes('.choreoapps.dev') && url.includes('clerk')) {
        
        console.log('[CLERK-SSL-FIX] Intercepting Clerk request:', url);
        
        // Redirect to official Clerk CDN
        const fixedUrl = 'https://js.clerk.com/v1/clerk.js';
        console.log('[CLERK-SSL-FIX] Redirecting to:', fixedUrl);
        
        return originalFetch(fixedUrl, init);
      }
      
      // For all other requests, use original fetch
      return originalFetch(input, init);
    };
    
    // Also override dynamic imports for Clerk
    if ('webpackChunkName' in window || '__webpack_require__' in (window as any)) {
      console.log('[CLERK-SSL-FIX] Setting up webpack chunk override');
      
      // Override webpack's loading mechanism if available
      const originalWebpackLoad = (window as any).__webpack_require__;
      if (originalWebpackLoad) {
        (window as any).__webpack_require__ = function(moduleId: any) {
          if (typeof moduleId === 'string' && moduleId.includes('clerk')) {
            console.log('[CLERK-SSL-FIX] Intercepting webpack clerk module:', moduleId);
          }
          return originalWebpackLoad(moduleId);
        };
      }
    }
    
    // Set up a script tag to load Clerk from the official CDN
    const clerkScript = document.createElement('script');
    clerkScript.src = 'https://js.clerk.com/v1/clerk.js';
    clerkScript.async = true;
    clerkScript.crossOrigin = 'anonymous';
    clerkScript.onload = () => {
      console.log('[CLERK-SSL-FIX] Clerk loaded successfully from official CDN');
    };
    clerkScript.onerror = (error) => {
      console.error('[CLERK-SSL-FIX] Failed to load Clerk from official CDN:', error);
    };
    
    // Only add if not already present
    if (!document.querySelector('script[src="https://js.clerk.com/v1/clerk.js"]')) {
      document.head.appendChild(clerkScript);
    }
    
    // Cleanup function
    return () => {
      window.fetch = originalFetch;
    };
  }, []);
  
  return null; // This component doesn't render anything
}

export default ClerkSSLFix; 