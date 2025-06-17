'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { getClientUser, signOut, type User } from '@/lib/supabase-auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refetch: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Cache management
  const lastFetchTime = useRef<number>(0);
  const cacheExpiry = 5 * 60 * 1000; // 5 minutes
  const fetchingRef = useRef<boolean>(false);

  const fetchUser = async (forceRefresh = false) => {
    // Prevent multiple simultaneous calls
    if (fetchingRef.current && !forceRefresh) {
      return;
    }

    // Check cache validity (skip if recent fetch and not forcing refresh)
    const now = Date.now();
    if (!forceRefresh && now - lastFetchTime.current < cacheExpiry && user !== null) {
      return;
    }

    fetchingRef.current = true;
    setLoading(true);

    try {
      console.log('🔍 [AuthContext] Fetching user with Supabase JWT...');
      const userData = await getClientUser();
      
      setUser(userData);
      lastFetchTime.current = now;
      
      if (userData) {
        console.log('✅ [AuthContext] User authenticated:', userData.email);
      } else {
        console.log('❌ [AuthContext] No user found');
      }
    } catch (error) {
      console.error('❌ [AuthContext] Error fetching user:', error);
      setUser(null);
      // Clear cache on error
      lastFetchTime.current = 0;
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const refetch = async () => {
    await fetchUser(true); // Force refresh
  };

  const logout = async () => {
    try {
      setLoading(true);
      const success = await signOut();
      
      if (success) {
        setUser(null);
        lastFetchTime.current = 0; // Clear cache
        console.log('✅ [AuthContext] User logged out successfully');
      } else {
        console.error('❌ [AuthContext] Logout failed');
      }
    } catch (error) {
      console.error('❌ [AuthContext] Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    refetch,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 