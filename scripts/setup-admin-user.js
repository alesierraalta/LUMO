import fetch from 'node-fetch';

const deployments = [
  'https://lumo-woad.vercel.app',
  'https://lumo-git-main-alesierraaltas-projects.vercel.app'
];

// Standard role IDs that should exist
const ROLES = [
  { id: '408782ff-7669-442f-a626-6eb9569d3f77', name: 'USER', description: 'Standard user access' },
  { id: '8f9e1c2d-4b6a-4c8e-9f5a-1d3e7f9b2c4a', name: 'MANAGER', description: 'Management access' },
  { id: 'a1b2c3d4-e5f6-7890-abcd-1234567890ef', name: 'ADMIN', description: 'Full administrative access' }
];

async function setupAdminUser() {
  console.log('🚀 Setting up admin user: alesierraalta@gmail.com\n');
  
  for (const baseUrl of deployments) {
    console.log(`📍 Setting up: ${baseUrl}`);
    console.log('====================================================');
    
    try {
      // Step 1: Check roles
      console.log('🔍 Step 1: Checking existing roles...');
      const rolesResponse = await fetch(`${baseUrl}/api/debug-roles`);
      
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        console.log(`✅ Database connected. Found ${rolesData.roles?.length || 0} roles`);
        
        if (rolesData.roles?.length === 0) {
          console.log('⚠️  No roles found. Database needs seeding.');
        } else {
          console.log('📋 Existing roles:', rolesData.roles.map(r => `${r.name} (${r.id})`));
        }
      } else {
        console.log('❌ Cannot access roles endpoint');
        continue;
      }
      
      // Step 2: Try to create admin user with existing temp endpoint
      console.log('\n🔍 Step 2: Testing user creation...');
      const createResponse = await fetch(`${baseUrl}/api/users/create-temp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log(`📤 Create user status: ${createResponse.status}`);
      
      if (createResponse.ok) {
        const createData = await createResponse.json();
        console.log('✅ User creation successful:', createData.user?.email);
      } else {
        const createError = await createResponse.json();
        console.log('❌ User creation failed:', createError.error || 'Unknown error');
        
        // Check if it's a role ID issue
        if (createError.error?.includes('role') || createError.error?.includes('foreign key')) {
          console.log('💡 Likely issue: Role ID not found in database');
        }
      }
      
      // Step 3: Try login with admin credentials
      console.log('\n🔍 Step 3: Testing admin login...');
      const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'alesierraalta@gmail.com',
          password: 'admin123'
        })
      });
      
      console.log(`🔐 Login status: ${loginResponse.status}`);
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log('✅ Admin login successful!');
        console.log('👤 Admin user:', {
          email: loginData.user?.email,
          name: loginData.user?.name,
          role: loginData.user?.role?.name
        });
      } else {
        const loginError = await loginResponse.json();
        console.log('❌ Admin login failed:', loginError.error);
      }
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
    }
    
    console.log('\n');
  }
  
  console.log('📋 RECOMMENDATIONS:');
  console.log('1. Ensure database has required roles seeded');
  console.log('2. Update create-temp endpoint to create alesierraalta@gmail.com');
  console.log('3. Verify environment variables are properly configured');
  console.log('4. Check Supabase service client configuration');
}

setupAdminUser();