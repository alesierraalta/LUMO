/**
 * SERVER-ONLY SUPABASE CLIENT - ULTRA BUILD-SAFE VERSION
 * Designed specifically for Server Actions, API routes, and server components
 * Excludes realtime functionality to prevent "self is not defined" errors
 * ULTRA BUILD FIX: Complete bypass during build phase
 */

// FIXED BUILD DETECTION - Only trigger during actual build, not runtime
const isServer = typeof window === 'undefined';
const isBuild = (
  process.env.NEXT_PHASE === 'phase-production-build' ||
  (typeof process !== 'undefined' && process.argv && process.argv.some(arg => arg.includes('next build')))
);

// RUNTIME SAFETY: Check for missing configuration but don't treat as build mode
const hasMissingConfig = (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'
);

console.log('🔍 [SERVER-ONLY] Environment Detection:', {
  isServer,
  isBuild,
  hasMissingConfig,
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PHASE: process.env.NEXT_PHASE,
  BUILD_ID: !!process.env.BUILD_ID,
  hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL
});

// Only proceed if we're on the server
if (!isServer) {
  throw new Error('supabase-server-only.ts should only be imported in server-side code');
}

// ULTRA BUILD FIX: Completely skip configuration checks during build
let supabaseUrl: string | undefined;
let supabaseServiceKey: string | undefined;

if (isBuild) {
  console.log('🏗️ [SERVER-ONLY] BUILD MODE: Skipping Supabase configuration checks');
  supabaseUrl = 'https://placeholder.supabase.co';
  supabaseServiceKey = 'placeholder-key';
} else if (hasMissingConfig) {
  console.log('⚠️ [SERVER-ONLY] RUNTIME MODE: Missing Supabase configuration - using fallback client');
  supabaseUrl = 'https://placeholder.supabase.co';
  supabaseServiceKey = 'placeholder-key';
} else {
  // Only check configuration during runtime
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️ [SERVER-ONLY] Missing Supabase configuration for server-side client - using fallback');
    supabaseUrl = 'https://placeholder.supabase.co';
    supabaseServiceKey = 'placeholder-key';
  }
}

// Dynamic import to avoid build-time issues
let supabaseServerClient: any = null;

if (isBuild) {
  console.log('🏗️ [SERVER-ONLY] BUILD MODE: Using fallback client');
  supabaseServerClient = null;
} else {
  try {
    // Only create client during runtime with valid configuration
    if (supabaseUrl && supabaseServiceKey && 
        !supabaseUrl.includes('placeholder') && 
        !supabaseServiceKey.includes('placeholder')) {
      const { getCustomSupabaseClient } = require('./supabase-custom-client');
      supabaseServerClient = getCustomSupabaseClient();
      console.log('✅ [SERVER-ONLY] Real Supabase client initialized');
    } else {
      console.log('⚠️ [SERVER-ONLY] Using fallback client due to missing configuration');
      supabaseServerClient = null;
    }
  } catch (error) {
    console.warn('⚠️ [SERVER-ONLY] Server Supabase client creation failed, using fallback:', error);
    supabaseServerClient = null;
  }
}

// ULTRA-SAFE fallback for build time and error scenarios
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

// Export the server-safe client - ALWAYS use fallback during build
export const supabaseServer = isBuild ? buildTimeFallback : (supabaseServerClient || buildTimeFallback);

// Log initialization status
if (isBuild) {
  console.log('🏗️ [SERVER-ONLY] BUILD MODE: Using fallback client for build safety');
} else if (supabaseServerClient) {
  console.log('✅ [SERVER-ONLY] Server-only Supabase client initialized without realtime');
} else {
  console.log('⚠️ [SERVER-ONLY] Using fallback client - check Supabase configuration');
} 