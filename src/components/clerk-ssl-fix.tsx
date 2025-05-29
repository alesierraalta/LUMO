'use client';

import { useEffect } from 'react';

// Extend the Window interface to include Clerk
declare global {
  interface Window {
    Clerk?: any;
    __CLERK_INTERCEPTED__?: boolean;
    __ORIGINAL_FETCH__?: typeof fetch;
  }
}

/**
 * AGGRESSIVE Clerk SSL Fix for Choreo
 * This completely intercepts and blocks problematic requests
 */
export function ClerkSSLFix() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Check if we're on Choreo
    const isChoreo = window.location.hostname.includes('.choreoapps.dev');
    if (!isChoreo) {
      console.log('[CLERK-SSL-FIX] Not on Choreo, skipping SSL fix');
      return;
    }
    
    console.log('[CLERK-SSL-FIX] 🚨🚨🚨 EMERGENCY CLERK INTERCEPTOR ACTIVATED 🚨🚨🚨');
    console.log('[CLERK-SSL-FIX] Current URL:', window.location.href);
    console.log('[CLERK-SSL-FIX] User Agent:', navigator.userAgent);
    console.log('[CLERK-SSL-FIX] Timestamp:', new Date().toISOString());
    
    // Prevent multiple interceptors
    if (window.__CLERK_INTERCEPTED__) {
      console.log('[CLERK-SSL-FIX] ⚠️ Interceptor already active, skipping');
      return;
    }
    
    window.__CLERK_INTERCEPTED__ = true;
    
    // Store original fetch if not already stored
    if (!window.__ORIGINAL_FETCH__) {
      window.__ORIGINAL_FETCH__ = window.fetch;
      console.log('[CLERK-SSL-FIX] 💾 Original fetch stored');
    }
    
    // Working CDN URLs in priority order
    const workingCDNs = [
      'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@latest/dist/clerk.browser.js',
      'https://unpkg.com/@clerk/clerk-js@latest/dist/clerk.browser.js',
      'https://cdnjs.cloudflare.com/ajax/libs/clerk/4.70.0/clerk.browser.min.js'
    ];
    
    // AGGRESSIVE FETCH INTERCEPTOR
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : 
                  input instanceof URL ? input.href : 
                  input instanceof Request ? input.url : String(input);
      
      console.log('[CLERK-SSL-FIX] 🌐 INTERCEPTING REQUEST:', url);
      
      // Block and redirect ALL js.clerk.com requests
      if (url.includes('js.clerk.com')) {
        console.log('[CLERK-SSL-FIX] 🚫 BLOCKING js.clerk.com request:', url);
        console.log('[CLERK-SSL-FIX] 🔄 REDIRECTING to working CDN...');
        
        // Try each CDN until one works
        for (let i = 0; i < workingCDNs.length; i++) {
          const cdnUrl = workingCDNs[i];
          console.log(`[CLERK-SSL-FIX] 🎯 Attempt ${i + 1}: Testing ${cdnUrl}`);
          
          try {
            const response = await window.__ORIGINAL_FETCH__!(cdnUrl, {
              ...init,
              method: 'GET',
              headers: {
                'Accept': 'application/javascript, text/javascript, */*',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            });
            
            if (response.ok) {
              console.log(`[CLERK-SSL-FIX] ✅ SUCCESS with CDN ${i + 1}: ${cdnUrl}`);
              console.log('[CLERK-SSL-FIX] 📊 Response status:', response.status);
              console.log('[CLERK-SSL-FIX] 📋 Response headers:', Object.fromEntries(response.headers.entries()));
              return response;
            } else {
              console.log(`[CLERK-SSL-FIX] ❌ CDN ${i + 1} failed with status:`, response.status);
            }
          } catch (error: any) {
            console.log(`[CLERK-SSL-FIX] 💥 CDN ${i + 1} error:`, error.message);
          }
        }
        
        // If all CDNs fail, throw error
        console.error('[CLERK-SSL-FIX] 🆘 ALL CDNs FAILED - CRITICAL ERROR');
        throw new Error('All Clerk CDNs failed to load');
      }
      
      // For non-Clerk requests, use original fetch
      return window.__ORIGINAL_FETCH__!(input, init);
    };
    
    console.log('[CLERK-SSL-FIX] ✅ Aggressive fetch interceptor installed');
    
    // Also intercept XMLHttpRequest for older code
    const originalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
      const xhr = new originalXHR();
      const originalOpen = xhr.open;
      
      xhr.open = function(method: string, url: string | URL, async?: boolean, user?: string | null, password?: string | null) {
        const urlString = typeof url === 'string' ? url : url.toString();
        
        if (urlString.includes('js.clerk.com')) {
          console.log('[CLERK-SSL-FIX] 🚫 BLOCKING XHR to js.clerk.com:', urlString);
          console.log('[CLERK-SSL-FIX] 🔄 XHR will be redirected to working CDN');
          
          // Redirect to first working CDN
          return originalOpen.call(this, method, workingCDNs[0], async ?? true, user, password);
        }
        
        return originalOpen.call(this, method, urlString, async ?? true, user, password);
      };
      
      return xhr;
    } as any;
    
    console.log('[CLERK-SSL-FIX] ✅ XMLHttpRequest interceptor installed');
    
    // Monitor for Clerk loading
    const checkClerkLoading = () => {
      console.log('[CLERK-SSL-FIX] 🔍 Checking Clerk loading status...');
      console.log('[CLERK-SSL-FIX] 📊 window.Clerk exists:', !!window.Clerk);
      
      if (window.Clerk) {
        console.log('[CLERK-SSL-FIX] 🎉 CLERK LOADED SUCCESSFULLY!');
        console.log('[CLERK-SSL-FIX] 📋 Clerk object keys:', Object.keys(window.Clerk));
        console.log('[CLERK-SSL-FIX] 🔧 Clerk version:', (window.Clerk as any).version || 'Unknown');
      } else {
        console.log('[CLERK-SSL-FIX] ⏳ Clerk still loading...');
        setTimeout(checkClerkLoading, 1000);
      }
    };
    
    // Start monitoring
    setTimeout(checkClerkLoading, 500);
    
    // Cleanup function
    return () => {
      console.log('[CLERK-SSL-FIX] 🧹 Cleaning up interceptors');
      if (window.__ORIGINAL_FETCH__) {
        window.fetch = window.__ORIGINAL_FETCH__;
      }
      window.__CLERK_INTERCEPTED__ = false;
    };
  }, []);

  return null;
}

export default ClerkSSLFix; 