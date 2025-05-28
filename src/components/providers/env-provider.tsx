'use client';

/**
 * Environment Provider
 * 
 * Ensures client-side environment variables are properly loaded
 * for Clerk authentication in production environments like Choreo.
 */

import { useEffect } from 'react';

declare global {
  interface Window {
    __NEXT_ENV__?: Record<string, string>;
  }
}

export function EnvProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Load environment configuration from static file if available
    const loadEnvConfig = async () => {
      try {
        // Try to load the environment configuration script
        const script = document.createElement('script');
        script.src = '/env-config.js';
        script.async = true;
        script.onload = () => {
          console.log('[ENV-PROVIDER] Environment configuration loaded successfully');
          
          // Ensure process.env is available for client-side code
          if (window.__NEXT_ENV__ && typeof window !== 'undefined') {
            // Merge with existing process.env
            if (!window.process) {
              (window as any).process = { env: {} };
            }
            
            Object.assign(window.process.env, window.__NEXT_ENV__);
            console.log('[ENV-PROVIDER] Environment variables merged to process.env');
          }
        };
        script.onerror = () => {
          console.warn('[ENV-PROVIDER] Could not load environment configuration from /env-config.js');
        };
        
        document.head.appendChild(script);
      } catch (error) {
        console.warn('[ENV-PROVIDER] Error loading environment configuration:', error);
      }
    };

    loadEnvConfig();
  }, []);

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