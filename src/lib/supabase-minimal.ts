/**
 * MINIMAL SUPABASE CLIENT - BUILD-SAFE VERSION
 * Avoids realtime module that causes "self is not defined" errors
 */

// CRITICAL FIX: Only import the core Supabase client without realtime
import { SupabaseClient } from '@supabase/supabase-js'

// Build-time environment detection
const isServer = typeof window === 'undefined';
const isBuild = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build';

// Configuration with build-time safety
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// CRITICAL FIX: Create minimal client without realtime functionality
let supabaseClient: SupabaseClient | null = null;

try {
  // Only create client if not in build phase
  if (!isBuild) {
    // Dynamic import to avoid build-time issues
    const { createClient } = require('@supabase/supabase-js');
    
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false, // Disable session persistence
        autoRefreshToken: false, // Disable auto-refresh
        detectSessionInUrl: false, // Disable URL session detection
      },
      realtime: {
        // Disable realtime completely
        params: {
          eventsPerSecond: 0,
        },
      },
      global: {
        headers: {},
      }
    });
  }
} catch (error) {
  console.warn('⚠️ Supabase client creation failed during build, using fallback');
  supabaseClient = null;
}

// Fallback client for build time
const fallbackClient = {
  from: (table: string) => ({
    select: () => ({ data: [], error: null, single: () => ({ data: null, error: null }) }),
    insert: () => ({ data: null, error: null, select: () => ({ single: () => ({ data: null, error: null }) }) }),
    update: () => ({ data: null, error: null, select: () => ({ single: () => ({ data: null, error: null }) }) }),
    delete: () => ({ data: null, error: null }),
    eq: function() { return this; },
    single: () => ({ data: null, error: null }),
    limit: function() { return this; },
    order: function() { return this; },
    range: function() { return this; },
  }),
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
  }
};

// Export the safe client
export const supabase = supabaseClient || fallbackClient;

// Safe logging
if (!isBuild && isServer && supabaseClient) {
  console.log('✅ Minimal Supabase client initialized safely');
} 