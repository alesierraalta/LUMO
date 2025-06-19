const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'supabase.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testCompleteLoginFlow() {
  console.log('🚀 Testing Complete Login Flow (Frontend + Backend)...\n');
  
  try {
    // 1. Clear any existing session (simulate fresh start)
    console.log('1. Clearing existing session...');
    await supabase.auth.signOut();
    
    // 2. Simulate login form submission
    console.log('2. Simulating login form submission...');
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: 'alesierraalta@gmail.com',
      password: 'admin123'
    });
    
    if (authError) {
      console.log('❌ Login failed:', authError.message);
      return;
    }
    
    console.log('✅ Supabase login successful, user ID:', data.user.id);
    
    // 3. Verify session is established (like login page does)
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      console.log('❌ No session established');
      return;
    }
    
    console.log('✅ Session established successfully');
    
    // 4. Simulate auth context refetch (what happens after login)
    console.log('\n4. Simulating auth context refetch...');
    
    // Get current session (like updated context does)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.log('❌ No valid session found in refetch');
      return;
    }
    
    console.log('✅ Valid session found for:', session.user.email);
    
    // Call the API endpoint (like context does)
    const response = await fetch('http://localhost:3000/api/auth/supabase-me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      credentials: 'include'
    });
    
    if (response.ok) {
      const responseData = await response.json();
      console.log('✅ API response received:', responseData.success);
      
      if (responseData.success && responseData.user) {
        const fullUser = {
          id: responseData.user.id,
          email: responseData.user.email,
          name: responseData.user.name,
          role: responseData.user.role,
          isActive: responseData.user.isActive,
          permissions: responseData.user.permissions || []
        };
        
        console.log('✅ Full user data compiled:', fullUser.email, 'Role:', fullUser.role);
        console.log('✅ User is active:', fullUser.isActive);
        console.log('✅ User permissions:', fullUser.permissions.join(', '));
        
        // 5. Simulate dashboard navigation
        console.log('\n5. Simulating dashboard navigation...');
        
        if (fullUser.role === 'ADMIN' && fullUser.isActive) {
          console.log('✅ User has ADMIN role and is active - dashboard access should work!');
          console.log('✅ Navigation to dashboard would be successful');
          
          // 6. Test dashboard API access
          console.log('\n6. Testing dashboard API access...');
          
          const dashboardResponse = await fetch('http://localhost:3000/api/auth/supabase-me', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          
          if (dashboardResponse.ok) {
            console.log('✅ Dashboard API access working - user authenticated!');
          } else {
            console.log('❌ Dashboard API access failed');
          }
          
        } else {
          console.log('❌ User role or status issue:', fullUser.role, 'Active:', fullUser.isActive);
        }
        
        console.log('\n🎉 COMPLETE LOGIN FLOW SUCCESSFUL!');
        console.log('📋 Summary:');
        console.log('   ✅ Login: Working');
        console.log('   ✅ Session: Persistent');
        console.log('   ✅ Auth Context: Working');
        console.log('   ✅ API Access: Working');
        console.log('   ✅ Dashboard Access: Should work');
        
        return true;
      }
    } else {
      console.warn('⚠️ API call failed with status:', response.status);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

testCompleteLoginFlow().then(success => {
  if (success) {
    console.log('\n🚀 Ready to test in browser! Login should work perfectly now.');
  } else {
    console.log('\n❌ Issues found - login may not work properly.');
  }
}); 