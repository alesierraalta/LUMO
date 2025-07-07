const axios = require('axios');

async function testCategoryCreate() {
  console.log('🧪 Testing Category Creation\n');

  try {
    // Step 1: Login to get token
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'alesierraalta@gmail.com',
      password: 'admin123'
    });

    if (loginResponse.status !== 200) {
      console.log('❌ Login failed:', loginResponse.status);
      return;
    }

    console.log('✅ Login successful');
    console.log('   User ID:', loginResponse.data.user.id);
    console.log('   User Name:', loginResponse.data.user.name);
    console.log('   Token present:', !!loginResponse.data.token);

    const token = loginResponse.data.token;

    // Step 2: Create a test category
    console.log('\\n2. Creating test category...');
    const categoryData = {
      name: `Test Category ${Date.now()}`,
      description: 'A test category created by automation'
    };

    const createResponse = await axios.post(
      'http://localhost:3000/api/categories',
      categoryData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('   Status:', createResponse.status);
    console.log('   Response:', JSON.stringify(createResponse.data, null, 2));

    if (createResponse.status === 201 && createResponse.data.category) {
      console.log('✅ Category created successfully!');
      console.log('   Category ID:', createResponse.data.category.id);
      console.log('   Category Name:', createResponse.data.category.name);
      
      // Step 3: Verify category exists by listing categories
      console.log('\\n3. Verifying category exists...');
      const listResponse = await axios.get('http://localhost:3000/api/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const categories = listResponse.data.categories || [];
      const createdCategory = categories.find(cat => cat.id === createResponse.data.category.id);
      
      if (createdCategory) {
        console.log('✅ Category verified in list');
        console.log('   Found category:', createdCategory.name);
      } else {
        console.log('❌ Category not found in list');
      }

    } else {
      console.log('❌ Category creation failed');
      if (createResponse.data.category === null) {
        console.log('   Issue: Response contains "category": null');
      }
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testCategoryCreate(); 