import { getCustomSupabaseClient, CustomSupabaseClient } from './supabase-custom-client';

// Use our custom client instead of the problematic @supabase/supabase-js
export const getSupabaseClient = (): CustomSupabaseClient => {
  try {
    return getCustomSupabaseClient();
  } catch (error) {
    console.warn('⚠️ Custom Supabase client creation failed:', error);
    
    // Return a minimal fallback client with the same interface
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Client unavailable' } }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'Client unavailable' } })
          })
        })
      })
    } as any;
  }
};

// Reset singleton (useful for testing)
export const resetSupabaseClient = () => {
  // Reset the custom client
  const { resetCustomSupabaseClient } = require('./supabase-custom-client');
  resetCustomSupabaseClient();
};

/**
 * Verifica si hay una instancia activa
 */
export function hasSupabaseInstance(): boolean {
  try {
    const client = getCustomSupabaseClient();
    return !!client;
  } catch {
    return false;
  }
} 