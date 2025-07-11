import fetch from 'node-fetch';

const deployments = [
  'https://lumo-woad.vercel.app',
  'https://lumo-git-main-alesierraaltas-projects.vercel.app'
];

async function checkAdminUser() {
  console.log('🔍 Checking for admin user: alesierraalta@gmail.com\n');
  
  for (const baseUrl of deployments) {
    console.log(`📍 Testing: ${baseUrl}`);
    console.log('------------------------------------------------------------');
    
    try {
      // Try login with your admin credentials
      const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'alesierraalta@gmail.com',
          password: 'admin123'
        })
      });

      console.log(`🔐 Login Status: ${loginResponse.status}`);
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log('✅ Admin user exists and login successful!');
        console.log('👤 User info:', {
          id: loginData.user?.id,
          email: loginData.user?.email,
          name: loginData.user?.name,
          role: loginData.user?.role?.name
        });
      } else {
        const errorData = await loginResponse.json();
        console.log('❌ Login failed:', errorData.error);
        
        // Check if we can see any users via debug endpoint
        const debugResponse = await fetch(`${baseUrl}/api/debug-roles`);
        if (debugResponse.ok) {
          const debugData = await debugResponse.json();
          console.log('📊 Database roles found:', debugData.roles?.length || 0);
        }
      }
      
    } catch (error) {
      console.error('❌ Request failed:', error.message);
    }
    
    console.log('\n');
  }
}

checkAdminUser();