'use client';

import { useEffect, useRef } from 'react';
import { useAuth, useUser, useClerk } from '@clerk/nextjs';

// Extend the Window interface for Clerk events
declare global {
  interface Window {
    __AUTH_DEBUG__?: any;
    __CLERK_DEBUG__?: any;
  }
}

/**
 * Comprehensive Authentication Debug Monitor
 * Logs all authentication states, events, and middleware interactions
 */
export function AuthDebugMonitor() {
  const { isLoaded, isSignedIn, userId, sessionId, getToken } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();
  const mountTime = useRef(Date.now());
  const lastState = useRef<any>({});

  useEffect(() => {
    console.log('[AUTH-DEBUG] 🚀 AUTH DEBUG MONITOR INITIALIZED');
    console.log('[AUTH-DEBUG] ⏰ Mount time:', new Date(mountTime.current).toISOString());
    console.log('[AUTH-DEBUG] 🌍 Window location:', window.location.href);
    console.log('[AUTH-DEBUG] 🔍 User agent:', navigator.userAgent);
    
    // Expose debug functions globally
    window.__AUTH_DEBUG__ = {
      getAuthState: () => ({
        isLoaded,
        isSignedIn,
        userId,
        sessionId,
        user: user ? {
          id: user.id,
          emailAddresses: user.emailAddresses?.map(e => e.emailAddress),
          firstName: user.firstName,
          lastName: user.lastName,
          publicMetadata: user.publicMetadata,
          imageUrl: user.imageUrl
        } : null,
        clerk: !!clerk
      }),
      getDebugHistory: () => window.__CLERK_DEBUG__?.history || [],
      forceReload: () => window.location.reload(),
      testClerkAPI: async () => {
        try {
          const token = await getToken();
          console.log('[AUTH-DEBUG] 🔑 Got token:', token ? 'SUCCESS' : 'FAILED');
          return { success: true, hasToken: !!token };
        } catch (error: any) {
          console.error('[AUTH-DEBUG] 💥 Token fetch failed:', error);
          return { success: false, error: error.message };
        }
      }
    };

    // Initialize history if not exists
    if (!window.__CLERK_DEBUG__) {
      window.__CLERK_DEBUG__ = {
        history: [],
        events: [],
        errors: []
      };
    }

    console.log('[AUTH-DEBUG] 🔧 Debug functions exposed to window.__AUTH_DEBUG__');
  }, []);

  // Monitor auth state changes
  useEffect(() => {
    const currentState = {
      isLoaded,
      isSignedIn,
      userId,
      sessionId,
      userEmail: user?.emailAddresses?.[0]?.emailAddress,
      userRole: user?.publicMetadata?.role,
      timestamp: Date.now()
    };

    const stateChanged = JSON.stringify(currentState) !== JSON.stringify(lastState.current);
    
    if (stateChanged) {
      console.log('[AUTH-DEBUG] 🔄 AUTH STATE CHANGE DETECTED:');
      console.log('[AUTH-DEBUG] 📊 Previous state:', lastState.current);
      console.log('[AUTH-DEBUG] 📊 Current state:', currentState);
      
      // Log specific changes
      if (lastState.current.isLoaded !== currentState.isLoaded) {
        console.log(`[AUTH-DEBUG] 🔍 isLoaded: ${lastState.current.isLoaded} → ${currentState.isLoaded}`);
      }
      
      if (lastState.current.isSignedIn !== currentState.isSignedIn) {
        console.log(`[AUTH-DEBUG] 🔐 isSignedIn: ${lastState.current.isSignedIn} → ${currentState.isSignedIn}`);
      }
      
      if (lastState.current.userId !== currentState.userId) {
        console.log(`[AUTH-DEBUG] 👤 userId: ${lastState.current.userId} → ${currentState.userId}`);
      }

      // Store in debug history
      if (window.__CLERK_DEBUG__) {
        window.__CLERK_DEBUG__.history.push({
          timestamp: currentState.timestamp,
          previous: lastState.current,
          current: currentState,
          type: 'STATE_CHANGE'
        });
      }

      lastState.current = currentState;
    }
  }, [isLoaded, isSignedIn, userId, sessionId, user]);

  // Monitor Clerk object changes
  useEffect(() => {
    if (clerk) {
      console.log('[AUTH-DEBUG] 🎭 CLERK OBJECT AVAILABLE:');
      console.log('[AUTH-DEBUG] 📋 Clerk methods:', Object.keys(clerk));
      console.log('[AUTH-DEBUG] 🔍 Clerk version:', (clerk as any).version || 'Unknown');
      console.log('[AUTH-DEBUG] ✅ Clerk instance ready for use');
    } else {
      console.log('[AUTH-DEBUG] ⚠️ Clerk object not yet available');
    }
  }, [clerk]);

  // Monitor network requests
  useEffect(() => {
    const originalFetch = window.fetch;
    let requestCount = 0;

    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      requestCount++;
      
      // Log auth-related requests
      if (url.includes('clerk') || url.includes('auth') || url.includes('api')) {
        console.log(`[AUTH-DEBUG] 🌐 REQUEST #${requestCount}:`, {
          url,
          method: init?.method || 'GET',
          timestamp: Date.now(),
          headers: init?.headers
        });
      }

      try {
        const response = await originalFetch(input, init);
        
        // Log auth-related responses
        if (url.includes('clerk') || url.includes('auth') || url.includes('api')) {
          console.log(`[AUTH-DEBUG] ✅ RESPONSE #${requestCount}:`, {
            url,
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            timestamp: Date.now()
          });
        }

        return response;
      } catch (error: any) {
        console.error(`[AUTH-DEBUG] 💥 REQUEST FAILED #${requestCount}:`, {
          url,
          error: error?.message || 'Unknown error',
          timestamp: Date.now()
        });

        if (window.__CLERK_DEBUG__) {
          window.__CLERK_DEBUG__.errors.push({
            type: 'FETCH_ERROR',
            url,
            error: error?.message || 'Unknown error',
            timestamp: Date.now()
          });
        }

        throw error;
      }
    };

    // Cleanup
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Monitor page navigation and redirects
  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log('[AUTH-DEBUG] 👁️ Page visibility changed:', document.visibilityState);
    };

    const handleFocus = () => {
      console.log('[AUTH-DEBUG] 🎯 Page focused - checking auth state');
      console.log('[AUTH-DEBUG] 📊 Current auth state:', {
        isLoaded,
        isSignedIn,
        userId,
        sessionId,
        url: window.location.href
      });
    };

    const handleBeforeUnload = () => {
      console.log('[AUTH-DEBUG] 🚪 Page unloading from:', window.location.href);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isLoaded, isSignedIn, userId, sessionId]);

  // Periodic health checks
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('[AUTH-DEBUG] ❤️ HEALTH CHECK:', {
        uptime: Date.now() - mountTime.current,
        isLoaded,
        isSignedIn,
        userId,
        clerkAvailable: !!clerk,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [isLoaded, isSignedIn, userId, clerk]);

  // Log loading states with detailed info
  useEffect(() => {
    if (!isLoaded) {
      console.log('[AUTH-DEBUG] ⏳ AUTH LOADING...', {
        timestamp: Date.now(),
        elapsed: Date.now() - mountTime.current,
        url: window.location.href
      });
    } else {
      console.log('[AUTH-DEBUG] ✅ AUTH LOADED!', {
        isSignedIn,
        userId,
        sessionId,
        timestamp: Date.now(),
        totalLoadTime: Date.now() - mountTime.current,
        url: window.location.href
      });
    }
  }, [isLoaded]);

  // Handle errors and edge cases
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('[AUTH-DEBUG] 💥 GLOBAL ERROR:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        timestamp: Date.now()
      });

      if (window.__CLERK_DEBUG__) {
        window.__CLERK_DEBUG__.errors.push({
          type: 'GLOBAL_ERROR',
          message: event.message,
          timestamp: Date.now()
        });
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[AUTH-DEBUG] 💥 UNHANDLED PROMISE REJECTION:', {
        reason: event.reason,
        timestamp: Date.now()
      });

      if (window.__CLERK_DEBUG__) {
        window.__CLERK_DEBUG__.errors.push({
          type: 'PROMISE_REJECTION',
          reason: event.reason,
          timestamp: Date.now()
        });
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // This component doesn't render anything
  return null;
}

export default AuthDebugMonitor; 