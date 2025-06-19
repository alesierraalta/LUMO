const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'supabase.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testLogin() {
  console.log('🧪 Testing login with alesierraalta@gmail.com...');
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'alesierraalta@gmail.com',
    password: 'admin123'
  });
  
  if (error) {
    console.log('❌ Error:', error.message);
  } else {
    console.log('✅ Login successful!');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('Email confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');
    await supabase.auth.signOut();
    console.log('🚀 Ready to login in the web app!');
  }
}

testLogin(); 