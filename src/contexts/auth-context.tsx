'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  signOut as clientSignOut
} from '@/lib/supabase-auth-client';
import { getSupabaseClient } from '@/lib/supabase-singleton';

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
    console.log('🔍 fetchUser called with useCache:', useCache);
    
    // Return cached user if valid and cache is allowed
    if (useCache && userCache && Date.now() - userCache.timestamp < CACHE_DURATION) {
      console.log('🔄 Using cached user data');
      return userCache.user;
    }

    // Prevent multiple simultaneous calls
    if (isRefetching) {
      console.log('⏳ Already fetching user, skipping duplicate call');
      return userCache?.user || null;
    }

    isRefetching = true;
    console.log('🔍 Fetching user data...');

    try {
      // Use singleton Supabase client
      const supabase = getSupabaseClient();
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        console.log('❌ No valid session found');
        userCache = { user: null, timestamp: Date.now() };
        return null;
      }

      console.log('✅ Valid session found for:', session.user.email);

      // Get additional user info from database via Supabase client
      try {
        const supabase = getSupabaseClient();
        
                 // Query user data directly from database (search by email since IDs might not match)
         const { data: userData, error: userError } = await supabase
           .from('users')
           .select(`
             id,
             email,
             name,
             is_active,
             role_id,
             roles (
               id,
               name
             )
           `)
           .eq('email', session.user.email)
           .single();
          
                 if (!userError && userData) {
            const fullUser: User = {
             id: userData.id,
             email: userData.email,
             name: userData.name,
             role: (userData.roles as any)?.name || 'USER',
             isActive: userData.is_active,
             permissions: [] // Will be populated from role-based permissions later
            };

          console.log('✅ Full user data from database:', fullUser.email, 'Role:', fullUser.role);
            userCache = { user: fullUser, timestamp: Date.now() };
            return fullUser;
        } else {
          console.warn('⚠️ Database query failed:', userError?.message);
        }
      } catch (dbError) {
        console.warn('⚠️ Database query failed:', dbError);
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

      console.log('⚠️ Using fallback user data:', basicUser.email);
      userCache = { user: basicUser, timestamp: Date.now() };
      return basicUser;

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
  }, []);

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
        }
      }
    };

    initializeAuth();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Listen to Supabase auth changes - FIXED: Only react to specific events
  useEffect(() => {
    const supabase = getSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state change:', event, session?.user?.email || 'No user');
      
      if (event === 'SIGNED_OUT' || !session?.user) {
        console.log('👋 User signed out, clearing state');
        setUser(null);
        userCache = null;
        setLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        console.log('👤 User signed in/token refreshed, refetching data');
        // CRITICAL FIX: Call fetchUser directly instead of refetch to avoid circular dependency
        const userData = await fetchUser(false);
        setUser(userData);
      }
      // CRITICAL: Ignore INITIAL_SESSION and other events to prevent loops
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []); // CRITICAL FIX: Empty dependency array

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