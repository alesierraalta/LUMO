const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'supabase.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testFullAuthFlow() {
  console.log('🧪 Testing Full Authentication Flow...\n');
  
  try {
    // 1. Clear any existing session
    console.log('1. Clearing existing session...');
    await supabase.auth.signOut();
    
    // 2. Login
    console.log('2. Logging in with alesierraalta@gmail.com...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'alesierraalta@gmail.com',
      password: 'admin123'
    });
    
    if (loginError) {
      console.log('❌ Login failed:', loginError.message);
      return;
    }
    
    console.log('✅ Login successful!');
    console.log('   User ID:', loginData.user.id);
    console.log('   Email:', loginData.user.email);
    console.log('   Session exists:', !!loginData.session);
    console.log('   Access token exists:', !!loginData.session?.access_token);
    
    // 3. Test session persistence
    console.log('\n3. Testing session persistence...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.log('❌ Session not persisted:', sessionError?.message);
      return;
    }
    
    console.log('✅ Session persisted successfully!');
    console.log('   Session user:', session.user.email);
    console.log('   Access token valid:', !!session.access_token);
    
    // 4. Test API endpoint
    console.log('\n4. Testing /api/auth/supabase-me endpoint...');
    
    const response = await fetch('http://localhost:3000/api/auth/supabase-me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    
    const responseData = await response.json();
    
    if (response.ok && responseData.success) {
      console.log('✅ API endpoint working!');
      console.log('   User:', responseData.user.email);
      console.log('   Role:', responseData.user.role);
      console.log('   Active:', responseData.user.isActive);
    } else {
      console.log('❌ API endpoint failed:', response.status, responseData);
    }
    
    // 5. Test auth state change simulation
    console.log('\n5. Testing auth state change simulation...');
    
    // Simulate what happens when the page loads
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('❌ Auth state not maintained:', userError?.message);
    } else {
      console.log('✅ Auth state maintained!');
      console.log('   User still authenticated:', user.email);
    }
    
    // 6. Logout
    console.log('\n6. Testing logout...');
    await supabase.auth.signOut();
    
    const { data: { session: afterLogout } } = await supabase.auth.getSession();
    
    if (!afterLogout) {
      console.log('✅ Logout successful - session cleared');
    } else {
      console.log('❌ Logout failed - session still exists');
    }
    
    console.log('\n🎉 Full auth flow test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFullAuthFlow(); 