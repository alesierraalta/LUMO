const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLoginPradasamuel() {
  console.log('🔑 Testing login for pradasamuel1@gmail.com...');
  console.log('📍 Supabase URL:', supabaseUrl);
  console.log('🔐 Using anon key (first 20 chars):', supabaseAnonKey?.substring(0, 20) + '...');
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'pradasamuel1@gmail.com',
      password: '$OswaldoLumo2025$'
    });

    if (error) {
      console.error('❌ Login failed:', error.message);
      console.error('Error details:', error);
      return false;
    }

    console.log('✅ Login successful!');
    console.log('👤 User ID:', data.user?.id);
    console.log('📧 Email:', data.user?.email);
    console.log('🕒 Created at:', data.user?.created_at);
    
    // Sign out to clean up
    await supabase.auth.signOut();
    console.log('🚪 Signed out successfully');
    
    return true;
  } catch (err) {
    console.error('💥 Unexpected error:', err);
    return false;
  }
}

testLoginPradasamuel()
  .then(success => {
    if (success) {
      console.log('\n🎉 LOGIN TEST PASSED - User can now authenticate successfully!');
    } else {
      console.log('\n❌ LOGIN TEST FAILED - Issue still exists');
    }
  })
  .catch(console.error);