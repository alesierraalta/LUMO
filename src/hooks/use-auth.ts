'use client';

import { useAuth as useAuthContext } from '@/contexts/auth-context';

// Re-export the useAuth from context for backward compatibility
export const useAuth = useAuthContext; 