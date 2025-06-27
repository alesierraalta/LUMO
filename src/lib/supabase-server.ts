
// ULTRA-AGGRESSIVE BUILD DETECTION
const isBuild = process.env.NODE_ENV === 'production' && (
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.BUILD_ID ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co' ||
  typeof process !== 'undefined' && process.argv && process.argv.some(arg => arg.includes('next build'))
);

if (isBuild) {
  console.log('🏗️ BUILD MODE: Bypassing Supabase initialization');
}

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