/**
 * SCRIPT DE LIMPIEZA DE EMERGENCIA - DATOS DE DEBUG
 * ================================================
 * 
 * Este script elimina TODOS los datos de debug/test encontrados
 * incluyendo los que el script anterior no detectó correctamente.
 */

const BASE_URL = 'http://localhost:3000';

// Patrones EXHAUSTIVOS de datos de debug/test a eliminar
const DEBUG_PATTERNS = [
  'debug', 'Debug', 'DEBUG',
  'test', 'Test', 'TEST', 
  'temp', 'Temp', 'TEMP',
  'automated', 'Automated', 'AUTOMATED',
  'debugging', 'Debugging', 'DEBUGGING',
  'for debugging', 'For debugging', 'FOR DEBUGGING'
];

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Development-Mode': 'true',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      console.log(`⚠️ Request failed: ${response.status} ${response.statusText}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`❌ Request error:`, error.message);
    return null;
  }
}

function containsDebugPattern(text) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return DEBUG_PATTERNS.some(pattern => lowerText.includes(pattern.toLowerCase()));
}

async function inspectAndCleanLocations() {
  console.log('\n🔍 INSPECCIONANDO LOCATIONS...');
  
  const response = await makeRequest(`${BASE_URL}/api/locations`);
  if (!response || !response.success) {
    console.log('❌ No se pudieron obtener las ubicaciones');
    return;
  }
  
  const locations = response.data || [];
  console.log(`📊 Total locations encontradas: ${locations.length}`);
  
  let debugLocations = [];
  
  // Mostrar TODOS los datos para inspección
  for (const location of locations) {
    console.log(`\n📍 Location ID: ${location.id}`);
    console.log(`   Name: "${location.name}"`);
    console.log(`   Description: "${location.description}"`);
    
    const hasDebugInName = containsDebugPattern(location.name);
    const hasDebugInDesc = containsDebugPattern(location.description);
    
    if (hasDebugInName || hasDebugInDesc) {
      console.log(`   🚨 CONTIENE DATOS DE DEBUG!`);
      debugLocations.push(location);
    }
  }
  
  console.log(`\n🚨 LOCATIONS CON DATOS DE DEBUG ENCONTRADAS: ${debugLocations.length}`);
  
  // Eliminar cada location de debug
  for (const location of debugLocations) {
    console.log(`\n🗑️ ELIMINANDO: ${location.name}`);
    console.log(`   ID: ${location.id}`);
    console.log(`   Description: ${location.description}`);
    
    const deleteResponse = await makeRequest(
      `${BASE_URL}/api/locations/${location.id}`,
      { method: 'DELETE' }
    );
    
    if (deleteResponse) {
      console.log(`✅ ELIMINADO EXITOSAMENTE: ${location.id}`);
    } else {
      console.log(`❌ ERROR AL ELIMINAR: ${location.id}`);
    }
  }
  
  return debugLocations.length;
}

async function inspectAndCleanCategories() {
  console.log('\n🔍 INSPECCIONANDO CATEGORIES...');
  
  const response = await makeRequest(`${BASE_URL}/api/categories`);
  if (!response || !response.success) {
    console.log('❌ No se pudieron obtener las categorías');
    return;
  }
  
  const categories = response.data || [];
  console.log(`📊 Total categories encontradas: ${categories.length}`);
  
  let debugCategories = [];
  
  for (const category of categories) {
    console.log(`\n📂 Category ID: ${category.id}`);
    console.log(`   Name: "${category.name}"`);
    console.log(`   Description: "${category.description}"`);
    
    const hasDebugInName = containsDebugPattern(category.name);
    const hasDebugInDesc = containsDebugPattern(category.description);
    
    if (hasDebugInName || hasDebugInDesc) {
      console.log(`   🚨 CONTIENE DATOS DE DEBUG!`);
      debugCategories.push(category);
    }
  }
  
  console.log(`\n🚨 CATEGORIES CON DATOS DE DEBUG ENCONTRADAS: ${debugCategories.length}`);
  
  for (const category of debugCategories) {
    console.log(`\n🗑️ ELIMINANDO: ${category.name}`);
    
    const deleteResponse = await makeRequest(
      `${BASE_URL}/api/categories/${category.id}`,
      { method: 'DELETE' }
    );
    
    if (deleteResponse) {
      console.log(`✅ ELIMINADO EXITOSAMENTE: ${category.id}`);
    } else {
      console.log(`❌ ERROR AL ELIMINAR: ${category.id}`);
    }
  }
  
  return debugCategories.length;
}

async function inspectAndCleanInventory() {
  console.log('\n🔍 INSPECCIONANDO INVENTORY...');
  
  const response = await makeRequest(`${BASE_URL}/api/inventory`);
  if (!response || !response.success) {
    console.log('❌ No se pudieron obtener los items de inventario');
    return;
  }
  
  const items = response.data || [];
  console.log(`📊 Total inventory items encontrados: ${items.length}`);
  
  let debugItems = [];
  
  for (const item of items) {
    console.log(`\n📦 Item ID: ${item.id}`);
    console.log(`   Name: "${item.name}"`);
    console.log(`   Description: "${item.description}"`);
    console.log(`   SKU: "${item.sku}"`);
    
    const hasDebugInName = containsDebugPattern(item.name);
    const hasDebugInDesc = containsDebugPattern(item.description);
    const hasDebugInSku = containsDebugPattern(item.sku);
    
    if (hasDebugInName || hasDebugInDesc || hasDebugInSku) {
      console.log(`   🚨 CONTIENE DATOS DE DEBUG!`);
      debugItems.push(item);
    }
  }
  
  console.log(`\n🚨 INVENTORY ITEMS CON DATOS DE DEBUG ENCONTRADOS: ${debugItems.length}`);
  
  for (const item of debugItems) {
    console.log(`\n🗑️ ELIMINANDO: ${item.name}`);
    
    const deleteResponse = await makeRequest(
      `${BASE_URL}/api/inventory/${item.id}/hard-delete`,
      { method: 'DELETE' }
    );
    
    if (deleteResponse) {
      console.log(`✅ ELIMINADO EXITOSAMENTE: ${item.id}`);
    } else {
      console.log(`❌ ERROR AL ELIMINAR: ${item.id}`);
    }
  }
  
  return debugItems.length;
}

