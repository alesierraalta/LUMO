#!/usr/bin/env node

/**
 * Authentication Fix Validation Script
 * Tests the Supabase authentication configuration
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSupabaseAuth() {
  console.log('🧪 Testing Supabase Authentication Configuration...\n');

  // 1. Check environment variables
  console.log('📋 Environment Variables Check:');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    console.log('❌ NEXT_PUBLIC_SUPABASE_URL not found');
    return false;
  }
  console.log('✅ SUPABASE_URL:', supabaseUrl.substring(0, 30) + '...');

  if (!supabaseAnonKey) {
    console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found');
    return false;
  }
  console.log('✅ SUPABASE_ANON_KEY:', supabaseAnonKey.substring(0, 20) + '...');

  // 2. Test Supabase connection
  console.log('\n🔌 Testing Supabase Connection:');
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test basic connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.log('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
  } catch (error) {
    console.log('❌ Supabase connection error:', error.message);
    return false;
  }

  // 3. Test tables exist
  console.log('\n📊 Testing Required Tables:');
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const tables = ['users', 'roles'];
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ Table '${table}' error:`, error.message);
      } else {
        console.log(`✅ Table '${table}' accessible`);
      }
    }
  } catch (error) {
    console.log('❌ Tables test error:', error.message);
  }

  console.log('\n🎉 Authentication configuration validation complete!');
  console.log('\n📝 Next Steps:');
  console.log('1. Test login with your credentials at /login');
  console.log('2. Check browser dev tools for Supabase auth cookies');
  console.log('3. Verify middleware allows access to /dashboard');
  
  return true;
}

// Run the test
testSupabaseAuth().catch(console.error); 