const { createClient } = require('@supabase/supabase-js');

async function debugAuth() {
  console.log('🔍 Debugging authentication flow...');
  
  const supabase = createClient(
    'https://ubjujxtvlubxowsphvuk.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4'
  );

  const email = 'alesierraalta@gmail.com';
  const password = 'admin123';

  try {
    // Test Supabase Auth
    console.log('1. Testing Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.log('❌ Supabase auth failed:', authError.message);
    } else {
      console.log('✅ Supabase auth successful');
      console.log('Auth user ID:', authData.user.id);
      console.log('Auth user email:', authData.user.email);
    }

    // Test database lookup
    console.log('2. Testing database lookup...');
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('id, email, name, is_active, role_id')
      .eq('email', email.toLowerCase())
      .single();

    if (userDataError) {
      console.log('❌ Database lookup failed:', userDataError.message);
    } else {
      console.log('✅ Database lookup successful');
      console.log('Database user ID:', userData.id);
      console.log('Database user email:', userData.email);
      console.log('Database user name:', userData.name);
    }

    // Compare IDs
    if (authData?.user?.id && userData?.id) {
      console.log('🔍 ID Comparison:');
      console.log('Supabase Auth ID:', authData.user.id);
      console.log('Database ID:', userData.id);
      console.log('IDs match:', authData.user.id === userData.id);
    }

  } catch (error) {
    console.error('❌ Debug error:', error.message);
  }
}

debugAuth(); 