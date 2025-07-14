import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ndprriqyhddjoixrlqnz.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcHJyaXF5aGRkam9peHJscW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMDg0MDAsImV4cCI6MjA2NTY4NDQwMH0.4rzi6UFGnN6ien_706ETHjBylZMK6jt0vjRvvnJ1J-8';

let supabaseClient = null;

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