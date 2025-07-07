const { createClient } = require('@supabase/supabase-js');

async function debugUserLookup() {
  console.log('🔍 Debugging User Lookup in Login Endpoint...\n');

  try {
    const supabase = createClient(
      'https://ubjujxtvlubxowsphvuk.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4'
    );

    const email = 'alesierraalta@gmail.com';
    console.log(`📝 Step 1: Testing Supabase Auth login for ${email}`);
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: 'admin123'
    });

    if (authError) {
      console.log('❌ Supabase auth failed:', authError.message);
      return;
    }

    console.log('✅ Supabase auth successful');
    console.log('🔍 Auth user ID:', authData.user.id);
    console.log('🔍 Auth user email:', authData.user.email);

    console.log(`\n📝 Step 2: Looking up user in database by email: ${authData.user.email}`);
    
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select(`
        id,
        name,
        is_active,
        role_id,
        email
      `)
      .eq('email', authData.user.email)
      .single();

    if (userDataError) {
      console.log('❌ User lookup error:', userDataError.message);
      console.log('🔍 Error details:', JSON.stringify(userDataError, null, 2));
    } else if (userData) {
      console.log('✅ User found in database:');
      console.log('🔍 Database user ID:', userData.id);
      console.log('🔍 Database user email:', userData.email);
      console.log('🔍 Database user name:', userData.name);
      console.log('🔍 Database user active:', userData.is_active);
      console.log('🔍 Database user role_id:', userData.role_id);
    } else {
      console.log('❌ No user found in database');
    }

    console.log(`\n📝 Step 3: Checking all users with similar email`);
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, email, name')
      .ilike('email', '%alesierraalta%');

    if (allUsersError) {
      console.log('❌ All users lookup error:', allUsersError.message);
    } else {
      console.log('✅ Found users with similar email:');
      allUsers.forEach(user => {
        console.log(`   - ID: ${user.id}, Email: ${user.email}, Name: ${user.name}`);
      });
    }

    return {
      authUserId: authData.user.id,
      authUserEmail: authData.user.email,
      databaseUserId: userData?.id,
      databaseUserEmail: userData?.email,
      mismatch: authData.user.id !== userData?.id
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
debugUserLookup().then(result => {
  console.log('\n' + '='.repeat(50));
  console.log('🏁 DEBUG RESULT:');
  if (result.mismatch) {
    console.log('❌ USER ID MISMATCH DETECTED!');
    console.log(`Auth User ID: ${result.authUserId}`);
    console.log(`Database User ID: ${result.databaseUserId}`);
    console.log(`Auth Email: ${result.authUserEmail}`);
    console.log(`Database Email: ${result.databaseUserEmail}`);
  } else if (result.success !== false) {
    console.log('✅ User IDs match correctly');
  }
  console.log('='.repeat(50));
  
  process.exit(0);
}); 