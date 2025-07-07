const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function comprehensiveUserDebug() {
  console.log('🔍 Comprehensive User Debug Analysis...\n');

  try {
    // 1. Direct Supabase query
    console.log('📝 Step 1: Direct Supabase query for alesierraalta@gmail.com');
    const supabase = createClient(
      'https://ubjujxtvlubxowsphvuk.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4'
    );

    const { data: directUsers, error: directError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'alesierraalta@gmail.com');

    if (directError) {
      console.log('❌ Direct query error:', directError.message);
    } else {
      console.log(`✅ Direct query found ${directUsers.length} user(s):`);
      directUsers.forEach(user => {
        console.log(`   - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
      });
    }

    // 2. All users direct query
    console.log('\n📝 Step 2: All users with alesierraalta email (direct query)');
    const { data: allDirectUsers, error: allDirectError } = await supabase
      .from('users')
      .select('*')
      .ilike('email', '%alesierraalta%');

    if (allDirectError) {
      console.log('❌ All direct query error:', allDirectError.message);
    } else {
      console.log(`✅ Direct query found ${allDirectUsers.length} user(s) with alesierraalta:`);
      allDirectUsers.forEach(user => {
        console.log(`   - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
      });
    }

    // 3. Login to get token
    console.log('\n📝 Step 3: Login to get authentication token');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alesierraalta@gmail.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginResponse.status);
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');
    console.log(`   Login returned user ID: ${loginData.user.id}`);

    // 4. API users endpoint
    console.log('\n📝 Step 4: /api/users endpoint');
    const usersResponse = await fetch(`${BASE_URL}/api/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!usersResponse.ok) {
      console.log('❌ Users API failed:', usersResponse.status);
    } else {
      const usersData = await usersResponse.json();
      const apiUser = usersData.users?.find(user => user.email === 'alesierraalta@gmail.com');
      
      console.log('✅ Users API successful');
      if (apiUser) {
        console.log(`   API returned user ID: ${apiUser.id}, Name: ${apiUser.name}`);
      } else {
        console.log('   No user with alesierraalta@gmail.com found in API response');
        console.log('   All users returned by API:');
        usersData.users?.forEach(user => {
          if (user.email.includes('alesierraalta')) {
            console.log(`     - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
          }
        });
      }
    }

    // 5. Try inventory creation to see which user ID it expects
    console.log('\n📝 Step 5: Test inventory creation to see foreign key expectation');
    const inventoryResponse = await fetch(`${BASE_URL}/api/inventory`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        name: 'Debug Test Item',
        description: 'Test item for debugging user ID',
        sku: 'DEBUG-' + Date.now(),
        categoryId: null,
        locationId: null,
        currentStock: 10,
        minStockLevel: 5,
        unitCost: 10.00,
        unitPrice: 15.00
      })
    });

    console.log(`   Inventory creation response: ${inventoryResponse.status}`);
    if (!inventoryResponse.ok) {
      const errorText = await inventoryResponse.text();
      console.log(`   Error details: ${errorText}`);
      
      // Check if it's a foreign key constraint error
      if (errorText.includes('foreign key constraint') && errorText.includes('created_by_id')) {
        const userIdMatch = errorText.match(/Key \(created_by_id\)=\(([^)]+)\)/);
        if (userIdMatch) {
          console.log(`   ❌ Foreign key error - JWT contains user ID: ${userIdMatch[1]}`);
        }
      }
    } else {
      console.log('   ✅ Inventory creation successful');
    }

    return {
      directUsers,
      allDirectUsers,
      loginUserId: loginData.user.id,
      apiUser: usersResponse.ok ? (await usersResponse.json()).users?.find(u => u.email === 'alesierraalta@gmail.com') : null
    };

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    return { 
      success: false, 
      message: `Debug error: ${error.message}` 
    };
  }
}

// Run the debug
comprehensiveUserDebug().then(result => {
  console.log('\n' + '='.repeat(60));
  console.log('🏁 COMPREHENSIVE DEBUG RESULT:');
  
  if (result.directUsers && result.loginUserId && result.apiUser) {
    const directUser = result.directUsers[0];
    console.log(`Direct DB User ID:    ${directUser?.id}`);
    console.log(`Login Response ID:    ${result.loginUserId}`);
    console.log(`API Endpoint User ID: ${result.apiUser?.id}`);
    
    const allMatch = directUser?.id === result.loginUserId && result.loginUserId === result.apiUser?.id;
    const loginDbMatch = directUser?.id === result.loginUserId;
    const apiDbMatch = directUser?.id === result.apiUser?.id;
    
    if (allMatch) {
      console.log('✅ ALL USER IDs MATCH - System is consistent');
    } else {
      console.log('❌ USER ID MISMATCH DETECTED:');
      console.log(`   Login-DB Match: ${loginDbMatch ? 'YES' : 'NO'}`);
      console.log(`   API-DB Match: ${apiDbMatch ? 'YES' : 'NO'}`);
      
      if (!apiDbMatch) {
        console.log('🔧 ISSUE: API endpoint returns different user than database');
      }
      if (!loginDbMatch) {
        console.log('🔧 ISSUE: Login returns different user than database');
      }
    }
  }
  
  console.log('='.repeat(60));
  process.exit(0);
}); 