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

async function debugCategories() {
  console.log('🔍 Debugging Categories Operations\n');

  const token = await getAuthToken();
  if (!token) {
    console.log('❌ Could not get auth token');
    return;
  }

  // Test 1: List existing categories
  try {
    console.log('1. Testing GET categories...');
    const response = await fetch(`${BASE_URL}/api/categories`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Categories response:', JSON.stringify(data, null, 2));
      
      if (data.success && data.categories) {
        console.log('✅ Categories list working, found:', data.categories.length, 'categories');
        
        // If there are existing categories, try to delete one
        if (data.categories.length > 0) {
          const categoryToDelete = data.categories[0];
          console.log('\\n2. Testing DELETE category with existing category:', categoryToDelete.id);
          
          const deleteResponse = await fetch(`${BASE_URL}/api/categories/${categoryToDelete.id}`, {
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
          }
        } else {
          console.log('No existing categories to test deletion');
        }
      } else {
        console.log('⚠️ Categories list returns null or empty');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Categories list failed:', errorText);
    }
  } catch (error) {
    console.log('❌ Categories test failed:', error.message);
  }

  console.log('\\n==================================================\\n');

  // Test 2: Create a category
  try {
    console.log('3. Testing POST category...');
    const response = await fetch(`${BASE_URL}/api/categories`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Category ' + Date.now(),
        description: 'Test category for debugging'
      })
    });
    
    console.log('Create Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Create response:', JSON.stringify(data, null, 2));
      
      if (data.success && data.category && data.category.id) {
        console.log('✅ Category created successfully with ID:', data.category.id);
        
        // Now try to delete this category
        console.log('\\n4. Testing DELETE on newly created category...');
        const deleteResponse = await fetch(`${BASE_URL}/api/categories/${data.category.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Delete Status:', deleteResponse.status);
        
        if (deleteResponse.ok) {
          const deleteData = await deleteResponse.json();
          console.log('✅ Newly created category deleted successfully:', deleteData);
        } else {
          const errorText = await deleteResponse.text();
          console.log('❌ Deletion of newly created category failed:', errorText);
        }
      } else {
        console.log('⚠️ Category creation returned null or invalid data');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Category creation failed:', errorText);
    }
  } catch (error) {
    console.log('❌ Category creation test failed:', error.message);
  }
}

debugCategories(); 