async function inspectAndCleanUsers() {
  console.log('\n🔍 INSPECCIONANDO USERS...');
  
  const response = await makeRequest(`${BASE_URL}/api/users`);
  if (!response || !response.success) {
    console.log('❌ No se pudieron obtener los usuarios');
    return;
  }
  
  const users = response.data || [];
  console.log(`📊 Total users encontrados: ${users.length}`);
  
  let debugUsers = [];
  
  for (const user of users) {
    console.log(`\n👤 User ID: ${user.id}`);
    console.log(`   Name: "${user.name}"`);
    console.log(`   Email: "${user.email}"`);
    
    const hasDebugInName = containsDebugPattern(user.name);
    const hasDebugInEmail = containsDebugPattern(user.email);
    const hasTestEmail = user.email?.includes('test.com') || user.email?.includes('example.com');
    
    if (hasDebugInName || hasDebugInEmail || hasTestEmail) {
      console.log(`   🚨 CONTIENE DATOS DE DEBUG!`);
      debugUsers.push(user);
    }
  }
  
  console.log(`\n🚨 USERS CON DATOS DE DEBUG ENCONTRADOS: ${debugUsers.length}`);
  
  for (const user of debugUsers) {
    console.log(`\n🗑️ ELIMINANDO: ${user.name} (${user.email})`);
    
    const deleteResponse = await makeRequest(
      `${BASE_URL}/api/users/${user.id}`,
      { method: 'DELETE' }
    );
    
    if (deleteResponse) {
      console.log(`✅ ELIMINADO EXITOSAMENTE: ${user.id}`);
    } else {
      console.log(`❌ ERROR AL ELIMINAR: ${user.id}`);
    }
  }
  
  return debugUsers.length;
}

async function finalVerification() {
  console.log('\n🔍 VERIFICACIÓN FINAL...');
  
  const tables = [
    { name: 'locations', endpoint: '/api/locations' },
    { name: 'categories', endpoint: '/api/categories' },
    { name: 'inventory', endpoint: '/api/inventory' },
    { name: 'users', endpoint: '/api/users' }
  ];
  
  let totalDebugFound = 0;
  
  for (const table of tables) {
    const response = await makeRequest(`${BASE_URL}${table.endpoint}`);
    if (response && response.success) {
      const data = response.data || [];
      
      for (const item of data) {
        const hasDebug = 
          containsDebugPattern(item.name) ||
          containsDebugPattern(item.description) ||
          containsDebugPattern(item.sku) ||
          containsDebugPattern(item.email) ||
          (item.email && (item.email.includes('test.com') || item.email.includes('example.com')));
        
        if (hasDebug) {
          console.log(`🚨 DATOS DE DEBUG AÚN PRESENTES en ${table.name}:`);
          console.log(`   ID: ${item.id}`);
          console.log(`   Name: ${item.name}`);
          console.log(`   Description: ${item.description}`);
          console.log(`   Email: ${item.email}`);
          console.log(`   SKU: ${item.sku}`);
          totalDebugFound++;
        }
      }
    }
  }
  
  return totalDebugFound;
}

async function runEmergencyCleanup() {
  console.log('🚨 INICIANDO LIMPIEZA DE EMERGENCIA - DATOS DE DEBUG');
  console.log('===================================================');
  
  try {
    // Limpiar en orden correcto (respetando foreign keys)
    const inventoryDeleted = await inspectAndCleanInventory();
    const usersDeleted = await inspectAndCleanUsers();
    const locationsDeleted = await inspectAndCleanLocations();
    const categoriesDeleted = await inspectAndCleanCategories();
    
    console.log('\n📊 RESUMEN DE ELIMINACIONES:');
    console.log('============================');
    console.log(`🗑️ Inventory items eliminados: ${inventoryDeleted}`);
    console.log(`🗑️ Users eliminados: ${usersDeleted}`);
    console.log(`🗑️ Locations eliminadas: ${locationsDeleted}`);
    console.log(`🗑️ Categories eliminadas: ${categoriesDeleted}`);
    
    // Verificación final
    const remainingDebug = await finalVerification();
    
    console.log('\n🎯 RESULTADO FINAL:');
    console.log('==================');
    
    if (remainingDebug === 0) {
      console.log('✅ ¡BASE DE DATOS COMPLETAMENTE LIMPIA!');
      console.log('✅ No quedan datos de debug/test');
      console.log('✅ Lista para producción');
    } else {
      console.log(`❌ AÚN QUEDAN ${remainingDebug} REGISTROS CON DATOS DE DEBUG`);
      console.log('❌ Se requiere limpieza manual adicional');
    }
    
  } catch (error) {
    console.error('❌ Error durante la limpieza de emergencia:', error);
  }
}

// Ejecutar limpieza de emergencia
runEmergencyCleanup();