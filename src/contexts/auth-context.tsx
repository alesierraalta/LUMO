'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { getCurrentUser, type User } from '@/lib/auth-client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loadingRef = useRef(false); // Prevent multiple simultaneous calls
  const cacheRef = useRef<{ user: User | null; timestamp: number } | null>(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  const loadUser = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (loadingRef.current) {
      return;
    }

    // Check cache first
    if (cacheRef.current) {
      const { user: cachedUser, timestamp } = cacheRef.current;
      const isExpired = Date.now() - timestamp > CACHE_DURATION;
      
      if (!isExpired) {
        setUser(cachedUser);
        setIsLoading(false);
        return;
      }
    }

    try {
      loadingRef.current = true;
      setIsLoading(true);
      
      const userData = await getCurrentUser();
      
      // Update cache
      cacheRef.current = {
        user: userData,
        timestamp: Date.now()
      };
      
      setUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
      // Clear cache on error
      cacheRef.current = null;
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    // Clear cache and force reload
    cacheRef.current = null;
    await loadUser();
  }, [loadUser]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}; 