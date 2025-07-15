/**
 * SCRIPT DE LIMPIEZA FINAL DE BASE DE DATOS
 * ========================================
 * 
 * Este script elimina TODOS los datos de test/debug de la base de datos
 * para garantizar que no queden rastros de pruebas en producción.
 * 
 * PATRONES DE BÚSQUEDA:
 * - Nombres que contengan: Test, test, TEST, Debug, debug, DEBUG
 * - Descripciones que contengan: Automated, automated, AUTOMATED
 * - SKUs que contengan: TEST-, test-, DEBUG-
 * - Emails que contengan: test@, debug@, temp@
 * - Cualquier dato creado durante las pruebas
 */

const BASE_URL = 'http://localhost:3000';

// Patrones de datos de test a eliminar
const TEST_PATTERNS = {
  names: ['test', 'Test', 'TEST', 'debug', 'Debug', 'DEBUG', 'temp', 'Temp', 'TEMP'],
  descriptions: ['automated', 'Automated', 'AUTOMATED', 'test', 'Test', 'TEST'],
  skus: ['TEST-', 'test-', 'DEBUG-', 'debug-'],
  emails: ['test@', 'debug@', 'temp@', 'automated@']
};

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Development-Mode': 'true', // Para bypass de auth en desarrollo
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

function containsTestPattern(text, patterns) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return patterns.some(pattern => lowerText.includes(pattern.toLowerCase()));
}

async function cleanupInventoryItems() {
  console.log('\n🧹 Limpiando items de inventario con datos de test...');
  
  const response = await makeRequest(`${BASE_URL}/api/inventory`);
  if (!response || !response.success) {
    console.log('❌ No se pudieron obtener los items de inventario');
    return;
  }
  
  const items = response.data || [];
  let deletedCount = 0;
  
  for (const item of items) {
    const isTestData = 
      containsTestPattern(item.name, TEST_PATTERNS.names) ||
      containsTestPattern(item.description, TEST_PATTERNS.descriptions) ||
      containsTestPattern(item.sku, TEST_PATTERNS.skus);
    
    if (isTestData) {
      console.log(`🗑️ Eliminando item de test: ${item.name} (${item.sku})`);
      
      // Usar hard delete para eliminar completamente
      const deleteResponse = await makeRequest(
        `${BASE_URL}/api/inventory/${item.id}/hard-delete`,
        { method: 'DELETE' }
      );
      
      if (deleteResponse) {
        deletedCount++;
        console.log(`✅ Item eliminado: ${item.id}`);
      }
    }
  }
  
  console.log(`📊 Items de inventario eliminados: ${deletedCount}`);
}

async function cleanupCategories() {
  console.log('\n🧹 Limpiando categorías con datos de test...');
  
  const response = await makeRequest(`${BASE_URL}/api/categories`);
  if (!response || !response.success) {
    console.log('❌ No se pudieron obtener las categorías');
    return;
  }
  
  const categories = response.data || [];
  let deletedCount = 0;
  
  for (const category of categories) {
    const isTestData = 
      containsTestPattern(category.name, TEST_PATTERNS.names) ||
      containsTestPattern(category.description, TEST_PATTERNS.descriptions);
    
    if (isTestData) {
      console.log(`🗑️ Eliminando categoría de test: ${category.name}`);
      
      const deleteResponse = await makeRequest(
        `${BASE_URL}/api/categories/${category.id}`,
        { method: 'DELETE' }
      );
      
      if (deleteResponse) {
        deletedCount++;
        console.log(`✅ Categoría eliminada: ${category.id}`);
      }
    }
  }
  
  console.log(`📊 Categorías eliminadas: ${deletedCount}`);
}

async function cleanupLocations() {
  console.log('\n🧹 Limpiando ubicaciones con datos de test...');
  
  const response = await makeRequest(`${BASE_URL}/api/locations`);
  if (!response || !response.success) {
    console.log('❌ No se pudieron obtener las ubicaciones');
    return;
  }
  
  const locations = response.data || [];
  let deletedCount = 0;
  
  for (const location of locations) {
    const isTestData = 
      containsTestPattern(location.name, TEST_PATTERNS.names) ||
      containsTestPattern(location.description, TEST_PATTERNS.descriptions);
    
    if (isTestData) {
      console.log(`🗑️ Eliminando ubicación de test: ${location.name}`);
      
      const deleteResponse = await makeRequest(
        `${BASE_URL}/api/locations/${location.id}`,
        { method: 'DELETE' }
      );
      
      if (deleteResponse) {
        deletedCount++;
        console.log(`✅ Ubicación eliminada: ${location.id}`);
      }
    }
  }
  
  console.log(`📊 Ubicaciones eliminadas: ${deletedCount}`);
}

