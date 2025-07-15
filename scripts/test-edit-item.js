/**
 * Test para verificar que la edición de items funciona correctamente
 * Prueba la actualización de todos los campos incluyendo stock, precios y datos básicos
 */

const fetch = require('node-fetch');

async function testEditItem() {
  const baseUrl = 'http://localhost:3001'; // El servidor está corriendo en puerto 3001
  
  try {
    console.log('🚀 Iniciando test de edición de items...');
    
    // Esperar a que el servidor esté listo
    console.log('⏳ Esperando que el servidor esté listo...');
    let serverReady = false;
    let attempts = 0;
    
    while (!serverReady && attempts < 15) {
      try {
        const response = await fetch(`${baseUrl}/api/inventory`);
        if (response.ok) {
          serverReady = true;
        }
      } catch (error) {
        // Servidor no está listo aún
      }
      
      if (!serverReady) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
        console.log(`⏳ Intento ${attempts}/15...`);
      }
    }
    
    if (!serverReady) {
      throw new Error('El servidor no inició en el tiempo esperado');
    }
    
    console.log('✅ Servidor listo!');
    
    // Obtener lista de items de inventario para probar
    console.log('📋 Obteniendo items de inventario...');
    const inventoryResponse = await fetch(`${baseUrl}/api/inventory`);
    
    if (!inventoryResponse.ok) {
      throw new Error(`Error al obtener inventario: ${inventoryResponse.status}`);
    }
    
    const inventoryData = await inventoryResponse.json();
    
    if (!inventoryData.items || inventoryData.items.length === 0) {
      throw new Error('No se encontraron items de inventario para probar');
    }
    
    const testItem = inventoryData.items[0];
    console.log(`📦 Probando con item: ${testItem.name} (ID: ${testItem.id})`);
    console.log(`📊 Datos iniciales:`, {
      stock: testItem.currentStock,
      unitCost: testItem.unitCost,
      unitPrice: testItem.unitPrice,
      minStockLevel: testItem.minStockLevel
    });
    
    // Preparar datos de actualización
    const originalData = {
      name: testItem.name,
      description: testItem.description,
      sku: testItem.sku,
      currentStock: testItem.currentStock,
      minStockLevel: testItem.minStockLevel,
      unitCost: testItem.unitCost,
      unitPrice: testItem.unitPrice,
      categoryId: testItem.categoryId,
      locationId: testItem.locationId
    };
    
    const updatedData = {
      name: testItem.name + ' - EDITADO',
      description: (testItem.description || '') + ' - Descripción actualizada',
      sku: testItem.sku,
      currentStock: (testItem.currentStock || 0) + 15, // Aumentar stock
      minStockLevel: (testItem.minStockLevel || 0) + 5, // Aumentar nivel mínimo
      unitCost: (testItem.unitCost || 0) + 10.50, // Aumentar costo
      unitPrice: (testItem.unitPrice || 0) + 25.75, // Aumentar precio
      categoryId: testItem.categoryId,
      locationId: testItem.locationId,
      isActive: true
    };
    
    console.log('\n🔄 TEST: Editando item...');
    console.log('📝 Datos a actualizar:', updatedData);
    
    // Realizar la actualización
    const updateResponse = await fetch(`${baseUrl}/api/inventory/${testItem.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData)
    });
    
    const updateResult = await updateResponse.json();
    console.log(`📡 Respuesta de actualización (${updateResponse.status}):`, updateResult);
    
    if (updateResponse.ok && updateResult.success) {
      console.log('✅ Llamada API de actualización exitosa');
      
      const updatedItem = updateResult.item;
      console.log(`📊 Datos actualizados:`, {
        name: updatedItem.name,
        stock: updatedItem.currentStock,
        unitCost: updatedItem.unitCost,
        unitPrice: updatedItem.unitPrice,
        minStockLevel: updatedItem.minStockLevel
      });
      
      // Verificar que los cambios se aplicaron correctamente
      let allFieldsCorrect = true;
      const verifications = [];
      
      // Verificar nombre
      if (updatedItem.name === updatedData.name) {
        verifications.push('✅ Nombre actualizado correctamente');
      } else {
        verifications.push(`❌ Nombre incorrecto. Esperado: ${updatedData.name}, Obtenido: ${updatedItem.name}`);
        allFieldsCorrect = false;
      }
      
      // Verificar stock
      if (updatedItem.currentStock === updatedData.currentStock) {
        verifications.push('✅ Stock actualizado correctamente');
      } else {
        verifications.push(`❌ Stock incorrecto. Esperado: ${updatedData.currentStock}, Obtenido: ${updatedItem.currentStock}`);
        allFieldsCorrect = false;
      }
      
      // Verificar costo unitario
      if (Math.abs(updatedItem.unitCost - updatedData.unitCost) < 0.01) {
        verifications.push('✅ Costo unitario actualizado correctamente');
      } else {
        verifications.push(`❌ Costo unitario incorrecto. Esperado: ${updatedData.unitCost}, Obtenido: ${updatedItem.unitCost}`);
        allFieldsCorrect = false;
      }
      
      // Verificar precio unitario
      if (Math.abs(updatedItem.unitPrice - updatedData.unitPrice) < 0.01) {
        verifications.push('✅ Precio unitario actualizado correctamente');
      } else {
        verifications.push(`❌ Precio unitario incorrecto. Esperado: ${updatedData.unitPrice}, Obtenido: ${updatedItem.unitPrice}`);
        allFieldsCorrect = false;
      }
      
      // Verificar nivel mínimo de stock
      if (updatedItem.minStockLevel === updatedData.minStockLevel) {
        verifications.push('✅ Nivel mínimo de stock actualizado correctamente');
      } else {
        verifications.push(`❌ Nivel mínimo incorrecto. Esperado: ${updatedData.minStockLevel}, Obtenido: ${updatedItem.minStockLevel}`);
        allFieldsCorrect = false;
      }
      
      console.log('\n📋 VERIFICACIONES:');
      verifications.forEach(v => console.log(v));
      
      if (allFieldsCorrect) {
        console.log('\n✅ TODAS LAS ACTUALIZACIONES SE APLICARON CORRECTAMENTE');
      } else {
        console.log('\n❌ ALGUNAS ACTUALIZACIONES FALLARON');
      }
      
    } else {
      console.log('❌ Llamada API de actualización falló');
    }
    
    // Verificación final - obtener el item nuevamente para confirmar persistencia
    console.log('\n🔍 Verificación final - obteniendo item actualizado...');
    const finalResponse = await fetch(`${baseUrl}/api/inventory/${testItem.id}`);
    
    if (finalResponse.ok) {
      const finalResult = await finalResponse.json();
      const finalItem = finalResult.item;
      
      console.log(`📊 Datos finales desde base de datos:`, {
        name: finalItem.name,
        stock: finalItem.currentStock,
        unitCost: finalItem.unitCost,
        unitPrice: finalItem.unitPrice,
        minStockLevel: finalItem.minStockLevel
      });
      
      // Verificar persistencia
      const persistenceChecks = [
        finalItem.name === updatedData.name,
        finalItem.currentStock === updatedData.currentStock,
        Math.abs(finalItem.unitCost - updatedData.unitCost) < 0.01,
        Math.abs(finalItem.unitPrice - updatedData.unitPrice) < 0.01,
        finalItem.minStockLevel === updatedData.minStockLevel
      ];
      
      if (persistenceChecks.every(check => check)) {
        console.log('✅ PERSISTENCIA EN BASE DE DATOS CONFIRMADA');
      } else {
        console.log('❌ PROBLEMAS DE PERSISTENCIA EN BASE DE DATOS');
      }
    } else {
      console.log('❌ Error al obtener item para verificación final');
    }
    
    // Restaurar datos originales para no afectar otros tests
    console.log('\n🔄 Restaurando datos originales...');
    const restoreResponse = await fetch(`${baseUrl}/api/inventory/${testItem.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(originalData)
    });
    
    if (restoreResponse.ok) {
      console.log('✅ Datos originales restaurados');
    } else {
      console.log('⚠️ No se pudieron restaurar los datos originales');
    }
    
    console.log('\n📋 RESUMEN DEL TEST:');
    console.log(`Item probado: ${testItem.name}`);
    console.log(`Stock original: ${originalData.currentStock} → Actualizado: ${updatedData.currentStock}`);
    console.log(`Costo original: ${originalData.unitCost} → Actualizado: ${updatedData.unitCost}`);
    console.log(`Precio original: ${originalData.unitPrice} → Actualizado: ${updatedData.unitPrice}`);
    
    console.log('\n🎉 Test de edición de items completado!');
    
  } catch (error) {
    console.error('❌ Test falló:', error);
    process.exit(1);
  }
}

// Ejecutar el test
testEditItem();