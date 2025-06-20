import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton Supabase client with safe realtime handling
let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('⚠️ Missing Supabase configuration');
      // Return a fallback client
      return {
        auth: {
          getUser: () => Promise.resolve({ data: { user: null }, error: null }),
          getSession: () => Promise.resolve({ data: { session: null }, error: null }),
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

    try {
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          autoRefreshToken: true,
          persistSession: true,
        },
        // CRITICAL: Safe realtime configuration for singleton
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
    } catch (error) {
      console.warn('⚠️ Supabase client creation failed, using fallback:', error);
      
      // Return a minimal fallback client
      supabaseClient = {
        auth: {
          getUser: () => Promise.resolve({ data: { user: null }, error: null }),
          getSession: () => Promise.resolve({ data: { session: null }, error: null }),
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
  }

  return supabaseClient;
};

// Reset singleton (useful for testing)
export const resetSupabaseClient = () => {
  supabaseClient = null;
};

/**
 * Verifica si hay una instancia activa
 */
export function hasSupabaseInstance(): boolean {
  return supabaseClient !== null;
} 