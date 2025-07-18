import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment variables - NO HARDCODED FALLBACKS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseClient = null;

// Validate configuration with better client-side handling
if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    // Client-side: Show user-friendly warning but don't throw
    console.warn('⚠️ RUNTIME MODE: Missing Supabase configuration - using fallback client');
    console.warn('⚠️ Missing Supabase client configuration');
  } else {
    // Server-side: Throw error as before
    console.error('⚠️ Missing Supabase client configuration. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
    throw new Error('Missing Supabase configuration');
  }
}

// Debug logging to see which configuration is being used (only in development)
if (process.env.NODE_ENV === 'development' && supabaseUrl && supabaseAnonKey) {
  console.log('[SUPABASE] Configuration:');
  console.log('[SUPABASE] URL:', supabaseUrl);
  console.log('[SUPABASE] Key (first 20 chars):', supabaseAnonKey.substring(0, 20) + '...');
  console.log('[SUPABASE] Environment:', process.env.NODE_ENV);
}

export function getSupabaseClient() {
  if (!supabaseClient) {
    if (!supabaseUrl || !supabaseAnonKey) {
      // Create a minimal fallback client for client-side rendering
      if (typeof window !== 'undefined') {
        console.warn('[SUPABASE] Creating fallback client due to missing configuration');
        // Return a minimal client that won't crash but will show warnings
        return createClient('https://placeholder.supabase.co', 'placeholder-key');
      } else {
        throw new Error('Missing Supabase configuration on server-side');
      }
    }
    
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[SUPABASE] Client created successfully');
    }
  }
  return supabaseClient;
}