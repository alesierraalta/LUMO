'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ReactNode, useEffect, useState } from 'react';
import { 
  getClerkPublishableKey, 
  clerkAppearance,
  shouldSkipAuth,
  isDevEnvironment 
} from '@/lib/clerk-config';
import { AuthProvider } from './auth-provider';

interface AppClerkProviderProps {
  children: ReactNode;
}

export function AppClerkProvider({ children }: AppClerkProviderProps) {
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string>('');
  const [configLoaded, setConfigLoaded] = useState(false);

  // Always call useEffect hooks in the same order
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load configuration when client is ready
  useEffect(() => {
    if (!isClient || configLoaded) return;

    // Check if auth should be skipped first
    if (shouldSkipAuth()) {
      console.log('[CLERK] Authentication skipped - NEXT_PUBLIC_SKIP_CLERK_AUTH=true');
      setConfigLoaded(true);
      return;
    }

    // Try to get publishable key
    try {
      const key = getClerkPublishableKey();
      console.log('[CLERK] Successfully obtained publishable key:', key.substring(0, 15) + '...');
      console.log('[CLERK] Environment detected:', isDevEnvironment() ? 'DEVELOPMENT' : 'PRODUCTION');
      console.log('[CLERK] Current hostname:', typeof window !== 'undefined' ? window.location.hostname : 'server');
      setPublishableKey(key);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error getting Clerk key';
      console.error('[CLERK] Error getting publishable key:', errorMessage);
      setError(errorMessage);
    }
    
    setConfigLoaded(true);
  }, [isClient, configLoaded]);

  // Log configuration when ready
  useEffect(() => {
    if (configLoaded && publishableKey && !error) {
      console.log(
        `[CLERK] Configured in mode: ${isDevEnvironment() ? 'DEVELOPMENT' : 'PRODUCTION'}`,
        `\nPublishable Key: ${publishableKey.substring(0, 15)}...`
      );
    }
  }, [configLoaded, publishableKey, error]);

  // Don't render until client is ready and config is loaded
  if (!isClient || !configLoaded) {
    return null;
  }

  // Handle skip auth case
  if (shouldSkipAuth()) {
    return (
      <AuthProvider>
        {children}
      </AuthProvider>
    );
  }

  // Handle error case
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md text-center">
          <h2 className="text-lg font-semibold mb-2">Configuration Error</h2>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Determine if we're using production keys on localhost
  const isProductionKey = publishableKey.startsWith('pk_live_');
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const isForced = process.env.FORCE_PRODUCTION_ON_LOCALHOST === 'true';

  // Show warning if using production keys on localhost (but not if forced)
  if (isProductionKey && isLocalhost && !isForced) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-lg text-center">
          <h2 className="text-lg font-semibold mb-2 text-yellow-600">⚠️ Production Keys on Localhost</h2>
          <p className="text-sm text-gray-600 mb-4">
            You're using production Clerk keys (<code>pk_live_</code>) on localhost. 
            This often causes "Failed to load Clerk" errors because production keys are configured for specific domains.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-left">
            <h3 className="font-medium text-yellow-800 mb-2">Solutions:</h3>
            <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
              <li>Use development keys: <code>npm run dev:clerk</code></li>
              <li>Configure your Clerk app to allow localhost in production settings</li>
              <li>Use your production domain instead of localhost</li>
            </ol>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
          >
            Retry Anyway
          </button>
                     <button 
             onClick={() => window.location.href = '/clerk-diagnostics'} 
             className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
           >
             Run Diagnostics
           </button>
        </div>
      </div>
    );
  }

  console.log('[CLERK] Using configuration:', {
    isProductionKey,
    isLocalhost,
    isForced,
    mode: isForced && isProductionKey && isLocalhost ? 'PRODUCTION_TEST_MODE' : 'NORMAL',
    warning: isProductionKey && isLocalhost && !isForced ? 'Production keys may not work on localhost' : null
  });

  // Add special message for production test mode
  if (isForced && isProductionKey && isLocalhost) {
    console.log('🧪 [CLERK] Production Test Mode Active - Using production keys on localhost');
  }

  // Normal Clerk provider case
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={clerkAppearance}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      <AuthProvider>
        {children}
      </AuthProvider>
    </ClerkProvider>
  );
} 