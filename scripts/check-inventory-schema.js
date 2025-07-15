/**
 * Script para verificar el esquema de la tabla inventory_items en Supabase
 * y identificar las columnas correctas para unit_cost y unit_price
 */

const fetch = require('node-fetch');

async function checkInventorySchema() {
  const baseUrl = 'http://localhost:3001';
  
  try {
    console.log('🔍 Verificando esquema de la tabla inventory_items...');
    
    // Obtener un item de inventario para ver la estructura real
    console.log('📋 Obteniendo items de inventario para analizar estructura...');
    const inventoryResponse = await fetch(`${baseUrl}/api/inventory`);
    
    if (!inventoryResponse.ok) {
      throw new Error(`Error al obtener inventario: ${inventoryResponse.status}`);
    }
    
    const inventoryData = await inventoryResponse.json();
    
    if (!inventoryData.items || inventoryData.items.length === 0) {
      console.log('⚠️ No se encontraron items de inventario');
      return;
    }
    
    const firstItem = inventoryData.items[0];
    console.log('📊 Estructura del primer item de inventario:');
    console.log(JSON.stringify(firstItem, null, 2));
    
    console.log('\n🔍 Análisis de campos relacionados con precios y costos:');
    
    // Verificar campos de precio y costo
    const priceFields = [];
    const costFields = [];
    
    Object.keys(firstItem).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('price')) {
        priceFields.push(key);
      }
      if (lowerKey.includes('cost')) {
        costFields.push(key);
      }
    });
    
    console.log('💰 Campos de precio encontrados:', priceFields);
    console.log('💵 Campos de costo encontrados:', costFields);
    
    // Verificar valores actuales
    console.log('\n📈 Valores actuales en el primer item:');
    priceFields.forEach(field => {
      console.log(`  ${field}: ${firstItem[field]}`);
    });
    costFields.forEach(field => {
      console.log(`  ${field}: ${firstItem[field]}`);
    });
    
    // Verificar otros campos importantes
    console.log('\n📦 Otros campos importantes:');
    const importantFields = ['currentStock', 'minStockLevel', 'unitCost', 'unitPrice'];
    importantFields.forEach(field => {
      if (firstItem.hasOwnProperty(field)) {
        console.log(`  ✅ ${field}: ${firstItem[field]}`);
      } else {
        console.log(`  ❌ ${field}: NO ENCONTRADO`);
      }
    });
    
    // Intentar una actualización de prueba para ver el error exacto
    console.log('\n🧪 Probando actualización para ver error exacto...');
    
    const testData = {
      name: firstItem.name,
      description: firstItem.description,
      sku: firstItem.sku,
      currentStock: firstItem.currentStock || 0,
      minStockLevel: firstItem.minStockLevel || 0,
      unitCost: 10.50,
      unitPrice: 25.75,
      categoryId: firstItem.categoryId,
      locationId: firstItem.locationId,
      isActive: true
    };
    
    console.log('📝 Datos de prueba para actualización:', testData);
    
    const updateResponse = await fetch(`${baseUrl}/api/inventory/${firstItem.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const updateResult = await updateResponse.json();
    console.log(`📡 Respuesta de actualización (${updateResponse.status}):`, updateResult);
    
    if (!updateResponse.ok) {
      console.log('❌ Error en actualización - esto nos ayuda a identificar el problema');
    } else {
      console.log('✅ Actualización exitosa - el problema podría estar resuelto');
    }
    
  } catch (error) {
    console.error('❌ Error en verificación de esquema:', error);
  }
}

// Ejecutar la verificación
checkInventorySchema();