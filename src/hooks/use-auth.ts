'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, type User } from '@/lib/auth-client';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const loadUser = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      const user = await getCurrentUser();
      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: !!user,
      });
    } catch (error) {
      console.error('Error loading user:', error);
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const refreshUser = () => {
    loadUser();
  };

  return {
    ...authState,
    refreshUser,
  };
}; 