const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function debugCategoryCreation() {
  console.log('🔍 Debugging Category Creation Issue...\n');

  try {
    // Step 1: Login to get token
    console.log('📝 Step 1: Login to get authentication token');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alesierraalta@gmail.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');
    console.log(`   User ID: ${loginData.user.id}`);
    console.log(`   User Role: ${loginData.user.role?.name || loginData.user.role}`);

    // Step 2: Try to create a category
    console.log('\n📝 Step 2: Attempt to create a test category');
    const categoryData = {
      name: 'Debug Test Category ' + Date.now(),
      description: 'Test category for debugging'
    };

    console.log('   Category data:', JSON.stringify(categoryData, null, 2));

    const createResponse = await fetch(`${BASE_URL}/api/categories`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(categoryData)
    });

    console.log(`   Response status: ${createResponse.status}`);
    
    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log('✅ Category creation successful:');
      console.log('   Created category:', JSON.stringify(createData, null, 2));
      return { success: true, category: createData };
    } else {
      const errorText = await createResponse.text();
      console.log('❌ Category creation failed:');
      console.log(`   Error response: ${errorText}`);
      
      // Try to parse as JSON to get more details
      try {
        const errorData = JSON.parse(errorText);
        console.log('   Error details:', JSON.stringify(errorData, null, 2));
      } catch (parseError) {
        console.log('   Raw error text:', errorText);
      }
      
      return { success: false, error: errorText };
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    return { 
      success: false, 
      message: `Debug error: ${error.message}` 
    };
  }
}

// Run the debug
debugCategoryCreation().then(result => {
  console.log('\n' + '='.repeat(50));
  console.log('🏁 DEBUG RESULT:');
  if (result.success) {
    console.log('✅ Category creation is working correctly');
  } else {
    console.log('❌ Category creation failed');
    console.log('Error:', result.error || result.message);
  }
  console.log('='.repeat(50));
  
  process.exit(result.success ? 0 : 1);
}); 