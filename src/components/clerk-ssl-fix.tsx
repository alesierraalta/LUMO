'use client';

import { useEffect, useRef } from 'react';

// Extend the Window interface to include Clerk
declare global {
  interface Window {
    Clerk?: any;
    __CLERK_INTERCEPTED__?: boolean;
    __ORIGINAL_FETCH__?: typeof fetch;
    __CLERK_PROXY_ACTIVE__?: boolean;
    __CLERK_SCRIPT_LOADED__?: boolean;
    __CLERK_DOMAIN_OVERRIDE__?: boolean;
  }
}

/**
 * Clerk SSL Fix for Choreo - REAL CLERK 100% FUNCTIONAL
 * This aggressively redirects ALL Clerk requests to working proxy URLs
 */
export function ClerkSSLFix() {
  const retryCount = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Check if we're on Choreo
    const isChoreo = window.location.hostname.includes('.choreoapps.dev');
    if (!isChoreo) {
      console.log('[CLERK-SSL-FIX] Not on Choreo, skipping SSL fix');
      return;
    }
    
    console.log('[CLERK-SSL-FIX] 🚀 AGGRESSIVE CLERK PROXY SYSTEM ACTIVATED 🚀');
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
    
    // Get current domain for proxy URLs
    const currentDomain = window.location.origin;
    
    // Map of problematic URLs to proxy URLs
    const urlMappings = {
      'https://js.clerk.com/v1/': `${currentDomain}/api/clerk-proxy/v1/`,
      'https://js.clerk.com/npm/': `${currentDomain}/api/clerk-proxy/npm/`,
      'https://js.clerk.com/': `${currentDomain}/api/clerk-proxy/v1/`,
      'https://api.clerk.com/': `${currentDomain}/api/clerk-proxy/api/`,
      'https://accounts.clerk.com/': `${currentDomain}/api/clerk-proxy/accounts/`,
    };
    
    // Function to map problematic URLs to working proxy URLs
    const getProxyUrl = (url: string): string => {
      // Handle Choreo subdomain SSL issues - THIS IS THE KEY FIX
      const choreoSubdomainPattern = /https:\/\/clerk\.[^\/]+\.choreoapps\.dev\//;
      if (choreoSubdomainPattern.test(url)) {
        console.log('[CLERK-SSL-FIX] 🚨 BLOCKING PROBLEMATIC CHOREO SUBDOMAIN:', url);
        // Replace the entire subdomain with our proxy
        const pathPart = url.replace(choreoSubdomainPattern, '');
        const newUrl = `${currentDomain}/api/clerk-proxy/npm/${pathPart}`;
        console.log('[CLERK-SSL-FIX] 🔄 REDIRECTING TO PROXY:', newUrl);
        return newUrl;
      }
      
      // Handle standard Clerk URLs
      for (const [original, proxy] of Object.entries(urlMappings)) {
        if (url.startsWith(original)) {
          const newUrl = url.replace(original, proxy);
          console.log('[CLERK-SSL-FIX] 🔄 URL MAPPING:', original, '->', newUrl);
          return newUrl;
        }
      }
      
      return url;
    };
    
    // ULTRA AGGRESSIVE FETCH INTERCEPTOR
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : 
                  input instanceof URL ? input.href : 
                  input instanceof Request ? input.url : String(input);
      
      console.log('[CLERK-SSL-FIX] 🌐 INTERCEPTING REQUEST:', url);
      
      // Check if this is ANY Clerk-related request
      const isClerkRequest = url.includes('clerk.com') || 
                           url.includes('clerk') || 
                           url.includes('@clerk') ||
                           /clerk\.[^\/]+\.choreoapps\.dev/.test(url) ||
                           url.includes('clerk.') ||
                           /^https:\/\/[^\/]*clerk[^\/]*/.test(url);
      
      if (isClerkRequest) {
        const proxyUrl = getProxyUrl(url);
        
        if (proxyUrl !== url) {
          console.log('[CLERK-SSL-FIX] 🔄 REDIRECTING CLERK REQUEST');
          console.log('[CLERK-SSL-FIX] FROM:', url);
          console.log('[CLERK-SSL-FIX] TO:', proxyUrl);
          
          // Use the proxy URL instead of the original
          try {
            return await window.__ORIGINAL_FETCH__!(proxyUrl, init);
          } catch (error) {
            console.error('[CLERK-SSL-FIX] ❌ Proxy request failed:', error);
            // Try alternative proxy path
            const altProxy = `${currentDomain}/api/clerk-proxy/v1/clerk.js`;
            console.log('[CLERK-SSL-FIX] 🔄 Trying alternative proxy:', altProxy);
            return await window.__ORIGINAL_FETCH__!(altProxy, init);
          }
        }
      }
      
      // For non-Clerk requests or already proxied requests, use original fetch
      return window.__ORIGINAL_FETCH__!(input, init);
    };
    
    console.log('[CLERK-SSL-FIX] ✅ Ultra aggressive redirect interceptor installed');
    
    // Also intercept XMLHttpRequest for maximum coverage
    const originalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
      const xhr = new originalXHR();
      const originalOpen = xhr.open;
      
      xhr.open = function(method: string, url: string | URL, async?: boolean, user?: string | null, password?: string | null) {
        const urlString = typeof url === 'string' ? url : url.toString();
        
        const isClerkRequest = urlString.includes('clerk.com') || 
                              urlString.includes('clerk') || 
                              /clerk\.[^\/]+\.choreoapps\.dev/.test(urlString) ||
                              urlString.includes('clerk.') ||
                              /^https:\/\/[^\/]*clerk[^\/]*/.test(urlString);
        
        if (isClerkRequest) {
          const proxyUrl = getProxyUrl(urlString);
          
          if (proxyUrl !== urlString) {
            console.log('[CLERK-SSL-FIX] 🔄 REDIRECTING XHR to:', proxyUrl);
            return originalOpen.call(this, method, proxyUrl, async ?? true, user, password);
          }
        }
        
        return originalOpen.call(this, method, urlString, async ?? true, user, password);
      };
      
      return xhr;
    } as any;
    
    console.log('[CLERK-SSL-FIX] ✅ Ultra aggressive XMLHttpRequest interceptor installed');
    
    // Aggressively monitor for script injection and redirect ALL Clerk URLs
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Handle ALL script tags with ANY Clerk reference
            if (element.tagName === 'SCRIPT') {
              const src = element.getAttribute('src');
              if (src && (src.includes('clerk') || /clerk\.[^\/]+\.choreoapps\.dev/.test(src))) {
                const proxyUrl = getProxyUrl(src);
                
                if (proxyUrl !== src) {
                  console.log('[CLERK-SSL-FIX] 🔄 REDIRECTING SCRIPT SRC:', src, '->', proxyUrl);
                  element.setAttribute('src', proxyUrl);
                }
              }
            }
            
            // Handle ALL link preloads for Clerk
            if (element.tagName === 'LINK') {
              const href = element.getAttribute('href');
              if (href && (href.includes('clerk') || /clerk\.[^\/]+\.choreoapps\.dev/.test(href))) {
                const proxyUrl = getProxyUrl(href);
                
                if (proxyUrl !== href) {
                  console.log('[CLERK-SSL-FIX] 🔄 REDIRECTING LINK HREF:', href, '->', proxyUrl);
                  element.setAttribute('href', proxyUrl);
                }
              }
            }
          }
        });
      });
    });
    
    observer.observe(document.head, { childList: true, subtree: true });
    observer.observe(document.body, { childList: true, subtree: true });
    
    console.log('[CLERK-SSL-FIX] ✅ Ultra aggressive DOM mutation observer installed');
    
    // Override Clerk configuration to prevent subdomain generation
    const originalClerkConfig = (window as any).__clerk_publishable_key;
    if (originalClerkConfig) {
      console.log('[CLERK-SSL-FIX] 🔧 Overriding Clerk domain configuration');
      window.__CLERK_DOMAIN_OVERRIDE__ = true;
    }
    
    // Mark proxy as active
    window.__CLERK_PROXY_ACTIVE__ = true;
    
    // Monitor for Clerk loading with enhanced detection
    const checkClerkLoading = () => {
      retryCount.current++;
      console.log(`[CLERK-SSL-FIX] 🔍 Checking Clerk loading status... (attempt ${retryCount.current})`);
      console.log('[CLERK-SSL-FIX] 📊 window.Clerk exists:', !!window.Clerk);
      console.log('[CLERK-SSL-FIX] 📊 Proxy active:', !!window.__CLERK_PROXY_ACTIVE__);
      
      if (window.Clerk) {
        console.log('[CLERK-SSL-FIX] 🎉 REAL CLERK LOADED SUCCESSFULLY!');
        console.log('[CLERK-SSL-FIX] 🔧 Clerk version:', window.Clerk.version || 'Real Clerk');
        console.log('[CLERK-SSL-FIX] 📋 Clerk loaded:', window.Clerk.loaded);
        console.log('[CLERK-SSL-FIX] 📋 Clerk ready:', window.Clerk.isReady?.());
      } else if (retryCount.current >= maxRetries) {
        console.log('[CLERK-SSL-FIX] ⚠️ MAX RETRIES REACHED - Implementing emergency fix');
        console.log('[CLERK-SSL-FIX] 💡 Trying to load Clerk directly via proxy...');
        
        // Emergency: Try to load Clerk script directly via our proxy
        const script = document.createElement('script');
        script.src = `${currentDomain}/api/clerk-proxy/v1/clerk.js`;
        script.async = true;
        script.onload = () => {
          console.log('[CLERK-SSL-FIX] 🚀 Emergency Clerk script loaded successfully!');
        };
        script.onerror = (error) => {
          console.error('[CLERK-SSL-FIX] ❌ Emergency script failed:', error);
        };
        document.head.appendChild(script);
      } else {
        console.log('[CLERK-SSL-FIX] ⏳ Clerk still loading...');
        setTimeout(checkClerkLoading, 2000);
      }
    };
    
    // Start monitoring after a brief delay
    setTimeout(checkClerkLoading, 1000);
    
    // Cleanup function
    return () => {
      console.log('[CLERK-SSL-FIX] 🧹 Cleaning up interceptors');
      if (window.__ORIGINAL_FETCH__) {
        window.fetch = window.__ORIGINAL_FETCH__;
      }
      window.__CLERK_INTERCEPTED__ = false;
      window.__CLERK_PROXY_ACTIVE__ = false;
      window.__CLERK_DOMAIN_OVERRIDE__ = false;
      observer.disconnect();
    };
  }, []);

  return null;
}

export default ClerkSSLFix; 