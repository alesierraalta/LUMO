/**
 * Server-side Supabase configuration using custom client
 * No realtime dependencies - safe for Choreo deployment
 */

import { getCustomSupabaseClient } from './supabase-custom-client'
import { cookies } from 'next/headers'

// Server-side Supabase client using our custom implementation
export const createServerClient = async () => {
  try {
    return getCustomSupabaseClient()
  } catch (error) {
    console.warn('⚠️ Custom Supabase server client creation failed:', error)
    
    // Return a minimal client for fallback
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Client unavailable' } }),
        signOut: () => Promise.resolve({ error: null }),
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