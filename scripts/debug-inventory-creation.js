const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function debugInventoryCreation() {
  console.log('🔍 DEBUG: Inventory Creation Issue');
  console.log('=====================================\n');

  try {
    // First, get available categories and locations
    console.log('📋 Getting available categories and locations...');
    
    const categoriesResponse = await fetch(`${BASE_URL}/api/categories`);
    const categoriesData = await categoriesResponse.json();
    console.log('Categories response:', JSON.stringify(categoriesData, null, 2));
    
    const locationsResponse = await fetch(`${BASE_URL}/api/locations`);
    const locationsData = await locationsResponse.json();
    console.log('Locations response:', JSON.stringify(locationsData, null, 2));

    if (!categoriesData.success || !locationsData.success) {
      console.log('❌ Failed to get categories or locations');
      return;
    }

    const categoryId = categoriesData.categories[0]?.id;
    const locationId = locationsData.locations[0]?.id;

    console.log(`\n📝 Using categoryId: ${categoryId}`);
    console.log(`📝 Using locationId: ${locationId}`);

    // Test inventory creation with minimal data
    console.log('\n🧪 Testing inventory creation with minimal data...');
    
    const minimalPayload = {
      name: 'Debug Test Item',
      description: 'Test item for debugging',
      sku: 'DEBUG-001',
      currentStock: 10,
      categoryId: categoryId,
      locationId: locationId
    };

    console.log('Payload:', JSON.stringify(minimalPayload, null, 2));

    const createResponse = await fetch(`${BASE_URL}/api/inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(minimalPayload)
    });

    console.log(`\n📊 Response Status: ${createResponse.status}`);
    console.log(`📊 Response Headers:`, Object.fromEntries(createResponse.headers.entries()));

    const responseText = await createResponse.text();
    console.log(`📊 Raw Response: ${responseText}`);

    try {
      const responseData = JSON.parse(responseText);
      console.log('📊 Parsed Response:', JSON.stringify(responseData, null, 2));
    } catch (parseError) {
      console.log('❌ Failed to parse response as JSON:', parseError.message);
    }

    // Test with different payload variations
    console.log('\n🧪 Testing with different payload variations...');
    
    const variations = [
      {
        name: 'Test without optional fields',
        payload: {
          name: 'Debug Test 2',
          sku: 'DEBUG-002',
          currentStock: 5
        }
      },
      {
        name: 'Test with null categoryId/locationId',
        payload: {
          name: 'Debug Test 3',
          sku: 'DEBUG-003',
          currentStock: 5,
          categoryId: null,
          locationId: null
        }
      },
      {
        name: 'Test with string "none" values',
        payload: {
          name: 'Debug Test 4',
          sku: 'DEBUG-004',
          currentStock: 5,
          categoryId: 'none',
          locationId: 'none'
        }
      }
    ];

    for (const variation of variations) {
      console.log(`\n🔬 ${variation.name}:`);
      console.log('Payload:', JSON.stringify(variation.payload, null, 2));
      
      const testResponse = await fetch(`${BASE_URL}/api/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(variation.payload)
      });

      console.log(`Status: ${testResponse.status}`);
      const testResponseText = await testResponse.text();
      console.log(`Response: ${testResponseText}`);
    }

  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

debugInventoryCreation();