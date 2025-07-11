'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

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

// Pre-import modules to prevent dynamic import issues in hooks
let supabaseClient: any = null;
let signOutFunction: any = null;

const initializeModules = async () => {
  if (!supabaseClient) {
    const { getSupabaseClient } = await import('@/lib/supabase-singleton');
    supabaseClient = getSupabaseClient();
  }
  if (!signOutFunction) {
    const { signOut } = await import('@/lib/supabase-auth-client');
    signOutFunction = signOut;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Enhanced fetchUser function that supports both Supabase Auth and JWT
  const fetchUser = useCallback(async (useCache: boolean = true): Promise<User | null> => {
    if (useCache && userCache && Date.now() - userCache.timestamp < CACHE_DURATION) {
      return userCache.user;
    }

    if (isRefetching) {
      return new Promise((resolve) => {
        const checkRefetch = () => {
          if (!isRefetching) {
            resolve(userCache?.user || null);
          } else {
            setTimeout(checkRefetch, 50);
          }
        };
        checkRefetch();
      });
    }

    isRefetching = true;

    try {
      console.log('🔍 Fetching user data...');

      // SUPABASE-ONLY AUTHENTICATION (No JWT fallbacks)
      try {
        console.log('🔍 Attempting Supabase-only authentication...');
        
        // Ensure modules are initialized
        await initializeModules();

        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        
        if (sessionError) {
          console.warn('⚠️ Session error:', sessionError.message);
          userCache = { user: null, timestamp: Date.now() };
          return null;
        }

        if (!session?.user) {
          console.log('ℹ️ No active Supabase session');
          userCache = { user: null, timestamp: Date.now() };
          return null;
        }

        console.log('✅ Active session found:', session.user.email);

        // Query user data directly from database (search by email since IDs might not match)
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
          console.log('🔍 Raw database user data:', userData);
          
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
            console.log('🔑 SUPABASE CHOREO FIX: Applied admin role for root user');
            fullUser.role = 'ADMIN';
            fullUser.isActive = true;
            fullUser.permissions = ['read', 'write', 'delete', 'admin'];
          }

          console.log('✅ Full user data from database:', fullUser.email, 'Role:', fullUser.role, 'IsActive:', fullUser.isActive);
          userCache = { user: fullUser, timestamp: Date.now() };
          return fullUser;
        } else {
          console.warn('⚠️ Database query failed:', userError?.message);
        }

        // Fallback to basic session user info with CRITICAL admin fix
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
          console.log('🔑 SUPABASE FALLBACK: Applied admin role for root user');
          basicUser.role = 'ADMIN';
          basicUser.isActive = true;
          basicUser.permissions = ['read', 'write', 'delete', 'admin'];
        }

        console.log('⚠️ Using fallback user data:', basicUser.email);
        userCache = { user: basicUser, timestamp: Date.now() };
        return basicUser;

      } catch (supabaseError) {
        console.warn('⚠️ Supabase authentication failed:', supabaseError);
      }

      // No authentication method worked
      console.log('❌ Supabase authentication failed - NO FALLBACKS');
      userCache = { user: null, timestamp: Date.now() };
      return null;

    } catch (error) {
      console.error('❌ Error fetching user:', error);
      userCache = { user: null, timestamp: Date.now() };
      return null;
    } finally {
      isRefetching = false;
    }
  }, []); // CRITICAL FIX: Empty dependency array instead of [user]

  const refetch = useCallback(async () => {
    console.log('🔄 Refetching user data...');
    setLoading(true);
    try {
      const userData = await fetchUser(false); // Force refresh
      setUser(userData);
      console.log('✅ User data refetched:', userData?.email || 'No user');
    } catch (error) {
      console.error('❌ Error refetching user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [fetchUser]);

  const logout = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔍 Attempting Supabase-only logout...');
      
      // Ensure modules are initialized
      await initializeModules();
      
      // SUPABASE-ONLY LOGOUT (No JWT fallbacks)
      const success = await signOutFunction();
      
      if (success) {
        console.log('✅ Supabase logout successful');
        setUser(null);
        userCache = null; // Clear cache
        return true;
      } else {
        console.warn('⚠️ Supabase logout failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
      return false;
    }
  }, []);

  // Initial load - only run once
  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing auth context...');
        const userData = await fetchUser(true);
        if (isMounted) {
          setUser(userData);
          console.log('✅ Auth context initialized:', userData?.email || 'No user');
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          console.log('🔄 Loading state set to false');
        }
      }
    };

    initializeAuth();
    
    return () => {
      isMounted = false;
    };
  }, []); // CRITICAL FIX: Empty dependency array to prevent infinite loops

  // Listen to Supabase auth changes - FIXED: Only react to specific events with dynamic import
  useEffect(() => {
    let subscription: any = null;
    
    const setupAuthListener = async () => {
      try {
        // Ensure modules are initialized
        await initializeModules();
        
        const { data } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
          console.log('🔔 Auth state change:', event, session?.user?.email || 'No user');
          
          // CRITICAL FIX: Only react to sign out events, not sign in to prevent loops
          if (event === 'SIGNED_OUT') {
            console.log('👋 User signed out');
            setUser(null);
            userCache = null; // Clear cache
            setLoading(false); // CRITICAL FIX: Ensure loading is false
          }
          // REMOVED: Don't react to SIGNED_IN or TOKEN_REFRESHED to prevent infinite loops
          // The initial auth check in the first useEffect handles authentication
        });
        
        subscription = data.subscription;
      } catch (error) {
        console.error('❌ Error setting up auth listener:', error);
      }
    };

    setupAuthListener();
    
    return () => {
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