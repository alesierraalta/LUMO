const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createUserAdminAPI() {
  console.log('🔑 Creating user via Supabase Admin API...');
  console.log('📍 Supabase URL:', supabaseUrl);
  console.log('🔐 Using service key (first 20 chars):', supabaseServiceKey?.substring(0, 20) + '...');
  
  try {
    // Create user using admin API
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: 'pradasamuel1@gmail.com',
      password: '$OswaldoLumo2025$',
      email_confirm: true,
      user_metadata: {
        name: 'Updated User 1751982269581',
        email: 'pradasamuel1@gmail.com'
      }
    });

    if (error) {
      console.error('❌ User creation failed:', error.message);
      console.error('Error details:', error);
      return false;
    }

    console.log('✅ User created successfully!');
    console.log('👤 User ID:', data.user?.id);
    console.log('📧 Email:', data.user?.email);
    console.log('🕒 Created at:', data.user?.created_at);
    console.log('✅ Email confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No');
    
    return true;
  } catch (err) {
    console.error('💥 Unexpected error:', err);
    return false;
  }
}

async function testLogin() {
  console.log('\n🔑 Testing login after user creation...');
  
  // Create regular client for testing login
  const supabaseClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: 'pradasamuel1@gmail.com',
      password: '$OswaldoLumo2025$'
    });

    if (error) {
      console.error('❌ Login test failed:', error.message);
      return false;
    }

    console.log('✅ Login test successful!');
    console.log('👤 User ID:', data.user?.id);
    
    // Sign out to clean up
    await supabaseClient.auth.signOut();
    console.log('🚪 Signed out successfully');
    
    return true;
  } catch (err) {
    console.error('💥 Login test error:', err);
    return false;
  }
}

async function main() {
  const userCreated = await createUserAdminAPI();
  
  if (userCreated) {
    console.log('\n⏳ Waiting 2 seconds for user to be fully processed...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const loginSuccess = await testLogin();
    
    if (loginSuccess) {
      console.log('\n🎉 SUCCESS - User created and login works!');
    } else {
      console.log('\n⚠️  User created but login still fails');
    }
  } else {
    console.log('\n❌ FAILED - Could not create user');
  }
}

main().catch(console.error);