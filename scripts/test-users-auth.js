#!/usr/bin/env node

/**
 * LUMO - Users API Authentication Test
 * Tests the authentication flow for the users API
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');

// Configuration - using production environment
const BASE_URL = 'https://lumo-woad.vercel.app';
const SUPABASE_URL = 'https://ubjujxtvlubxowsphvuk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4';

// Test credentials
const TEST_EMAIL = 'alesierraalta@gmail.com';
const TEST_PASSWORD = 'admin123';

console.log('🚀 LUMO Users API Authentication Test');
console.log('====================================');

async function testUsersAPI() {
  try {
    // 1. Create Supabase client and authenticate
    console.log('\n1️⃣ Authenticating with Supabase...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (authError) {
      console.log('❌ Authentication failed:', authError.message);
      return;
    }

    console.log('✅ Authentication successful');
    console.log('🔑 Access token length:', authData.session.access_token.length);

    // 2. Test /api/users endpoint
    console.log('\n2️⃣ Testing /api/users endpoint...');
    
    const response = await fetch(`${BASE_URL}/api/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response status text:', response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ /api/users - Success');
      console.log('👥 Users found:', data.users?.length || 0);
      
      if (data.users && data.users.length > 0) {
        console.log('📊 First user:', JSON.stringify(data.users[0], null, 2));
      }
    } else {
      const errorData = await response.text();
      console.log('❌ /api/users - Failed');
      console.log('📄 Error response:', errorData);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testUsersAPI().then(() => {
  console.log('\n✅ Users API Authentication Test Complete');
  console.log('========================================');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
}); 