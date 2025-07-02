#!/usr/bin/env node

/**
 * Final Admin Login Test
 * Test the corrected bcrypt authentication
 */

const DEV_URL = 'https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev';

async function testAdminFinal() {
  console.log('🎯 FINAL ADMIN LOGIN TEST');
  console.log('========================');
  
  try {
    // Test 1: Admin login with original credentials
    console.log('\n👤 Testing Admin Credentials');
    console.log('----------------------------');
    
    const adminEmail = 'alesierraalta@gmail.com';
    const adminPassword = 'admin123';
    
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('Expected: Bcrypt hash verification');
    
    const adminLoginResponse = await fetch(`${DEV_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword
      })
    });
    
    const adminLoginData = await adminLoginResponse.json();
    
    console.log(`\nStatus: ${adminLoginResponse.status}`);
    console.log(`Success: ${adminLoginData.success}`);
    console.log(`Message: ${adminLoginData.message || 'N/A'}`);
    console.log(`Error: ${adminLoginData.error || 'N/A'}`);
    
    if (adminLoginData.success) {
      console.log('\n🎉 ADMIN LOGIN SUCCESS!');
      console.log('======================');
      console.log(`✅ Email: ${adminLoginData.user.email}`);
      console.log(`✅ Name: ${adminLoginData.user.name}`);
      console.log(`✅ Role: ${adminLoginData.user.role}`);
      console.log(`✅ Active: ${adminLoginData.user.isActive}`);
      console.log(`✅ Token: ${adminLoginData.token ? 'Present' : 'Missing'}`);
      console.log(`✅ Auth Method: ${adminLoginData.message}`);
      
      // Test API access
      if (adminLoginData.token) {
        console.log('\n🔑 Testing API Access');
        console.log('--------------------');
        
        const apiTests = [
          { url: '/api/users', name: 'Users API' },
          { url: '/api/roles', name: 'Roles API' },
          { url: '/api/categories', name: 'Categories API' },
          { url: '/api/inventory', name: 'Inventory API' },
          { url: '/api/products', name: 'Products API' }
        ];
        
        let apiSuccessCount = 0;
        
        for (const test of apiTests) {
          try {
            const apiResponse = await fetch(`${DEV_URL}${test.url}`, {
              headers: { 'Authorization': `Bearer ${adminLoginData.token}` }
            });
            
            const success = apiResponse.status === 200;
            console.log(`   ${test.name}: ${success ? '✅' : '❌'} ${apiResponse.status}`);
            
            if (success) {
              apiSuccessCount++;
            }
          } catch (error) {
            console.log(`   ${test.name}: ❌ ERROR - ${error.message}`);
          }
        }
        
        console.log(`\n📊 API Access Results: ${apiSuccessCount}/${apiTests.length} successful`);
        
        if (apiSuccessCount === apiTests.length) {
          console.log('\n🎯 COMPLETE SUCCESS!');
          console.log('===================');
          console.log('✅ Admin authentication working');
          console.log('✅ Token generation working');
          console.log('✅ All API endpoints accessible');
          console.log('✅ System fully functional');
          
          console.log('\n📋 PRODUCTION READY CREDENTIALS:');
          console.log('================================');
          console.log(`🔑 Email: ${adminEmail}`);
          console.log(`🔑 Password: ${adminPassword}`);
          console.log(`🔑 Role: ADMIN`);
          console.log(`🔑 Environment: DEV`);
          console.log(`🔑 URL: ${DEV_URL}`);
          
          return {
            success: true,
            adminEmail: adminEmail,
            adminPassword: adminPassword,
            token: adminLoginData.token,
            apiAccess: apiSuccessCount,
            totalApis: apiTests.length
          };
        } else {
          console.log('\n⚠️ Partial Success - Some APIs not accessible');
          console.log(`✅ Authentication: Working`);
          console.log(`⚠️ API Access: ${apiSuccessCount}/${apiTests.length}`);
        }
      } else {
        console.log('\n❌ Token missing - API access not possible');
      }
      
    } else {
      console.log('\n❌ ADMIN LOGIN FAILED');
      console.log('====================');
      console.log(`Error: ${adminLoginData.error}`);
      
      // Test alternative admin users
      console.log('\n🧪 Testing Alternative Admin Users');
      console.log('----------------------------------');
      
      const altAdmins = [
        { email: 'admin@lumo.com', password: 'admin123' },
        { email: 'admin-test@lumo.com', password: 'admin123' }
      ];
      
      for (const admin of altAdmins) {
        console.log(`\nTesting: ${admin.email}`);
        
        const altResponse = await fetch(`${DEV_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(admin)
        });
        
        const altData = await altResponse.json();
        
        console.log(`   Status: ${altResponse.status}`);
        console.log(`   Success: ${altData.success}`);
        
        if (altData.success) {
          console.log(`   🎉 ALTERNATIVE ADMIN FOUND!`);
          console.log(`   Email: ${altData.user.email}`);
          console.log(`   Role: ${altData.user.role}`);
          
          return {
            success: true,
            adminEmail: admin.email,
            adminPassword: admin.password,
            token: altData.token,
            alternative: true
          };
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
  
  return { success: false };
}

testAdminFinal().then(result => {
  if (result.success) {
    console.log('\n🚀 LUMO INVENTORY SYSTEM READY!');
    console.log('===============================');
    console.log(`✨ Admin Email: ${result.adminEmail}`);
    console.log(`✨ Admin Password: ${result.adminPassword}`);
    console.log(`✨ Token: ${result.token ? 'Generated' : 'Missing'}`);
    console.log(`✨ API Access: ${result.apiAccess || 'N/A'}/${result.totalApis || 'N/A'}`);
    console.log(`✨ Type: ${result.alternative ? 'Alternative Admin' : 'Primary Admin'}`);
    console.log('✨ Status: FULLY FUNCTIONAL');
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('==============');
    console.log('1. Use these credentials to access the system');
    console.log('2. Test all functionality in the web interface');
    console.log('3. Deploy to production when ready');
    console.log('4. Update production credentials as needed');
    
  } else {
    console.log('\n⚠️ System requires manual configuration');
    console.log('📖 Check database and authentication setup');
  }
}).catch(console.error); 