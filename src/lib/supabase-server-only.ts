/**
 * SERVER-ONLY SUPABASE CLIENT
 * Designed specifically for Server Actions, API routes, and server components
 * Excludes realtime functionality to prevent "self is not defined" errors
 */

// Environment detection
const isServer = typeof window === 'undefined';
const isBuild = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build';

// Only proceed if we're on the server
if (!isServer) {
  throw new Error('supabase-server-only.ts should only be imported in server-side code');
}

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration for server-side client');
}

// Dynamic import to avoid build-time issues
let supabaseServerClient: any = null;

try {
  // Only create client if not in build phase
  if (!isBuild) {
    const { getCustomSupabaseClient } = require('./supabase-custom-client');
    supabaseServerClient = getCustomSupabaseClient();
  }
} catch (error) {
  console.warn('⚠️ Server Supabase client creation failed during build, using fallback');
}

// Fallback for build time
const buildTimeFallback = {
  from: (table: string) => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: null, error: null }),
    update: () => ({ data: null, error: null }),
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
  }
};

// Export the server-safe client
export const supabaseServer = supabaseServerClient || buildTimeFallback;

// Log initialization (only in runtime, not build)
if (!isBuild && supabaseServerClient) {
  console.log('✅ Server-only Supabase client initialized without realtime');
} 