'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  getClientUser, 
  signOut as clientSignOut,
  createClientSupabaseClient,
  User as SupabaseUser
} from '@/lib/supabase-auth-client';

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

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let userCache: { user: User | null; timestamp: number } | null = null;
let isRefetching = false;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async (useCache = true): Promise<User | null> => {
    // Return cached user if valid and cache is allowed
    if (useCache && userCache && Date.now() - userCache.timestamp < CACHE_DURATION) {
      return userCache.user;
    }

    // Prevent multiple simultaneous calls
    if (isRefetching) {
      return user;
    }

    isRefetching = true;

    try {
      // Try to get user from Supabase client
      const supabaseUser = await getClientUser();
      
      if (!supabaseUser) {
        userCache = { user: null, timestamp: Date.now() };
        return null;
      }

      // Try to get additional user info from our API
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        if (response.ok) {
          const userData = await response.json();
          const fullUser: User = {
            id: userData.id || supabaseUser.id,
            email: userData.email || supabaseUser.email,
            name: userData.name || supabaseUser.name,
            role: userData.role || 'USER',
            isActive: userData.isActive !== undefined ? userData.isActive : supabaseUser.isActive,
            permissions: userData.permissions || []
          };

          userCache = { user: fullUser, timestamp: Date.now() };
          return fullUser;
        } else {
          // If API fails, use basic Supabase user info
          const basicUser: User = {
            id: supabaseUser.id,
            email: supabaseUser.email,
            name: supabaseUser.name,
            role: supabaseUser.role,
            isActive: supabaseUser.isActive,
            permissions: []
          };

          userCache = { user: basicUser, timestamp: Date.now() };
          return basicUser;
        }
      } catch (apiError) {
        console.warn('⚠️ API call failed, using Supabase user data:', apiError);
        
        // Fallback to basic Supabase user
        const basicUser: User = {
          id: supabaseUser.id,
          email: supabaseUser.email,
          name: supabaseUser.name,
          role: supabaseUser.role,
          isActive: supabaseUser.isActive,
          permissions: []
        };

        userCache = { user: basicUser, timestamp: Date.now() };
        return basicUser;
      }
    } catch (error) {
      console.error('❌ Error fetching user:', error);
      userCache = { user: null, timestamp: Date.now() };
      return null;
    } finally {
      isRefetching = false;
    }
  }, [user]);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await fetchUser(false); // Force refresh
      setUser(userData);
    } catch (error) {
      console.error('❌ Error refetching user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [fetchUser]);

  const logout = useCallback(async (): Promise<boolean> => {
    try {
      const success = await clientSignOut();
      
      if (success) {
        setUser(null);
        userCache = null; // Clear cache
      }
      
      return success;
    } catch (error) {
      console.error('❌ Logout error:', error);
      return false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const userData = await fetchUser(true);
        setUser(userData);
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [fetchUser]);

  // Listen to Supabase auth changes
  useEffect(() => {
    const supabase = createClientSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session?.user) {
        setUser(null);
        userCache = null;
      } else {
        // Refetch user data when auth state changes
        await refetch();
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [refetch]);

  const value: AuthContextType = {
    user,
    loading,
    refetch,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 