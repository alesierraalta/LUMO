const { createClient } = require('@supabase/supabase-js');

async function debugMultipleUsers() {
  console.log('🔍 Debugging Multiple Users Issue...\n');

  try {
    const supabase = createClient(
      'https://ubjujxtvlubxowsphvuk.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4'
    );

    console.log('📝 Step 1: Check all users with email alesierraalta@gmail.com');
    
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'alesierraalta@gmail.com');

    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }

    console.log(`✅ Found ${users.length} user(s) with email alesierraalta@gmail.com:`);
    users.forEach((user, index) => {
      console.log(`\n   User ${index + 1}:`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Name: ${user.name}`);
      console.log(`   - Active: ${user.is_active}`);
      console.log(`   - Role ID: ${user.role_id}`);
      console.log(`   - Created: ${user.created_at}`);
      console.log(`   - Updated: ${user.updated_at}`);
    });

    console.log('\n📝 Step 2: Check what the /api/users endpoint returns');
    
    // Test the API endpoint to see what it returns
    const fetch = require('node-fetch');
    const usersResponse = await fetch('http://localhost:3000/api/users');
    
    if (!usersResponse.ok) {
      console.log('❌ API users endpoint failed:', usersResponse.status);
      return;
    }

    const usersData = await usersResponse.json();
    const apiUser = usersData.users?.find(user => user.email === 'alesierraalta@gmail.com');
    
    if (apiUser) {
      console.log('✅ API endpoint returns user:');
      console.log(`   - ID: ${apiUser.id}`);
      console.log(`   - Email: ${apiUser.email}`);
      console.log(`   - Name: ${apiUser.name}`);
    } else {
      console.log('❌ API endpoint does not return user with this email');
    }

    // Compare the results
    console.log('\n📝 Step 3: Comparison');
    if (users.length > 1) {
      console.log('⚠️ MULTIPLE USERS DETECTED with same email!');
      console.log('This could cause authentication issues.');
    }

    if (apiUser && users.length > 0) {
      const directUser = users[0]; // Assuming we want the first one
      if (apiUser.id !== directUser.id) {
        console.log('❌ MISMATCH: API returns different user than direct database query');
        console.log(`   Direct DB User ID: ${directUser.id}`);
        console.log(`   API User ID: ${apiUser.id}`);
      } else {
        console.log('✅ API and direct database query return same user');
      }
    }

    return {
      userCount: users.length,
      users: users,
      apiUser: apiUser
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
debugMultipleUsers().then(result => {
  console.log('\n' + '='.repeat(50));
  console.log('🏁 DEBUG RESULT:');
  if (result.userCount > 1) {
    console.log(`⚠️ MULTIPLE USERS DETECTED: ${result.userCount} users with same email`);
    console.log('This needs to be cleaned up to prevent authentication issues.');
  } else if (result.userCount === 1) {
    console.log('✅ Single user found - this is correct');
  }
  console.log('='.repeat(50));
  
  process.exit(0);
}); 