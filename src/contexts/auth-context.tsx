'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase-singleton';
import { signOut } from '@/lib/supabase-auth-client';
import { debug } from '@/lib/debug-system';
import browserCompatibility from '@/lib/browser-compatibility';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refetch: () => Promise<void>;
  logout: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cache for user data to prevent excessive API calls
let userCache: { user: User | null; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let isRefetching = false;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Enhanced fetchUser function that supports both Supabase Auth and JWT
  const fetchUser = useCallback(async (useCache: boolean = true): Promise<User | null> => {
    return await debug.withErrorHandling('AuthContext', 'fetchUser', async () => {
      const executionId = debug.startExecution('fetchUser', { useCache, hasCachedUser: !!userCache });
      
      if (useCache && userCache && Date.now() - userCache.timestamp < CACHE_DURATION) {
        debug.debug('AuthContext', 'fetchUser', '💾 Using cached user data', { cacheAge: Date.now() - userCache.timestamp });
        debug.endExecution(executionId, true);
        return userCache.user;
      }

      if (isRefetching) {
        debug.debug('AuthContext', 'fetchUser', '⏳ Fetch already in progress, waiting');
        return new Promise((resolve) => {
          const checkRefetch = () => {
            if (!isRefetching) {
              debug.debug('AuthContext', 'fetchUser', '✅ Previous fetch completed, returning result');
              resolve(userCache?.user || null);
            } else {
              setTimeout(checkRefetch, 50);
            }
          };
          checkRefetch();
        });
      }

      isRefetching = true;
      debug.updateExecution(executionId, { step: 'starting_fetch' });

      try {
        debug.info('AuthContext', 'fetchUser', '🔍 Starting user data fetch process');

        // SUPABASE-ONLY AUTHENTICATION (No JWT fallbacks)
        try {
          debug.debug('AuthContext', 'fetchUser', '🔍 Attempting Supabase-only authentication');
          debug.updateExecution(executionId, { step: 'supabase_auth_start' });
          
          // Dynamic imports to prevent webpack factory errors
          const supabaseClient = getSupabaseClient();
          debug.debug('AuthContext', 'fetchUser', '✅ Supabase client obtained');

          const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
          debug.updateExecution(executionId, { step: 'session_retrieved', hasSession: !!session });
          
          if (sessionError) {
            debug.warn('AuthContext', 'fetchUser', '⚠️ Session error occurred', { error: sessionError.message });
            userCache = { user: null, timestamp: Date.now() };
            debug.captureState('AuthContext', 'fetchUser', 'sessionError', { error: sessionError.message });
            debug.endExecution(executionId, false, sessionError);
            return null;
          }

          if (!session?.user) {
            debug.info('AuthContext', 'fetchUser', 'ℹ️ No active Supabase session found');
            userCache = { user: null, timestamp: Date.now() };
            debug.captureState('AuthContext', 'fetchUser', 'noSession', { userCache });
            debug.endExecution(executionId, true);
            return null;
          }

          debug.info('AuthContext', 'fetchUser', '✅ Active session found', { email: session.user.email, userId: session.user.id });
          debug.updateExecution(executionId, { step: 'session_found', userId: session.user.id });

          // Query user data directly from database (search by email since IDs might not match)
          debug.debug('AuthContext', 'fetchUser', '📊 Querying user data from database', { email: session.user.email });
          debug.updateExecution(executionId, { step: 'database_query' });
          
          const { data: userData, error: userError } = await supabaseClient
            .from('users')
            .select(`
              id,
              email,
              name,
              is_active,
              role_id,
              roles!role_id (
                id,
                name
              )
            `)
            .eq('email', session.user.email)
            .single();
            
          if (!userError && userData) {
            debug.debug('AuthContext', 'fetchUser', '🔍 Raw database user data retrieved', userData);
            debug.captureState('AuthContext', 'fetchUser', 'databaseUserData', userData);
            
            const fullUser: User = {
              id: userData.id,
              email: userData.email,
              name: userData.name,
              role: (userData.roles as any)?.name || 'USER',
              isActive: userData.is_active,
              permissions: [] // Will be populated from role-based permissions later
            };

            // CRITICAL CHOREO FIX: Admin fallback for root user
            if (session.user.email === 'alesierraalta@gmail.com') {
              debug.warn('AuthContext', 'fetchUser', '🔑 SUPABASE CHOREO FIX: Applied admin role for root user');
              fullUser.role = 'ADMIN';
              fullUser.isActive = true;
              fullUser.permissions = ['read', 'write', 'delete', 'admin'];
            }

            debug.info('AuthContext', 'fetchUser', '✅ Full user data constructed', {
              email: fullUser.email,
              role: fullUser.role,
              isActive: fullUser.isActive
            });
            
            userCache = { user: fullUser, timestamp: Date.now() };
            debug.captureState('AuthContext', 'fetchUser', 'fullUserCreated', fullUser);
            debug.updateExecution(executionId, { step: 'success', userId: fullUser.id, role: fullUser.role });
            debug.endExecution(executionId, true);
            return fullUser;
          } else {
            debug.warn('AuthContext', 'fetchUser', '⚠️ Database query failed, using fallback', { error: userError?.message });
            debug.updateExecution(executionId, { step: 'database_error', error: userError?.message });
          }

          // Fallback to basic session user info with CRITICAL admin fix
          debug.debug('AuthContext', 'fetchUser', '🔄 Creating fallback user from session data');
          const basicUser: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            role: session.user.user_metadata?.role || 'USER',
            isActive: true,
            permissions: []
          };

          // CRITICAL CHOREO FIX: Admin fallback for root user
          if (session.user.email === 'alesierraalta@gmail.com') {
            debug.warn('AuthContext', 'fetchUser', '🔑 SUPABASE FALLBACK: Applied admin role for root user');
            basicUser.role = 'ADMIN';
            basicUser.isActive = true;
            basicUser.permissions = ['read', 'write', 'delete', 'admin'];
          }

          debug.warn('AuthContext', 'fetchUser', '⚠️ Using fallback user data', { email: basicUser.email, role: basicUser.role });
          userCache = { user: basicUser, timestamp: Date.now() };
          debug.captureState('AuthContext', 'fetchUser', 'fallbackUserCreated', basicUser);
          debug.updateExecution(executionId, { step: 'fallback_success', userId: basicUser.id });
          debug.endExecution(executionId, true);
          return basicUser;

        } catch (supabaseError) {
          debug.error('AuthContext', 'fetchUser', '⚠️ Supabase authentication failed', supabaseError as Error);
          debug.updateExecution(executionId, { step: 'supabase_error', error: supabaseError });
        }

        // No authentication method worked
        debug.warn('AuthContext', 'fetchUser', '❌ All authentication methods failed');
        userCache = { user: null, timestamp: Date.now() };
        debug.captureState('AuthContext', 'fetchUser', 'authenticationFailed', { userCache });
        debug.endExecution(executionId, true);
        return null;

      } catch (error) {
        debug.error('AuthContext', 'fetchUser', '❌ Critical error in fetchUser', error as Error);
        userCache = { user: null, timestamp: Date.now() };
        debug.captureState('AuthContext', 'fetchUser', 'criticalError', { error, userCache });
        debug.endExecution(executionId, false, error as Error);
        throw error;
      } finally {
        isRefetching = false;
        debug.debug('AuthContext', 'fetchUser', '🔄 Fetch process completed, reset refetching flag');
      }
    });
  }, []); // CRITICAL FIX: Empty dependency array instead of [user]

  const refetch = useCallback(async () => {
    return await debug.withErrorHandling('AuthContext', 'refetch', async () => {
      const executionId = debug.startExecution('refetch');
      
      debug.info('AuthContext', 'refetch', '🔄 Starting user data refetch');
      debug.captureState('AuthContext', 'refetch', 'beforeRefetch', { currentUser: user?.id, loading });
      
      setLoading(true);
      debug.updateExecution(executionId, { step: 'loading_set' });
      
      try {
        const userData = await fetchUser(false); // Force refresh
        setUser(userData);
        
        debug.info('AuthContext', 'refetch', '✅ User data refetched successfully', {
          email: userData?.email || 'No user',
          userId: userData?.id
        });
        debug.captureState('AuthContext', 'refetch', 'afterRefetch', { user: userData?.id });
        debug.endExecution(executionId, true);
      } catch (error) {
        debug.error('AuthContext', 'refetch', '❌ Error during refetch', error as Error);
        setUser(null);
        debug.captureState('AuthContext', 'refetch', 'refetchError', { user: null });
        debug.endExecution(executionId, false, error as Error);
        throw error;
      } finally {
        setLoading(false);
        debug.debug('AuthContext', 'refetch', '🔄 Refetch completed, loading set to false');
      }
    });
  }, [fetchUser]);

  const logout = useCallback(async (): Promise<boolean> => {
    return await debug.withErrorHandling('AuthContext', 'logout', async () => {
      const executionId = debug.startExecution('logout', { currentUser: user?.id });
      
      try {
        debug.info('AuthContext', 'logout', '🔍 Starting Supabase-only logout process');
        debug.captureState('AuthContext', 'logout', 'beforeLogout', { user: user?.id, userCache: !!userCache });
        
        // SUPABASE-ONLY LOGOUT (No JWT fallbacks)
        const success = await signOut();
        debug.updateExecution(executionId, { step: 'signout_completed', success });
        
        if (success) {
          debug.info('AuthContext', 'logout', '✅ Supabase logout successful');
          setUser(null);
          userCache = null; // Clear cache
          debug.captureState('AuthContext', 'logout', 'logoutSuccess', { user: null, userCache: null });
          debug.endExecution(executionId, true);
          return true;
        } else {
          debug.warn('AuthContext', 'logout', '⚠️ Supabase logout failed');
          debug.captureState('AuthContext', 'logout', 'logoutFailed', { success: false });
          debug.endExecution(executionId, false);
          return false;
        }
      } catch (error) {
        debug.error('AuthContext', 'logout', '❌ Logout error occurred', error as Error);
        debug.captureState('AuthContext', 'logout', 'logoutError', { error });
        debug.endExecution(executionId, false, error as Error);
        return false;
      }
    });
  }, []);

  // Initial load - only run once
  useEffect(() => {
    let isMounted = true;
    const initExecutionId = debug.startExecution('initializeAuthEffect');
    
    const initializeAuth = async () => {
      return await debug.withErrorHandling('AuthContext', 'initializeAuth', async () => {
        try {
          debug.info('AuthContext', 'initializeAuth', '🚀 Starting auth context initialization');
          debug.captureState('AuthContext', 'initializeAuth', 'initialState', { isMounted, loading });
          
          // Opera browser compatibility check
          if (browserCompatibility.isOpera()) {
            debug.info('AuthContext', 'initializeAuth', '🔍 Opera browser detected - applying compatibility fixes');
            
            // Report browser compatibility information
            const browserInfo = browserCompatibility.getBrowserInfo();
            const features = browserCompatibility.getFeatures();
            
            debug.info('AuthContext', 'initializeAuth', '📊 Browser compatibility info', {
              browser: browserInfo.name,
              version: browserInfo.version,
              features: features
            });
            
            // Check for potential compatibility issues
            if (!features.supportsPromises) {
              debug.warn('AuthContext', 'initializeAuth', '⚠️ Promise support issues detected in Opera');
            }
            
            if (!features.supportsFetch) {
              debug.warn('AuthContext', 'initializeAuth', '⚠️ Fetch API issues detected in Opera');
            }
            
            if (!features.supportsWebpack) {
              debug.warn('AuthContext', 'initializeAuth', '⚠️ Webpack compatibility issues detected in Opera');
            }
            
            // Add small delay for Opera to ensure all polyfills are ready
            await new Promise(resolve => setTimeout(resolve, 100));
            debug.debug('AuthContext', 'initializeAuth', '⏱️ Opera compatibility delay completed');
          }
          
          const userData = await fetchUser(true);
          debug.updateExecution(initExecutionId, { step: 'user_fetched', hasUser: !!userData });
          
          if (isMounted) {
            setUser(userData);
            debug.info('AuthContext', 'initializeAuth', '✅ Auth context initialized successfully', {
              email: userData?.email || 'No user',
              userId: userData?.id
            });
            debug.captureState('AuthContext', 'initializeAuth', 'userSet', { user: userData?.id });
          } else {
            debug.warn('AuthContext', 'initializeAuth', '⚠️ Component unmounted during initialization');
          }
        } catch (error) {
          debug.error('AuthContext', 'initializeAuth', '❌ Auth initialization error', error as Error);
          
          // Opera-specific error handling
          if (browserCompatibility.isOpera()) {
            browserCompatibility.reportCompatibilityIssue('Auth initialization failed in Opera', {
              error: error,
              browserInfo: browserCompatibility.getBrowserInfo(),
              features: browserCompatibility.getFeatures()
            });
          }
          
          if (isMounted) {
            setUser(null);
            debug.captureState('AuthContext', 'initializeAuth', 'errorState', { user: null });
          }
          throw error;
        } finally {
          if (isMounted) {
            setLoading(false);
            debug.debug('AuthContext', 'initializeAuth', '🔄 Loading state set to false');
            debug.captureState('AuthContext', 'initializeAuth', 'finalState', { loading: false });
          }
          debug.endExecution(initExecutionId, true);
        }
      });
    };

    initializeAuth();
    
    return () => {
      debug.debug('AuthContext', 'cleanup', '🧹 Cleaning up auth initialization effect');
      isMounted = false;
    };
  }, []); // CRITICAL FIX: Empty dependency array to prevent infinite loops

  // Listen to Supabase auth changes - FIXED: Only react to specific events with dynamic import
  useEffect(() => {
    let subscription: any = null;
    const listenerExecutionId = debug.startExecution('setupAuthListener');
    
    const setupAuthListener = async () => {
      return await debug.withErrorHandling('AuthContext', 'setupAuthListener', async () => {
        try {
          debug.debug('AuthContext', 'setupAuthListener', '🔗 Setting up auth state listener');
          
          // Dynamic imports to prevent webpack factory errors
          const supabaseClient = getSupabaseClient();
          debug.debug('AuthContext', 'setupAuthListener', '✅ Supabase client obtained for listener');
          
          const { data } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
            const changeExecutionId = debug.startExecution('authStateChange', { event, hasSession: !!session });
            
            debug.info('AuthContext', 'authStateChange', '🔔 Auth state change detected', {
              event,
              userEmail: session?.user?.email || 'No user',
              userId: session?.user?.id
            });
            
            try {
              // CRITICAL FIX: Only react to sign out events, not sign in to prevent loops
              if (event === 'SIGNED_OUT') {
                debug.info('AuthContext', 'authStateChange', '👋 Processing user sign out');
                setUser(null);
                userCache = null; // Clear cache
                setLoading(false); // CRITICAL FIX: Ensure loading is false
                debug.captureState('AuthContext', 'authStateChange', 'signedOut', { user: null, userCache: null, loading: false });
              } else {
                debug.debug('AuthContext', 'authStateChange', '🔄 Ignoring event to prevent loops', { event });
              }
              // REMOVED: Don't react to SIGNED_IN or TOKEN_REFRESHED to prevent infinite loops
              // The initial auth check in the first useEffect handles authentication
              
              debug.endExecution(changeExecutionId, true);
            } catch (error) {
              debug.error('AuthContext', 'authStateChange', '❌ Error processing auth state change', error as Error);
              debug.endExecution(changeExecutionId, false, error as Error);
            }
          });
          
          subscription = data.subscription;
          debug.debug('AuthContext', 'setupAuthListener', '✅ Auth listener setup completed');
          debug.endExecution(listenerExecutionId, true);
        } catch (error) {
          debug.error('AuthContext', 'setupAuthListener', '❌ Error setting up auth listener', error as Error);
          debug.endExecution(listenerExecutionId, false, error as Error);
          throw error;
        }
      });
    };

    setupAuthListener();
    
    return () => {
      debug.debug('AuthContext', 'cleanup', '🧹 Cleaning up auth listener subscription');
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []); // CRITICAL FIX: Remove fetchUser dependency to prevent re-subscription loops

  const value = {
    user,
    loading,
    refetch,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 