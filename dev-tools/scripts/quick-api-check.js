/**
 * VERIFICACIÓN RÁPIDA DE API - DATOS ACTUALES
 * ===========================================
 */

const BASE_URL = 'http://localhost:3000';

async function checkAPI() {
  try {
    console.log('🔍 Verificando datos actuales en la API...\n');
    
    // Verificar locations
    console.log('📍 LOCATIONS:');
    const locationsResponse = await fetch(`${BASE_URL}/api/locations`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Development-Mode': 'true'
      }
    });
    
    if (locationsResponse.ok) {
      const locationsData = await locationsResponse.json();
      console.log(`Total locations: ${locationsData.data?.length || 0}`);
      
      if (locationsData.data && locationsData.data.length > 0) {
        locationsData.data.forEach((location, index) => {
          console.log(`  ${index + 1}. ID: ${location.id}`);
          console.log(`     Name: "${location.name}"`);
          console.log(`     Description: "${location.description}"`);
          console.log('');
        });
      }
    } else {
      console.log('❌ Error al obtener locations');
    }
    
    // Verificar categories
    console.log('\n📂 CATEGORIES:');
    const categoriesResponse = await fetch(`${BASE_URL}/api/categories`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Development-Mode': 'true'
      }
    });
    
    if (categoriesResponse.ok) {
      const categoriesData = await categoriesResponse.json();
      console.log(`Total categories: ${categoriesData.data?.length || 0}`);
      
      if (categoriesData.data && categoriesData.data.length > 0) {
        categoriesData.data.forEach((category, index) => {
          console.log(`  ${index + 1}. ID: ${category.id}`);
          console.log(`     Name: "${category.name}"`);
          console.log(`     Description: "${category.description}"`);
          console.log('');
        });
      }
    } else {
      console.log('❌ Error al obtener categories');
    }
    
    // Verificar inventory
    console.log('\n📦 INVENTORY:');
    const inventoryResponse = await fetch(`${BASE_URL}/api/inventory`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Development-Mode': 'true'
      }
    });
    
    if (inventoryResponse.ok) {
      const inventoryData = await inventoryResponse.json();
      console.log(`Total inventory items: ${inventoryData.data?.length || 0}`);
      
      if (inventoryData.data && inventoryData.data.length > 0) {
        inventoryData.data.forEach((item, index) => {
          console.log(`  ${index + 1}. ID: ${item.id}`);
          console.log(`     Name: "${item.name}"`);
          console.log(`     Description: "${item.description}"`);
          console.log(`     SKU: "${item.sku}"`);
          console.log('');
        });
      }
    } else {
      console.log('❌ Error al obtener inventory');
    }
    
    // Verificar users
    console.log('\n👤 USERS:');
    const usersResponse = await fetch(`${BASE_URL}/api/users`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Development-Mode': 'true'
      }
    });
    
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log(`Total users: ${usersData.data?.length || 0}`);
      
      if (usersData.data && usersData.data.length > 0) {
        usersData.data.forEach((user, index) => {
          console.log(`  ${index + 1}. ID: ${user.id}`);
          console.log(`     Name: "${user.name}"`);
          console.log(`     Email: "${user.email}"`);
          console.log('');
        });
      }
    } else {
      console.log('❌ Error al obtener users');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAPI();