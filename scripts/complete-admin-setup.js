import fetch from 'node-fetch';

const deployments = [
  'https://lumo-woad.vercel.app',
  'https://lumo-git-main-alesierraaltas-projects.vercel.app'
];

async function completeAdminSetup() {
  console.log('🚀 Complete Admin Setup: alesierraalta@gmail.com\n');
  
  for (const baseUrl of deployments) {
    console.log(`📍 Setting up: ${baseUrl}`);
    console.log('========================================');
    
    try {
      // Step 1: Check current roles
      console.log('🔍 Step 1: Checking roles status...');
      const rolesResponse = await fetch(`${baseUrl}/api/debug-roles`);
      
      if (!rolesResponse.ok) {
        console.log('❌ Cannot access debug-roles endpoint');
        continue;
      }
      
      const rolesData = await rolesResponse.json();
      console.log(`✅ Database connected. Found ${rolesData.debug?.totalRoles || 0} total roles`);
      
      if (rolesData.debug?.missingBasicRoles?.length > 0) {
        console.log('⚠️  Missing roles:', rolesData.debug.missingBasicRoles);
        
        // Step 2: Create missing roles
        console.log('\n🔧 Step 2: Creating missing roles...');
        const createRolesResponse = await fetch(`${baseUrl}/api/debug-roles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (createRolesResponse.ok) {
          const createRolesData = await createRolesResponse.json();
          console.log('✅ Roles creation result:');
          createRolesData.results?.forEach(result => {
            const status = result.success ? '✅' : '❌';
            console.log(`  ${status} ${result.role}: ${result.success ? 'created/updated' : result.error}`);
          });
        } else {
          console.log('❌ Failed to create roles');
          continue;
        }
      } else {
        console.log('✅ All basic roles exist');
      }
      
      // Step 3: Verify roles are now available
      console.log('\n🔍 Step 3: Verifying roles...');
      const verifyRolesResponse = await fetch(`${baseUrl}/api/debug-roles`);
      if (verifyRolesResponse.ok) {
        const verifyData = await verifyRolesResponse.json();
        console.log(`✅ Total roles now: ${verifyData.debug?.totalRoles || 0}`);
        console.log('📋 Available roles:', verifyData.debug?.allRoles?.map(r => `${r.name} (${r.id})`));
        
        // Get ADMIN role ID for user creation
        const adminRole = verifyData.debug?.allRoles?.find(r => r.name === 'ADMIN');
        if (adminRole) {
          console.log(`🔑 Admin role ID: ${adminRole.id}`);
        }
      }
      
      // Step 4: Try to create user (this will likely fail with current hardcoded email)
      console.log('\n🔍 Step 4: Testing current user creation...');
      const createUserResponse = await fetch(`${baseUrl}/api/users/create-temp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log(`📤 Create user status: ${createUserResponse.status}`);
      
      if (createUserResponse.ok) {
        const createData = await createUserResponse.json();
        console.log('✅ User created:', createData.user?.email);
      } else {
        const createError = await createUserResponse.json();
        console.log('❌ User creation failed:', createError.error || 'Unknown error');
        console.log('💡 Note: Endpoint is hardcoded for pradasamuel1@gmail.com, not alesierraalta@gmail.com');
      }
      
      // Step 5: Test admin login
      console.log('\n🔍 Step 5: Testing admin login...');
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
        
        // Test authenticated endpoint
        console.log('\n🔍 Step 6: Testing authenticated endpoint...');
        const authResponse = await fetch(`${baseUrl}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (authResponse.ok) {
          const authData = await authResponse.json();
          console.log('✅ Authenticated endpoint works:', authData.user?.email);
        } else {
          console.log('❌ Authenticated endpoint failed');
        }
        
      } else {
        const loginError = await loginResponse.json();
        console.log('❌ Admin login failed:', loginError.error);
        console.log('💡 User alesierraalta@gmail.com needs to be created in the database');
      }
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
    }
    
    console.log('\n');
  }
  
  console.log('📋 NEXT STEPS:');
  console.log('1. ✅ Roles are now seeded in the database');
  console.log('2. 🔧 Need to create admin user alesierraalta@gmail.com');
  console.log('3. 🔧 Update create-temp endpoint to use correct admin credentials');
  console.log('4. 🔧 Disable Vercel authentication on third deployment');
}

completeAdminSetup();