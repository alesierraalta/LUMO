#!/usr/bin/env node

/**
 * Create Admin User in Supabase Auth
 * Use the working registration API to create admin properly
 */

const DEV_URL = 'https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev';

async function createAdminInSupabase() {
  console.log('🚀 CREATING ADMIN USER IN SUPABASE AUTH');
  console.log('=======================================');
  
  const adminEmail = 'alesierraalta@gmail.com';
  const adminPassword = 'admin123';
  
  try {
    // Step 1: Try to create admin with a slightly different email first to test
    console.log('🧪 Step 1: Test with new email to confirm system works');
    
    const testEmail = 'admin-test@lumo.com';
    const testRegisterResponse = await fetch(`${DEV_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: adminPassword,
        name: 'Admin Test'
      })
    });
    
    const testRegisterData = await testRegisterResponse.json();
    console.log(`Test Registration Status: ${testRegisterResponse.status}`);
    console.log(`Test Success: ${testRegisterData.success}`);
    
    if (testRegisterData.success) {
      console.log('✅ Supabase registration system working!');
      
      // Test login immediately
      const testLoginResponse = await fetch(`${DEV_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: adminPassword
        })
      });
      
      const testLoginData = await testLoginResponse.json();
      console.log(`Test Login Status: ${testLoginResponse.status}`);
      console.log(`Test Login Success: ${testLoginData.success}`);
      
      if (testLoginData.success) {
        console.log('✅ Supabase login system working!');
        console.log(`   Token: ${testLoginData.token ? 'Present' : 'Missing'}`);
        
        // Now create the real admin
        console.log('\n👤 Step 2: Creating real admin user');
        
        const adminRegisterResponse = await fetch(`${DEV_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: adminEmail,
            password: adminPassword,
            name: 'Administrador LUMO'
          })
        });
        
        const adminRegisterData = await adminRegisterResponse.json();
        console.log(`Admin Registration Status: ${adminRegisterResponse.status}`);
        console.log(`Admin Success: ${adminRegisterData.success}`);
        
        if (adminRegisterData.success) {
          console.log('✅ Admin user created in Supabase!');
          console.log(`   ID: ${adminRegisterData.user.id}`);
          console.log(`   Email: ${adminRegisterData.user.email}`);
          console.log(`   Role: ${adminRegisterData.user.role}`);
          
          // Wait for Supabase to process
          console.log('\n⏳ Waiting for Supabase to process...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Test admin login
          console.log('\n🔐 Step 3: Testing admin login');
          
          const adminLoginResponse = await fetch(`${DEV_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: adminEmail,
              password: adminPassword
            })
          });
          
          const adminLoginData = await adminLoginResponse.json();
          console.log(`Admin Login Status: ${adminLoginResponse.status}`);
          console.log(`Admin Login Success: ${adminLoginData.success}`);
          
          if (adminLoginData.success) {
            console.log('🎉 ADMIN LOGIN SUCCESSFUL!');
            console.log(`   User: ${adminLoginData.user.email}`);
            console.log(`   Role: ${adminLoginData.user.role}`);
            console.log(`   Token: ${adminLoginData.token ? 'Present' : 'Missing'}`);
            
            // Test API access
            if (adminLoginData.token) {
              console.log('\n🔑 Step 4: Testing API access');
              
              const apiResponse = await fetch(`${DEV_URL}/api/users`, {
                headers: { 'Authorization': `Bearer ${adminLoginData.token}` }
              });
              
              console.log(`API Access Status: ${apiResponse.status}`);
              
              if (apiResponse.status === 200) {
                console.log('✅ API access working!');
                
                console.log('\n🎯 COMPLETE SUCCESS!');
                console.log('====================');
                console.log('✅ Admin user created in Supabase Auth');
                console.log('✅ Admin can login successfully');
                console.log('✅ API access working');
                console.log('✅ System fully operational');
                
                return true;
              } else {
                console.log(`❌ API access failed: ${apiResponse.status}`);
              }
            }
          } else {
            console.log(`❌ Admin login failed: ${adminLoginData.error}`);
          }
          
        } else {
          console.log(`❌ Admin registration failed: ${adminRegisterData.error}`);
          
          // If user already exists in Supabase, try login
          if (adminRegisterData.error?.includes('already') || adminRegisterData.error?.includes('exists')) {
            console.log('\n🔐 Admin might exist in Supabase, trying login...');
            
            const existingLoginResponse = await fetch(`${DEV_URL}/api/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: adminEmail,
                password: adminPassword
              })
            });
            
            const existingLoginData = await existingLoginResponse.json();
            
            if (existingLoginData.success) {
              console.log('✅ Admin already exists in Supabase and can login!');
              return true;
            } else {
              console.log(`❌ Existing admin login failed: ${existingLoginData.error}`);
            }
          }
        }
        
      } else {
        console.log(`❌ Test login failed: ${testLoginData.error}`);
      }
      
    } else {
      console.log(`❌ Test registration failed: ${testRegisterData.error}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  return false;
}

createAdminInSupabase().then(success => {
  if (success) {
    console.log('\n🚀 READY FOR PRODUCTION!');
    console.log('✨ Run complete user flow tests now');
  } else {
    console.log('\n⚠️ Admin setup incomplete - check logs above');
  }
}).catch(console.error); 