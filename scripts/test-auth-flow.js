const { createClient } = require('@supabase/supabase-js');

// Test authentication flow
async function testAuthFlow() {
  console.log('🔍 Testing authentication flow...\n');
  
  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    console.log('✅ Supabase client initialized');
    console.log('📍 URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('🔑 Key (first 20 chars):', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...\n');
    
    // Test 1: Get current session
    console.log('🔍 Test 1: Getting current session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError.message);
      return;
    }
    
    if (!session) {
      console.log('⚠️ No active session found');
      console.log('💡 Please log in to the app first, then run this script');
      return;
    }
    
    console.log('✅ Session found for:', session.user.email);
    console.log('🔑 Access token (first 20 chars):', session.access_token.substring(0, 20) + '...\n');
    
    // Test 2: Test API calls with different token formats
    const baseUrl = 'https://lumo-woad.vercel.app';
    
    console.log('🔍 Test 2: Testing API calls...\n');
    
    // Test with Bearer token
    console.log('🔍 Testing /api/roles with Bearer token...');
    const rolesResponse = await fetch(`${baseUrl}/api/roles`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Roles API response:', rolesResponse.status, rolesResponse.statusText);
    
    if (!rolesResponse.ok) {
      const errorText = await rolesResponse.text();
      console.log('❌ Error response:', errorText);
    } else {
      const rolesData = await rolesResponse.json();
      console.log('✅ Roles data:', rolesData);
    }
    
    console.log('');
    
    // Test permissions API
    console.log('🔍 Testing /api/permissions with Bearer token...');
    const permissionsResponse = await fetch(`${baseUrl}/api/permissions`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Permissions API response:', permissionsResponse.status, permissionsResponse.statusText);
    
    if (!permissionsResponse.ok) {
      const errorText = await permissionsResponse.text();
      console.log('❌ Error response:', errorText);
    } else {
      const permissionsData = await permissionsResponse.json();
      console.log('✅ Permissions data:', permissionsData);
    }
    
    console.log('');
    
    // Test 3: Validate token directly
    console.log('🔍 Test 3: Validating token with Supabase...');
    const { data: { user }, error: userError } = await supabase.auth.getUser(session.access_token);
    
    if (userError) {
      console.error('❌ Token validation error:', userError.message);
    } else {
      console.log('✅ Token is valid for user:', user.email);
      console.log('👤 User ID:', user.id);
    }
    
    console.log('');
    
    // Test 4: Check database user
    console.log('🔍 Test 4: Checking database user...');
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        is_active,
        role_id,
        roles!role_id (
          id,
          name
        )
      `)
      .eq('email', user.email)
      .single();
    
    if (dbError) {
      console.error('❌ Database user error:', dbError.message);
    } else {
      console.log('✅ Database user found:', {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.roles?.name,
        isActive: dbUser.is_active
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testAuthFlow().catch(console.error); 