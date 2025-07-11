import fetch from 'node-fetch';

const deployments = [
  'https://lumo-woad.vercel.app',
  'https://lumo-git-main-alesierraaltas-projects.vercel.app',
  'https://lumo-f40cvfaj6-alesierraaltas-projects.vercel.app'
];

async function finalComprehensiveTest() {
  console.log('🚀 Final Comprehensive API Test: Complete Setup & Validation\n');
  
  const results = [];
  
  for (const baseUrl of deployments) {
    console.log(`📍 Testing: ${baseUrl}`);
    console.log('='.repeat(60));
    
    const deploymentResult = {
      deployment: baseUrl,
      steps: {},
      success: false,
      issues: [],
      recommendations: []
    };
    
    try {
      // Step 1: Environment Diagnostics
      console.log('🔍 Step 1: Environment Diagnostics...');
      const envResponse = await fetch(`${baseUrl}/api/debug-env`);
      
      if (envResponse.ok) {
        const envData = await envResponse.json();
        deploymentResult.steps.environment = {
          success: true,
          data: envData.diagnostics
        };
        
        console.log('✅ Environment check passed');
        console.log('📊 Service Client:', envData.diagnostics.serviceClient.available ? '✅ Available' : '❌ Failed');
        console.log('📊 Database:', envData.diagnostics.serviceClient.dbConnection.success ? '✅ Connected' : '❌ Failed');
        console.log('📊 RLS Bypass:', envData.diagnostics.serviceClient.rlsBypass.success ? '✅ Working' : '❌ Failed');
        
        if (!envData.diagnostics.serviceClient.rlsBypass.success) {
          deploymentResult.issues.push('RLS bypass failed - service role key issue');
          deploymentResult.recommendations.push('Check SUPABASE_SERVICE_ROLE_KEY environment variable');
        }
      } else {
        deploymentResult.steps.environment = {
          success: false,
          error: `Status ${envResponse.status}`
        };
        deploymentResult.issues.push('Environment diagnostics endpoint failed');
        console.log('❌ Environment diagnostics failed');
      }
      
      // Step 2: Check and Create Roles
      console.log('\n🔍 Step 2: Roles Setup...');
      const rolesResponse = await fetch(`${baseUrl}/api/debug-roles`);
      
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        console.log(`📊 Found ${rolesData.debug?.totalRoles || 0} roles`);
        
        if (rolesData.debug?.missingBasicRoles?.length > 0) {
          console.log('🔧 Creating missing roles...');
          const createRolesResponse = await fetch(`${baseUrl}/api/debug-roles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (createRolesResponse.ok) {
            const createRolesData = await createRolesResponse.json();
            const successCount = createRolesData.results?.filter(r => r.success).length || 0;
            const totalCount = createRolesData.results?.length || 0;
            
            deploymentResult.steps.roles = {
              success: successCount === totalCount,
              created: successCount,
              total: totalCount,
              results: createRolesData.results
            };
            
            console.log(`✅ Created ${successCount}/${totalCount} roles`);
            
            if (successCount < totalCount) {
              deploymentResult.issues.push('Some roles failed to create');
            }
          } else {
            deploymentResult.steps.roles = {
              success: false,
              error: 'Failed to create roles'
            };
            deploymentResult.issues.push('Role creation failed');
          }
        } else {
          deploymentResult.steps.roles = {
            success: true,
            message: 'All roles already exist'
          };
          console.log('✅ All roles already exist');
        }
      } else {
        deploymentResult.steps.roles = {
          success: false,
          error: `Status ${rolesResponse.status}`
        };
        deploymentResult.issues.push('Cannot access roles endpoint');
      }
      
      // Step 3: Create Admin User
      console.log('\n🔍 Step 3: Admin User Creation...');
      const createUserResponse = await fetch(`${baseUrl}/api/users/create-temp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log(`📤 User creation status: ${createUserResponse.status}`);
      
      if (createUserResponse.ok) {
        const createUserData = await createUserResponse.json();
        deploymentResult.steps.userCreation = {
          success: true,
          user: createUserData.user
        };
        console.log('✅ Admin user created:', createUserData.user?.email);
      } else {
        const createUserError = await createUserResponse.json();
        deploymentResult.steps.userCreation = {
          success: false,
          error: createUserError.error || 'Unknown error'
        };
        console.log('❌ Admin user creation failed:', createUserError.error || 'Unknown error');
        
        if (createUserError.error?.includes('already exists')) {
          console.log('💡 Admin user already exists, proceeding with login test');
        } else {
          deploymentResult.issues.push('Admin user creation failed');
        }
      }
      
      // Step 4: Admin Login Test
      console.log('\n🔍 Step 4: Admin Login Test...');
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
        deploymentResult.steps.login = {
          success: true,
          user: loginData.user,
          token: !!loginData.token
        };
        console.log('✅ Admin login successful!');
        console.log('👤 Admin user:', {
          email: loginData.user?.email,
          name: loginData.user?.name,
          role: loginData.user?.role?.name
        });
        
        // Step 5: Authenticated Endpoint Test
        console.log('\n🔍 Step 5: Authenticated Endpoint Test...');
        const authResponse = await fetch(`${baseUrl}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (authResponse.ok) {
          const authData = await authResponse.json();
          deploymentResult.steps.authenticatedEndpoint = {
            success: true,
            user: authData.user
          };
          console.log('✅ Authenticated endpoint works');
          deploymentResult.success = true;
        } else {
          deploymentResult.steps.authenticatedEndpoint = {
            success: false,
            error: `Status ${authResponse.status}`
          };
          deploymentResult.issues.push('Authenticated endpoint failed');
        }
        
      } else {
        const loginError = await loginResponse.json();
        deploymentResult.steps.login = {
          success: false,
          error: loginError.error
        };
        console.log('❌ Admin login failed:', loginError.error);
        deploymentResult.issues.push('Admin login failed');
      }
      
    } catch (error) {
      deploymentResult.steps.error = {
        success: false,
        error: error.message
      };
      deploymentResult.issues.push(`Network error: ${error.message}`);
      console.error('❌ Test failed:', error.message);
    }
    
    results.push(deploymentResult);
    console.log('\n');
  }
  
  // Summary Report
  console.log('📊 FINAL COMPREHENSIVE TEST RESULTS');
  console.log('='.repeat(60));
  
  const successfulDeployments = results.filter(r => r.success);
  const failedDeployments = results.filter(r => !r.success);
  
  console.log(`✅ Successful deployments: ${successfulDeployments.length}/${results.length}`);
  console.log(`❌ Failed deployments: ${failedDeployments.length}/${results.length}`);
  
  if (successfulDeployments.length > 0) {
    console.log('\n✅ WORKING DEPLOYMENTS:');
    successfulDeployments.forEach(result => {
      console.log(`  - ${result.deployment}: Full API functionality working`);
    });
  }
  
  if (failedDeployments.length > 0) {
    console.log('\n❌ FAILED DEPLOYMENTS:');
    failedDeployments.forEach(result => {
      console.log(`  - ${result.deployment}:`);
      result.issues.forEach(issue => {
        console.log(`    • ${issue}`);
      });
      if (result.recommendations.length > 0) {
        console.log('    Recommendations:');
        result.recommendations.forEach(rec => {
          console.log(`      - ${rec}`);
        });
      }
    });
  }
  
  // Save detailed results
  const reportFilename = `final-test-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const fs = await import('fs');
  fs.writeFileSync(reportFilename, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed report saved: ${reportFilename}`);
  
  return {
    success: successfulDeployments.length === results.length,
    workingDeployments: successfulDeployments.length,
    totalDeployments: results.length,
    results
  };
}

finalComprehensiveTest().then(result => {
  if (result.success) {
    console.log('\n🎉 ALL DEPLOYMENTS WORKING! API endpoints fully functional.');
  } else {
    console.log(`\n⚠️  ${result.workingDeployments}/${result.totalDeployments} deployments working. Check issues above.`);
  }
});