/**
 * Script to verify that authentication is working correctly
 * Run this after adding SUPABASE_SERVICE_ROLE_KEY to Vercel
 */

const PRODUCTION_URL = 'https://lumo-woad.vercel.app';

async function verifyAuth() {
  console.log('🔍 Verifying authentication on production...\n');

  try {
    // Step 1: Try to access API without auth (should fail)
    console.log('1️⃣ Testing API without authentication...');
    const unauthResponse = await fetch(`${PRODUCTION_URL}/api/users`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (unauthResponse.status === 401) {
      console.log('✅ Correctly returns 401 when not authenticated\n');
    } else {
      console.log(`❌ Expected 401 but got ${unauthResponse.status}\n`);
    }

    // Step 2: Login
    console.log('2️⃣ Attempting to login...');
    const loginResponse = await fetch(`${PRODUCTION_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'alesierraalta@gmail.com',
        password: 'YOUR_PASSWORD_HERE', // Replace with actual password
      }),
      credentials: 'include',
    });

    if (!loginResponse.ok) {
      console.log(`❌ Login failed with status ${loginResponse.status}`);
      const error = await loginResponse.json();
      console.log('Error:', error);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    console.log('   User:', loginData.user?.email);
    console.log('   Role:', loginData.user?.role);
    
    // Extract token from response
    const token = loginData.session?.access_token;
    if (!token) {
      console.log('❌ No access token in response');
      return;
    }
    console.log('✅ Access token received\n');

    // Step 3: Test authenticated API calls
    console.log('3️⃣ Testing authenticated API calls...\n');

    // Test /api/users
    console.log('   Testing /api/users...');
    const usersResponse = await fetch(`${PRODUCTION_URL}/api/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log(`   ✅ Success! Retrieved ${usersData.users?.length || 0} users`);
    } else {
      console.log(`   ❌ Failed with status ${usersResponse.status}`);
    }

    // Test /api/inventory
    console.log('\n   Testing /api/inventory...');
    const inventoryResponse = await fetch(`${PRODUCTION_URL}/api/inventory`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (inventoryResponse.ok) {
      const inventoryData = await inventoryResponse.json();
      console.log(`   ✅ Success! Retrieved ${inventoryData.items?.length || 0} inventory items`);
    } else {
      console.log(`   ❌ Failed with status ${inventoryResponse.status}`);
    }

    // Test /api/categories
    console.log('\n   Testing /api/categories...');
    const categoriesResponse = await fetch(`${PRODUCTION_URL}/api/categories`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (categoriesResponse.ok) {
      const categoriesData = await categoriesResponse.json();
      console.log(`   ✅ Success! Retrieved ${categoriesData.categories?.length || 0} categories`);
    } else {
      console.log(`   ❌ Failed with status ${categoriesResponse.status}`);
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    const allPassed = usersResponse.ok && inventoryResponse.ok && categoriesResponse.ok;
    if (allPassed) {
      console.log('✅ ALL TESTS PASSED! Authentication is working correctly.');
    } else {
      console.log('❌ Some tests failed. Check that SUPABASE_SERVICE_ROLE_KEY is set in Vercel.');
    }
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

// Run verification
console.log('🚀 LUMO Authentication Verification Script');
console.log('=========================================\n');
console.log('⚠️  IMPORTANT: Replace YOUR_PASSWORD_HERE with your actual password\n');

// Check if running in Node.js
if (typeof window === 'undefined') {
  // In Node.js, we need fetch
  import('node-fetch').then(module => {
    global.fetch = module.default;
    verifyAuth();
  }).catch(() => {
    console.log('❌ Please install node-fetch: npm install node-fetch');
  });
} else {
  // In browser
  verifyAuth();
}