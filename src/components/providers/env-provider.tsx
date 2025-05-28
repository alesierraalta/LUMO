'use client';

/**
 * Environment Provider
 * 
 * Ensures client-side environment variables are properly loaded
 * for Clerk authentication in production environments like Choreo.
 */

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    __NEXT_ENV__?: Record<string, string>;
  }
}

export function EnvProvider({ children }: { children: React.ReactNode }) {
  const [envLoaded, setEnvLoaded] = useState(false);

  useEffect(() => {
    // Check if environment variables are already loaded
    const checkEnvLoaded = () => {
      if (window.__NEXT_ENV__ && Object.keys(window.__NEXT_ENV__).length > 0) {
        console.log('[ENV-PROVIDER] Environment configuration already loaded:', window.__NEXT_ENV__);
        
        // Merge with existing process.env
        if (!window.process) {
          (window as any).process = { env: {} };
        }
        
        Object.assign(window.process.env, window.__NEXT_ENV__);
        console.log('[ENV-PROVIDER] Environment variables merged to process.env');
        setEnvLoaded(true);
        return true;
      }
      return false;
    };

    // Try to load immediately (script might already be loaded)
    if (checkEnvLoaded()) {
      return;
    }

    // If not loaded, try to load the script dynamically
    const loadEnvScript = () => {
      return new Promise<void>((resolve, reject) => {
        // Check if script is already in DOM
        const existingScript = document.querySelector('script[src="/env-config.js"]');
        if (existingScript) {
          // Script exists, wait for it to load
          existingScript.addEventListener('load', () => {
            console.log('[ENV-PROVIDER] Existing environment script loaded');
            if (checkEnvLoaded()) {
              resolve();
            } else {
              console.warn('[ENV-PROVIDER] Environment script loaded but no variables found');
              resolve(); // Continue anyway
            }
          });
          
          existingScript.addEventListener('error', () => {
            console.warn('[ENV-PROVIDER] Error loading existing environment script');
            resolve(); // Continue anyway
          });
          
          return;
        }

        // Create new script element
        const script = document.createElement('script');
        script.src = '/env-config.js';
        script.onload = () => {
          console.log('[ENV-PROVIDER] Environment script loaded successfully');
          if (checkEnvLoaded()) {
            resolve();
          } else {
            console.warn('[ENV-PROVIDER] Environment script loaded but no variables found');
            resolve(); // Continue anyway
          }
        };
        script.onerror = () => {
          console.warn('[ENV-PROVIDER] Could not load environment configuration from /env-config.js');
          resolve(); // Continue anyway
        };
        
        document.head.appendChild(script);
      });
    };

    loadEnvScript().then(() => {
      setEnvLoaded(true);
    });
  }, []);

  // Always render children, but log the loading state
  useEffect(() => {
    if (envLoaded) {
      console.log('[ENV-PROVIDER] Environment provider ready');
    }
  }, [envLoaded]);

  return <>{children}</>;
}

// Hook to access environment variables safely
export function useEnv(key: string, defaultValue?: string): string | undefined {
  if (typeof window !== 'undefined') {
    // Try window.__NEXT_ENV__ first, then process.env, then default
    return window.__NEXT_ENV__?.[key] || 
           (window.process?.env as any)?.[key] || 
           process.env[key] || 
           defaultValue;
  }
  
  // Server-side
  return process.env[key] || defaultValue;
}

// Get Clerk publishable key with fallback logic
export function getClerkPublishableKey(): string {
  const key = useEnv('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
  
  if (!key) {
    console.error('[ENV-PROVIDER] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY not found!');
    console.error('[ENV-PROVIDER] Available env keys:', Object.keys(process.env || {}));
  }
  
  return key || '';
} 