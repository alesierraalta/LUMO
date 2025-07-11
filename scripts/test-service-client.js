const { createServiceSupabaseClient } = require('../src/lib/supabase-service-client');

async function testServiceClient() {
  console.log('🔍 Testing service client connection...');
  
  // Check environment variables
  console.log('📊 Environment check:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET');
  console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
  
  const serviceClient = createServiceSupabaseClient();
  
  if (!serviceClient) {
    console.error('❌ Service client creation failed');
    return;
  }
  
  console.log('✅ Service client created successfully');
  
  try {
    console.log('📊 Testing roles query...');
    const result = await serviceClient
      .from('roles')
      .select('*')
      .order('name', { ascending: true });
    
    console.log('📊 Query result:', result);
    
    if (result.error) {
      console.error('❌ Query error:', result.error);
    } else {
      console.log('✅ Query successful:', result.data?.length || 0, 'roles found');
      if (result.data) {
        result.data.forEach(role => {
          console.log(`  - ${role.name}: ${role.description}`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testServiceClient().catch(console.error);