async function cleanupUsers() {
  console.log('\n🧹 Limpiando usuarios con datos de test...');
  
  const response = await makeRequest(`${BASE_URL}/api/users`);
  if (!response || !response.success) {
    console.log('❌ No se pudieron obtener los usuarios');
    return;
  }
  
  const users = response.data || [];
  let deletedCount = 0;
  
  for (const user of users) {
    const isTestData = 
      containsTestPattern(user.name, TEST_PATTERNS.names) ||
      containsTestPattern(user.email, TEST_PATTERNS.emails) ||
      user.email?.includes('example.com') ||
      user.email?.includes('test.com');
    
    if (isTestData) {
      console.log(`🗑️ Eliminando usuario de test: ${user.name} (${user.email})`);
      
      const deleteResponse = await makeRequest(
        `${BASE_URL}/api/users/${user.id}`,
        { method: 'DELETE' }
      );
      
      if (deleteResponse) {
        deletedCount++;
        console.log(`✅ Usuario eliminado: ${user.id}`);
      }
    }
  }
  
  console.log(`📊 Usuarios eliminados: ${deletedCount}`);
}

async function verifyCleanDatabase() {
  console.log('\n🔍 Verificando que la base de datos esté limpia...');
  
  // Verificar cada tabla
  const tables = [
    { name: 'inventory', endpoint: '/api/inventory' },
    { name: 'categories', endpoint: '/api/categories' },
    { name: 'locations', endpoint: '/api/locations' },
    { name: 'users', endpoint: '/api/users' }
  ];
  
  let foundTestData = false;
  
  for (const table of tables) {
    const response = await makeRequest(`${BASE_URL}${table.endpoint}`);
    if (response && response.success) {
      const data = response.data || [];
      
      for (const item of data) {
        const hasTestPattern = 
          containsTestPattern(item.name, TEST_PATTERNS.names) ||
          containsTestPattern(item.description, TEST_PATTERNS.descriptions) ||
          containsTestPattern(item.sku, TEST_PATTERNS.skus) ||
          containsTestPattern(item.email, TEST_PATTERNS.emails);
        
        if (hasTestPattern) {
          console.log(`⚠️ DATOS DE TEST ENCONTRADOS en ${table.name}:`, {
            id: item.id,
            name: item.name,
            email: item.email,
            sku: item.sku
          });
          foundTestData = true;
        }
      }
      
      console.log(`✅ ${table.name}: ${data.length} registros verificados`);
    }
  }
  
  if (!foundTestData) {
    console.log('\n🎉 ¡BASE DE DATOS LIMPIA! No se encontraron datos de test.');
  } else {
    console.log('\n❌ ¡ATENCIÓN! Se encontraron datos de test en la base de datos.');
  }
  
  return !foundTestData;
}

async function runFinalCleanup() {
  console.log('🚀 INICIANDO LIMPIEZA FINAL DE BASE DE DATOS');
  console.log('=============================================');
  
  try {
    // Limpiar en orden correcto (respetando foreign keys)
    await cleanupInventoryItems();
    await cleanupUsers();
    await cleanupLocations();
    await cleanupCategories();
    
    // Verificar que todo esté limpio
    const isClean = await verifyCleanDatabase();
    
    console.log('\n📊 RESUMEN DE LIMPIEZA:');
    console.log('======================');
    
    if (isClean) {
      console.log('✅ Base de datos completamente limpia');
      console.log('✅ No hay datos de test residuales');
      console.log('✅ Lista para producción');
    } else {
      console.log('❌ Aún hay datos de test en la base de datos');
      console.log('❌ Se requiere limpieza manual adicional');
    }
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  }
}

// Ejecutar limpieza
runFinalCleanup();