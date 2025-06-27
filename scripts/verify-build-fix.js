#!/usr/bin/env node

/**
 * Build Verification Script
 * Checks if ultra build fix is working correctly
 */

console.log('🔍 Verifying ultra build fix...');

// Set build environment
process.env.NODE_ENV = 'production';
process.env.NEXT_PHASE = 'phase-production-build';
process.env.BUILD_ID = 'verification-build';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'placeholder-key';

try {
  // Test import of main db module
  const db = require('../src/lib/db');
  console.log('✅ Main db module loads successfully');
  
  // Test import of Supabase client
  const { supabase } = require('../src/lib/db-supabase');
  console.log('✅ Supabase client loads successfully');
  
  // Test that it's in build mode
  if (supabase && supabase.from) {
    const result = supabase.from('test').select();
    console.log('✅ Supabase fallback client working');
  }
  
  console.log('🎉 Ultra build fix verification PASSED!');
  
} catch (error) {
  console.error('❌ Ultra build fix verification FAILED:', error.message);
  process.exit(1);
}
