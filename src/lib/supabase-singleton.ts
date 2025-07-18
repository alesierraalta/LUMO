import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment variables - NO HARDCODED FALLBACKS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseClient = null;

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Missing Supabase client configuration. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
  throw new Error('Missing Supabase configuration');
}

// Debug logging to see which configuration is being used
console.log('[SUPABASE] Configuration:');
console.log('[SUPABASE] URL:', supabaseUrl);
console.log('[SUPABASE] Key (first 20 chars):', supabaseAnonKey.substring(0, 20) + '...');
console.log('[SUPABASE] Environment:', process.env.NODE_ENV);

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    console.log('[SUPABASE] Client created successfully');
  }
  return supabaseClient;
}