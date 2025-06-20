/**
 * Client-side Supabase configuration using custom client
 * No realtime dependencies - safe for Choreo deployment
 */

import { getCustomSupabaseClient } from './supabase-custom-client'

// Centralized Supabase client configuration
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
}

// Client-side Supabase client using our custom implementation
export const createBrowserClient = () => {
  try {
    return getCustomSupabaseClient()
  } catch (error) {
    console.warn('⚠️ Custom Supabase browser client creation failed:', error)
    
    // Return a minimal client for fallback
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Client unavailable' } }),
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
    } as any
  }
} 