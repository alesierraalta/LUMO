require('dotenv').config({ path: '.env.local' });

const API_BASE = 'http://localhost:3000/api';

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error('❌ Error en request:', error);
    throw error;
  }
}

async function testInventoryCategoryLocationChange() {
  console.log('🧪 Iniciando test de cambio de categoría y ubicación...\n');

  try {
    // Paso 1: Obtener inventario
    console.log('📋 Paso 1: Obteniendo items de inventario...');
    const inventoryResponse = await makeRequest(`${API_BASE}/inventory`);
    
    if (inventoryResponse.status !== 200 || !inventoryResponse.data.items) {
      throw new Error('No se pudo obtener el inventario');
    }

    const items = inventoryResponse.data.items;
    console.log(`✅ Inventario obtenido: ${items.length} items`);
    
    // Seleccionar un item para el test
    const testItem = items[0];
    console.log(`🎯 Item seleccionado para test: ${testItem.name} (ID: ${testItem.id})`);
    console.log(`📊 Categoría actual: ${testItem.categoryId || 'Sin categoría'}`);
    console.log(`📍 Ubicación actual: ${testItem.locationId || 'Sin ubicación'}\n`);

    // Paso 2: Obtener categorías disponibles
    console.log('📂 Paso 2: Obteniendo categorías disponibles...');
    const categoriesResponse = await makeRequest(`${API_BASE}/categories`);
    
    if (categoriesResponse.status !== 200 || !categoriesResponse.data.categories) {
      throw new Error('No se pudieron obtener las categorías');
    }

    const categories = categoriesResponse.data.categories;
    console.log(`✅ Categorías obtenidas: ${categories.length} categorías`);
    
    // Seleccionar una categoría diferente a la actual
    const newCategory = categories.find(cat => cat.id !== testItem.categoryId);
    if (!newCategory) {
      throw new Error('No se encontró una categoría diferente para el test');
    }
    console.log(`🎯 Nueva categoría seleccionada: ${newCategory.name} (ID: ${newCategory.id})`);

    // Paso 3: Obtener ubicaciones disponibles
    console.log('\n📍 Paso 3: Obteniendo ubicaciones disponibles...');
    const locationsResponse = await makeRequest(`${API_BASE}/locations`);
    
    if (locationsResponse.status !== 200 || !locationsResponse.data.locations) {
      throw new Error('No se pudieron obtener las ubicaciones');
    }

    const locations = locationsResponse.data.locations;
    console.log(`✅ Ubicaciones obtenidas: ${locations.length} ubicaciones`);
    
    // Seleccionar una ubicación diferente a la actual
    const newLocation = locations.find(loc => loc.id !== testItem.locationId);
    if (!newLocation) {
      throw new Error('No se encontró una ubicación diferente para el test');
    }
    console.log(`🎯 Nueva ubicación seleccionada: ${newLocation.name} (ID: ${newLocation.id})`);

    // Paso 4: Actualizar item con nueva categoría y ubicación
    console.log('\n✏️  Paso 4: Actualizando categoría y ubicación del item...');
    
    const updateData = {
      categoryId: newCategory.id,
      locationId: newLocation.id
    };
    
    console.log('📝 Datos a actualizar:', JSON.stringify(updateData, null, 2));
    
    const updateResponse = await makeRequest(`${API_BASE}/inventory/${testItem.id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    
    console.log(`📡 Respuesta del servidor: ${updateResponse.status} ${updateResponse.status === 200 ? 'OK' : 'ERROR'}`);
    
    if (updateResponse.status !== 200) {
      console.error('❌ Error en actualización:', updateResponse.data);
      throw new Error('Falló la actualización del item');
    }
    
    console.log('✅ Respuesta de actualización:', JSON.stringify(updateResponse.data, null, 2));

    // Paso 5: Verificar cambios
    console.log('\n🔍 Paso 5: Verificando cambios...');
    
    const verifyResponse = await makeRequest(`${API_BASE}/inventory/${testItem.id}`);
    
    if (verifyResponse.status !== 200) {
      throw new Error('No se pudo verificar el item actualizado');
    }
    
    const updatedItem = verifyResponse.data.item || verifyResponse.data;
    console.log('📊 Item después de la actualización:', JSON.stringify(updatedItem, null, 2));

    // Verificar que los cambios se aplicaron correctamente
    console.log('\n✅ Verificación de campos:');
    
    const categoryMatch = updatedItem.categoryId === newCategory.id;
    const locationMatch = updatedItem.locationId === newLocation.id;
    
    console.log(`  ${categoryMatch ? '✅' : '❌'} categoryId: esperado=${newCategory.id}, actual=${updatedItem.categoryId}`);
    console.log(`  ${locationMatch ? '✅' : '❌'} locationId: esperado=${newLocation.id}, actual=${updatedItem.locationId}`);

    if (categoryMatch && locationMatch) {
      console.log('\n🎉 ¡TEST EXITOSO! El cambio de categoría y ubicación funciona correctamente');
      console.log('✅ Todos los campos se actualizaron correctamente en la base de datos');
    } else {
      throw new Error('Los cambios no se aplicaron correctamente');
    }

    // Paso 6: Restaurar valores originales
    console.log('\n🔄 Paso 6: Restaurando valores originales...');
    
    const restoreData = {
      categoryId: testItem.categoryId,
      locationId: testItem.locationId
    };
    
    const restoreResponse = await makeRequest(`${API_BASE}/inventory/${testItem.id}`, {
      method: 'PUT',
      body: JSON.stringify(restoreData)
    });
    
    if (restoreResponse.status === 200) {
      console.log('✅ Valores originales restaurados correctamente');
    } else {
      console.warn('⚠️  Advertencia: No se pudieron restaurar los valores originales completamente');
    }

  } catch (error) {
    console.error('\n❌ ERROR EN EL TEST:', error.message);
    process.exit(1);
  }
}

// Ejecutar el test
testInventoryCategoryLocationChange();