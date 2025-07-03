'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabaseClient } from '@/lib/supabase-github-pages';
import { useClientSideOnly } from '@/lib/github-pages-config';

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
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, userData?: any) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cache for user data to prevent excessive API calls
let userCache: { user: User | null; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let isRefetching = false;

export function GitHubPagesAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const clientSideOnly = useClientSideOnly();

  // Enhanced fetchUser function for GitHub Pages (client-side only)
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
      console.log('🔍 [GitHub Pages] Fetching user data...');

      const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
      
      if (sessionError) {
        console.warn('⚠️ [GitHub Pages] Session error:', sessionError.message);
        userCache = { user: null, timestamp: Date.now() };
        return null;
      }

      if (!session?.user) {
        console.log('ℹ️ [GitHub Pages] No active session');
        userCache = { user: null, timestamp: Date.now() };
        return null;
      }

      console.log('✅ [GitHub Pages] Active session found:', session.user.email);

      // Query user data directly from Supabase
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
        console.log('🔍 [GitHub Pages] Raw database user data:', userData);
        
        const fullUser: User = {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: (userData.roles as any)?.name || 'USER',
          isActive: userData.is_active,
          permissions: []
        };

        // Admin fallback for root user
        if (session.user.email === 'alesierraalta@gmail.com') {
          console.log('🔑 [GitHub Pages] Applied admin role for root user');
          fullUser.role = 'ADMIN';
          fullUser.isActive = true;
          fullUser.permissions = ['read', 'write', 'delete', 'admin'];
        }

        console.log('✅ [GitHub Pages] Full user data:', fullUser.email, 'Role:', fullUser.role);
        userCache = { user: fullUser, timestamp: Date.now() };
        return fullUser;
      }

      // Fallback to basic session user info
      const basicUser: User = {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
        role: session.user.user_metadata?.role || 'USER',
        isActive: true,
        permissions: []
      };

      // Admin fallback for root user
      if (session.user.email === 'alesierraalta@gmail.com') {
        console.log('🔑 [GitHub Pages] Fallback admin role for root user');
        basicUser.role = 'ADMIN';
        basicUser.isActive = true;
        basicUser.permissions = ['read', 'write', 'delete', 'admin'];
      }

      console.log('⚠️ [GitHub Pages] Using fallback user data:', basicUser.email);
      userCache = { user: basicUser, timestamp: Date.now() };
      return basicUser;

    } catch (error) {
      console.error('❌ [GitHub Pages] Error fetching user:', error);
      userCache = { user: null, timestamp: Date.now() };
      return null;
    } finally {
      isRefetching = false;
    }
  }, []);

  const refetch = useCallback(async () => {
    console.log('🔄 [GitHub Pages] Refetching user data...');
    setLoading(true);
    try {
      const userData = await fetchUser(false);
      setUser(userData);
      console.log('✅ [GitHub Pages] User data refetched:', userData?.email || 'No user');
    } catch (error) {
      console.error('❌ [GitHub Pages] Error refetching user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [fetchUser]);

  const logout = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔍 [GitHub Pages] Logging out...');
      
      const { error } = await supabaseClient.auth.signOut();
      
      if (!error) {
        console.log('✅ [GitHub Pages] Logout successful');
        setUser(null);
        userCache = null;
        return true;
      } else {
        console.warn('⚠️ [GitHub Pages] Logout failed:', error.message);
        return false;
      }
    } catch (error) {
      console.error('❌ [GitHub Pages] Logout error:', error);
      return false;
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔍 [GitHub Pages] Signing in...');
      
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });
      
      if (!error && data.user) {
        console.log('✅ [GitHub Pages] Sign in successful');
        await refetch();
        return true;
      } else {
        console.warn('⚠️ [GitHub Pages] Sign in failed:', error?.message);
        return false;
      }
    } catch (error) {
      console.error('❌ [GitHub Pages] Sign in error:', error);
      return false;
    }
  }, [refetch]);

  const signUp = useCallback(async (email: string, password: string, userData?: any): Promise<boolean> => {
    try {
      console.log('🔍 [GitHub Pages] Signing up...');
      
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      
      if (!error && data.user) {
        console.log('✅ [GitHub Pages] Sign up successful');
        return true;
      } else {
        console.warn('⚠️ [GitHub Pages] Sign up failed:', error?.message);
        return false;
      }
    } catch (error) {
      console.error('❌ [GitHub Pages] Sign up error:', error);
      return false;
    }
  }, []);

  // Initial load and auth state listener
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🚀 [GitHub Pages] Initializing auth...');
      
      try {
        const userData = await fetchUser(false);
        setUser(userData);
        console.log('✅ [GitHub Pages] Auth initialized:', userData?.email || 'No user');
      } catch (error) {
        console.error('❌ [GitHub Pages] Auth initialization error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 [GitHub Pages] Auth state changed:', event);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            const userData = await fetchUser(false);
            setUser(userData);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          userCache = null;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUser]);

  const value: AuthContextType = {
    user,
    loading,
    refetch,
    logout,
    signIn,
    signUp,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useGitHubPagesAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useGitHubPagesAuth must be used within a GitHubPagesAuthProvider');
  }
  return context;
}

// Export for compatibility
export { useGitHubPagesAuth as useAuth }; 