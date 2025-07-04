/**
 * Test script to verify authentication context
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Testing authentication context...');

// Test Supabase connection
async function testSupabaseConnection() {
  try {
    console.log('📡 Testing Supabase connection...');
    
    // Simulate browser environment
    global.window = {
      location: { hostname: 'localhost' },
      localStorage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      }
    };
    
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase environment variables');
      return false;
    }
    
    console.log('✅ Supabase URL:', supabaseUrl);
    console.log('✅ Supabase Key (first 20 chars):', supabaseKey.substring(0, 20) + '...');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.warn('⚠️ Supabase query error:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
    
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    return false;
  }
}

// Test environment variables
function testEnvironmentVariables() {
  console.log('🔧 Testing environment variables...');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'DATABASE_URL',
    'JWT_SECRET'
  ];
  
  let allPresent = true;
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
    } else {
      console.error(`❌ Missing: ${varName}`);
      allPresent = false;
    }
  });
  
  return allPresent;
}

// Main test function
async function runTests() {
  console.log('🚀 Starting authentication context tests...\n');
  
  const envTest = testEnvironmentVariables();
  console.log('');
  
  const supabaseTest = await testSupabaseConnection();
  console.log('');
  
  console.log('📊 Test Results:');
  console.log(`Environment Variables: ${envTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Supabase Connection: ${supabaseTest ? '✅ PASS' : '❌ FAIL'}`);
  
  if (envTest && supabaseTest) {
    console.log('\n🎉 All tests passed! Authentication context should work correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the errors above.');
  }
}

// Run tests
runTests().catch(console.error); 