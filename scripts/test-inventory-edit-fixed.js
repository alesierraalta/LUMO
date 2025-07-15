/**
 * Test script para verificar que la edición de inventario funciona correctamente
 * después de corregir el mapeo de columnas en la base de datos
 */

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' });

async function testInventoryEdit() {
  try {
    console.log('🧪 Iniciando test de edición de inventario...');
    
    const baseUrl = 'http://localhost:3000';
    
    // Paso 1: Obtener lista de items de inventario
    console.log('\n📋 Paso 1: Obteniendo items de inventario...');
    const listResponse = await fetch(`${baseUrl}/api/inventory`);
    
    if (!listResponse.ok) {
      throw new Error(`Error al obtener inventario: ${listResponse.status}`);
    }
    
    const inventoryData = await listResponse.json();
    console.log(`✅ Inventario obtenido: ${inventoryData.items?.length || 0} items`);
    
    if (!inventoryData.items || inventoryData.items.length === 0) {
      console.log('⚠️  No hay items en el inventario para probar');
      return;
    }
    
    // Seleccionar el primer item para editar
    const testItem = inventoryData.items[0];
    console.log(`🎯 Item seleccionado para test: ${testItem.name} (ID: ${testItem.id})`);
    console.log(`📊 Valores actuales:`, {
      name: testItem.name,
      currentStock: testItem.currentStock,
      unitCost: testItem.unitCost,
      unitPrice: testItem.unitPrice
    });
    
    // Paso 2: Editar el item con nuevos valores
    console.log('\n✏️  Paso 2: Editando item de inventario...');
    
    const updatedData = {
      name: testItem.name + ' (EDITADO)',
      description: testItem.description + ' - Descripción actualizada',
      currentStock: (testItem.currentStock || 0) + 5,
      unitCost: (testItem.unitCost || 0) + 1.50,
      unitPrice: (testItem.unitPrice || 0) + 2.00,
      categoryId: testItem.categoryId,
      sku: testItem.sku
    };
    
    console.log(`📝 Datos a actualizar:`, updatedData);
    
    const editResponse = await fetch(`${baseUrl}/api/inventory/${testItem.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData)
    });
    
    console.log(`📡 Respuesta del servidor: ${editResponse.status} ${editResponse.statusText}`);
    
    if (!editResponse.ok) {
      const errorText = await editResponse.text();
      console.error('❌ Error en la edición:', errorText);
      throw new Error(`Error al editar item: ${editResponse.status} - ${errorText}`);
    }
    
    const editResult = await editResponse.json();
    console.log('✅ Respuesta de edición:', JSON.stringify(editResult, null, 2));
    
    // Paso 3: Verificar que los cambios se guardaron correctamente
    console.log('\n🔍 Paso 3: Verificando cambios...');
    
    const verifyResponse = await fetch(`${baseUrl}/api/inventory/${testItem.id}`);
    if (!verifyResponse.ok) {
      throw new Error(`Error al verificar item: ${verifyResponse.status}`);
    }
    
    const verifyResult = await verifyResponse.json();
    console.log('📊 Item después de la edición:', JSON.stringify(verifyResult, null, 2));
    
    // Extraer el item de la respuesta
    const verifiedItem = verifyResult.item || verifyResult;
    
    // Verificar que los campos críticos se actualizaron
    const checks = [
      { field: 'name', expected: updatedData.name, actual: verifiedItem.name },
      { field: 'currentStock', expected: updatedData.currentStock, actual: verifiedItem.currentStock },
      { field: 'unitCost', expected: updatedData.unitCost, actual: verifiedItem.unitCost },
      { field: 'unitPrice', expected: updatedData.unitPrice, actual: verifiedItem.unitPrice }
    ];
    
    console.log('\n✅ Verificación de campos:');
    let allPassed = true;
    
    checks.forEach(check => {
      const passed = check.actual === check.expected;
      const status = passed ? '✅' : '❌';
      console.log(`  ${status} ${check.field}: esperado=${check.expected}, actual=${check.actual}`);
      if (!passed) allPassed = false;
    });
    
    if (allPassed) {
      console.log('\n🎉 ¡TEST EXITOSO! La edición de inventario funciona correctamente');
      console.log('✅ Todos los campos se actualizaron correctamente en la base de datos');
    } else {
      console.log('\n❌ TEST FALLIDO: Algunos campos no se actualizaron correctamente');
    }
    
    // Paso 4: Restaurar valores originales (cleanup)
    console.log('\n🔄 Paso 4: Restaurando valores originales...');
    
    const restoreData = {
      name: testItem.name,
      description: testItem.description,
      currentStock: testItem.currentStock,
      unitCost: testItem.unitCost,
      unitPrice: testItem.unitPrice,
      categoryId: testItem.categoryId,
      sku: testItem.sku
    };
    
    const restoreResponse = await fetch(`${baseUrl}/api/inventory/${testItem.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(restoreData)
    });
    
    if (restoreResponse.ok) {
      console.log('✅ Valores originales restaurados correctamente');
    } else {
      console.log('⚠️  No se pudieron restaurar los valores originales');
    }
    
  } catch (error) {
    console.error('❌ Error en el test:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Ejecutar el test
testInventoryEdit();