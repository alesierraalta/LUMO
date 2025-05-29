'use client';

import { useEffect } from 'react';

/**
 * Component to fix SSL certificate issues with Clerk on Choreo deployments
 * This intercepts requests to the problematic subdomain and redirects to working CDNs
 */
export function ClerkSSLFix() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Check if we're on Choreo
    const isChoreo = window.location.hostname.includes('.choreoapps.dev');
    if (!isChoreo) return;
    
    console.log('[CLERK-SSL-FIX] Applying SSL certificate fix for Choreo');
    
    // Multiple CDN fallbacks
    const clerkCDNs = [
      'https://js.clerk.com/v1/clerk.js',
      'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js',
      'https://unpkg.com/@clerk/clerk-js@5/dist/clerk.browser.js',
      'https://cdnjs.cloudflare.com/ajax/libs/clerk/5.0.0/clerk.browser.js'
    ];
    
    let clerkLoaded = false;
    let loadAttempt = 0;
    
    // Function to test CDN connectivity
    async function testCDNConnectivity(url: string): Promise<boolean> {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        const response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
          mode: 'no-cors' // Allow cross-origin requests
        });
        
        clearTimeout(timeoutId);
        return true; // If we get here, the CDN is accessible
      } catch (error) {
        console.log(`[CLERK-SSL-FIX] CDN test failed for ${url}:`, error);
        return false;
      }
    }
    
    // Function to load Clerk from a specific CDN
    function loadClerkFromCDN(url: string): Promise<boolean> {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.crossOrigin = 'anonymous';
        
        const timeout = setTimeout(() => {
          console.error(`[CLERK-SSL-FIX] Timeout loading from ${url}`);
          document.head.removeChild(script);
          resolve(false);
        }, 10000); // 10 second timeout
        
        script.onload = () => {
          clearTimeout(timeout);
          console.log(`[CLERK-SSL-FIX] ✅ Clerk loaded successfully from ${url}`);
          clerkLoaded = true;
          resolve(true);
        };
        
        script.onerror = (error) => {
          clearTimeout(timeout);
          console.error(`[CLERK-SSL-FIX] ❌ Failed to load from ${url}:`, error);
          document.head.removeChild(script);
          resolve(false);
        };
        
        document.head.appendChild(script);
      });
    }
    
    // Function to try loading from multiple CDNs
    async function tryLoadingClerk() {
      console.log('[CLERK-SSL-FIX] Starting Clerk loading with fallback strategy...');
      
      for (const cdn of clerkCDNs) {
        if (clerkLoaded) break;
        
        loadAttempt++;
        console.log(`[CLERK-SSL-FIX] Attempt ${loadAttempt}: Testing ${cdn}`);
        
        // First test connectivity (for CORS-enabled CDNs)
        if (cdn.includes('js.clerk.com')) {
          const isAccessible = await testCDNConnectivity(cdn);
          if (!isAccessible) {
            console.log(`[CLERK-SSL-FIX] CDN not accessible, skipping: ${cdn}`);
            continue;
          }
        }
        
        // Try to load from this CDN
        const success = await loadClerkFromCDN(cdn);
        if (success) {
          break;
        }
        
        // Wait a bit before trying the next CDN
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (!clerkLoaded) {
        console.error('[CLERK-SSL-FIX] ❌ All CDN attempts failed. Clerk authentication may not work properly.');
        
        // Last resort: Try to create a minimal Clerk replacement or show error
        createClerkFallback();
      }
    }
    
    // Create a minimal fallback for when all CDNs fail
    function createClerkFallback() {
      console.log('[CLERK-SSL-FIX] Creating Clerk fallback...');
      
      // Create a minimal Clerk object to prevent errors
      (window as any).Clerk = {
        load: () => Promise.reject(new Error('Clerk failed to load from all CDNs')),
        isReady: () => false,
        user: null,
        session: null,
        organization: null,
        client: null
      };
      
      // Dispatch a custom event to notify the app about the failure
      window.dispatchEvent(new CustomEvent('clerk-load-failed', {
        detail: { 
          reason: 'All CDNs failed',
          attempts: loadAttempt,
          cdnsTried: clerkCDNs
        }
      }));
    }
    
    // Override fetch to intercept problematic Clerk requests
    const originalFetch = window.fetch;
    
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      
      // Check if this is a Clerk JS request to a problematic subdomain
      if (url.includes('.choreoapps.dev/npm/@clerk/clerk-js') || 
          (url.includes('.choreoapps.dev') && url.includes('clerk'))) {
        
        console.log('[CLERK-SSL-FIX] Intercepting problematic Clerk request:', url);
        
        // Return the first available CDN
        return originalFetch(clerkCDNs[0], init).catch(() => {
          // If first CDN fails, try the second
          return originalFetch(clerkCDNs[1], init);
        });
      }
      
      // For all other requests, use original fetch
      return originalFetch(input, init);
    };
    
    // Start the loading process
    tryLoadingClerk();
    
    // Cleanup function
    return () => {
      window.fetch = originalFetch;
    };
  }, []);
  
  return null; // This component doesn't render anything
}

export default ClerkSSLFix; 