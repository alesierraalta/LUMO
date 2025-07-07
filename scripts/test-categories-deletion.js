const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function getAuthToken() {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'alesierraalta@gmail.com',
        password: 'admin123'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.token;
    }
  } catch (error) {
    console.log('Login error:', error.message);
  }
  return null;
}

async function testCategoryDeletion() {
  console.log('🔍 Testing Category Deletion\n');

  const token = await getAuthToken();
  if (!token) {
    console.log('❌ Could not get auth token');
    return;
  }

  // First, create a test category
  try {
    console.log('1. Creating test category...');
    const createResponse = await fetch(`${BASE_URL}/api/categories`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Category for Deletion',
        description: 'This category will be deleted'
      })
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.log('❌ Failed to create test category:', errorText);
      return;
    }
    
    const createData = await createResponse.json();
    console.log('✅ Test category created:', createData);
    
    if (!createData.success || !createData.category || !createData.category.id) {
      console.log('❌ Invalid category creation response');
      return;
    }
    
    const categoryId = createData.category.id;
    console.log('Category ID:', categoryId);
    
    // Now try to delete it
    console.log('\n2. Testing category deletion...');
    const deleteResponse = await fetch(`${BASE_URL}/api/categories/${categoryId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Delete Status:', deleteResponse.status);
    
    if (deleteResponse.ok) {
      const deleteData = await deleteResponse.json();
      console.log('✅ Category deleted successfully:', deleteData);
    } else {
      const errorText = await deleteResponse.text();
      console.log('❌ Category deletion failed:', errorText);
      
      // Try to get more details
      try {
        const errorJson = JSON.parse(errorText);
        console.log('Error details:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.log('Raw error text:', errorText);
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
  }
}

testCategoryDeletion(); 