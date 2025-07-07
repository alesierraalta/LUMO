/**
 * Test Inventory Creation - Verificar que los items se crean y aparecen correctamente
 */

const http = require('http');

const testData = {
  name: "Test Item " + Date.now(),
  description: "Item de prueba",
  sku: "TEST-" + Date.now(),
  currentStock: 10,
  minStockLevel: 5,
  cost: 100,
  price: 150,
  categoryId: null,
  locationId: null
};

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function test() {
  console.log('🧪 Probando creación de inventory item...\n');

  try {
    // Test 1: Crear item
    console.log('📋 Test 1: Crear nuevo item');
    const createResult = await makeRequest('POST', '/api/inventory', testData);
    console.log(`Status: ${createResult.status}`);
    
    if (createResult.status === 201) {
      console.log('✅ CORRECTO: Item creado exitosamente');
      console.log(`  - ID: ${createResult.data.item?.id}`);
      console.log(`  - Nombre: ${createResult.data.item?.name}`);
    } else {
      console.log('❌ ERROR: Falló la creación');
      console.log('Response:', JSON.stringify(createResult.data, null, 2));
      return;
    }

    // Test 2: Verificar que aparece en la lista
    console.log('\n📋 Test 2: Verificar en lista de inventory');
    const listResult = await makeRequest('GET', '/api/inventory');
    console.log(`Status: ${listResult.status}`);
    
    if (listResult.status === 200) {
      const items = listResult.data.items || [];
      console.log(`✅ ${items.length} items encontrados`);
      
      const createdItem = items.find(item => item.name === testData.name);
      if (createdItem) {
        console.log('✅ CORRECTO: Item aparece en la lista');
        console.log(`  - Nombre: ${createdItem.name}`);
        console.log(`  - Stock: ${createdItem.currentStock}`);
      } else {
        console.log('❌ ERROR: Item no aparece en la lista');
      }
    } else {
      console.log('❌ ERROR: Falló la consulta de lista');
      console.log('Response:', JSON.stringify(listResult.data, null, 2));
    }

  } catch (error) {
    console.error('❌ Error en test:', error.message);
  }

  console.log('\n✅ Test completado');
}

test(); 