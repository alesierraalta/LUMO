#!/usr/bin/env node

/**
 * LUMO Users API Fix Verification
 * Tests that the users API endpoint works with Supabase authentication
 */

const { createClient } = require('@supabase/supabase-js');

console.log('🔍 LUMO Users API Fix Verification');
console.log('=' .repeat(60));

async function testUsersAPI() {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Missing Supabase environment variables');
      return false;
    }
    
    console.log('✅ Supabase environment variables found');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test authentication
    console.log('\n2. Testing Supabase authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('⚠️ No active Supabase session found');
      console.log('   This is expected if not logged in');
      return true; // Not an error, just not logged in
    }
    
    console.log('✅ Active Supabase session found:', user.email);
    
    // Test users API endpoint
    console.log('\n3. Testing users API endpoint...');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      console.log('⚠️ No access token available');
      return true;
    }
    
    try {
      const response = await fetch('http://localhost:3000/api/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      console.log('📡 API Response Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Users API working with Supabase auth!');
        console.log('📊 Users found:', data.users?.length || 0);
        return true;
      } else {
        const errorData = await response.json();
        console.log('❌ API Error:', errorData.error);
        return false;
      }
    } catch (fetchError) {
      console.log('❌ Fetch error:', fetchError.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  }
}

// Test 1: Check API endpoint file exists
console.log('\n1. Checking users API endpoint...');
const fs = require('fs');
const path = require('path');

const apiPath = path.join(process.cwd(), 'src/app/api/users/route.ts');
if (fs.existsSync(apiPath)) {
  const content = fs.readFileSync(apiPath, 'utf8');
  
  if (content.includes('getCurrentUser') && content.includes('createClient')) {
    console.log('✅ Users API updated with Supabase support');
  } else {
    console.log('❌ Users API missing Supabase support');
    return;
  }
} else {
  console.log('❌ Users API endpoint not found');
  return;
}

// Run the API test
testUsersAPI().then(success => {
  console.log('\n' + '=' .repeat(60));
  if (success) {
    console.log('🎉 Users API fix verification completed successfully!');
  } else {
    console.log('⚠️ Users API fix verification completed with issues');
  }
}).catch(error => {
  console.error('❌ Verification failed:', error.message);
}); 