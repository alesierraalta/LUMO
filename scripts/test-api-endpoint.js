/**
 * Test simple del endpoint HTTP /api/users/[id]
 */

const http = require('http');

async function testApiEndpoint() {
  console.log('🧪 Testing API Endpoint...\n');
  
  const baseUrl = 'http://localhost:3000';
  
  // Test 1: Usuario inexistente (debe devolver 404)
  console.log('📋 Test 1: Usuario inexistente');
  try {
    const response = await fetch(`${baseUrl}/api/users/dd97c238-6649-4e31-979b-c9ef12959999`);
    console.log(`Status: ${response.status}`);
    
    const text = await response.text();
    console.log(`Response: ${text.substring(0, 100)}...`);
    
    if (response.status === 404) {
      console.log('✅ CORRECTO: Devuelve 404 para usuario inexistente\n');
    } else {
      console.log('❌ ERROR: Debería devolver 404 para usuario inexistente\n');
    }
  } catch (error) {
    console.log('❌ ERROR en fetch:', error.message, '\n');
  }
  
  // Test 2: Obtener lista de usuarios
  console.log('📋 Test 2: Lista de usuarios');
  try {
    const response = await fetch(`${baseUrl}/api/users`);
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.users && data.users.length > 0) {
        console.log(`✅ ${data.users.length} usuarios encontrados`);
        console.log(`  - Primer usuario: ${data.users[0].name} (${data.users[0].id})\n`);
        
        // Test 3: Usuario existente
        console.log('📋 Test 3: Usuario existente');
        const userResponse = await fetch(`${baseUrl}/api/users/${data.users[0].id}`);
        console.log(`Status: ${userResponse.status}`);
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log('✅ CORRECTO: Usuario cargado exitosamente');
          console.log(`  - Nombre: ${userData.user.name}`);
          console.log(`  - Email: ${userData.user.email}\n`);
        } else {
          console.log('❌ ERROR: No se pudo cargar usuario existente\n');
        }
      } else {
        console.log('❌ No hay usuarios en la base de datos\n');
      }
    } else {
      console.log('❌ ERROR obteniendo usuarios\n');
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message, '\n');
  }
  
  console.log('✅ Test completado');
}

// Verificar si fetch está disponible
if (typeof fetch === 'undefined') {
  // Para Node.js < 18
  global.fetch = require('node-fetch');
}

testApiEndpoint().catch(console.error); 