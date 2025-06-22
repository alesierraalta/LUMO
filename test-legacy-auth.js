#!/usr/bin/env node

/**
 * Test Legacy Authentication Script
 * 
 * This script tests if the legacy JWT authentication system works
 * for the root user when Supabase Auth fails.
 */

// Using native Node.js fetch (available in Node 18+)

const ROOT_EMAIL = 'alesierraalta@gmail.com';
const ROOT_PASSWORD = 'admin123';
const BASE_URL = 'http://localhost:3000'; // Change if needed

console.log('🧪 Testing Legacy Authentication System');
console.log('=====================================');
console.log('📧 Email:', ROOT_EMAIL);
console.log('🔗 Base URL:', BASE_URL);

async function testLegacyAuth() {
  try {
    console.log('\n🔍 Step 1: Testing legacy login endpoint...');
    
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: ROOT_EMAIL,
        password: ROOT_PASSWORD,
      }),
    });

    const data = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      console.log('✅ Legacy authentication SUCCESSFUL!');
      console.log('   - User ID:', data.user?.id);
      console.log('   - Email:', data.user?.email);
      console.log('   - Name:', data.user?.name);
      console.log('   - Role:', data.user?.role);
      
      // Extract cookies from response
      const cookies = response.headers.get('set-cookie');
      if (cookies) {
        console.log('🍪 Cookies set:', cookies);
      }
      
      console.log('\n🔍 Step 2: Testing authenticated request...');
      
      // Test an authenticated endpoint
      const authResponse = await fetch(`${BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Cookie': cookies || '',
        },
      });
      
      const authData = await authResponse.json();
      console.log('📊 Auth Check Response:', JSON.stringify(authData, null, 2));
      
      if (authResponse.ok && authData.user) {
        console.log('✅ Authenticated request SUCCESSFUL!');
        console.log('   - User role verified:', authData.user.role);
        console.log('   - Admin permissions:', authData.user.role === 'ADMIN' ? 'YES' : 'NO');
      } else {
        console.log('❌ Authenticated request failed');
      }
      
    } else {
      console.log('❌ Legacy authentication FAILED');
      console.log('   - Error:', data.error || 'Unknown error');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\n💡 Make sure your development server is running:');
    console.log('   npm run dev');
  }
}

console.log('\n🚀 Starting legacy authentication test...');
testLegacyAuth(); 