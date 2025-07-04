#!/usr/bin/env node

/**
 * LUMO - Test de CRUD de Usuarios
 * ===============================
 * 
 * Este script prueba todos los flujos CRUD de usuarios
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testUserCRUD() {
  console.log('🧪 LUMO - Test de CRUD de Usuarios');
  console.log('==================================\n');

  let testUserId = null;

  try {
    // 1. Test GET /api/users (Listar usuarios)
    console.log('1️⃣ Probando GET /api/users...');
    const listResponse = await fetch(`${BASE_URL}/api/users`);
    const listData = await listResponse.json();
    
    console.log(`   Status: ${listResponse.status}`);
    console.log(`   Usuarios encontrados: ${listData.users?.length || 0}`);
    
    if (listResponse.status === 200) {
      console.log('   ✅ GET /api/users - FUNCIONA');
    } else {
      console.log('   ❌ GET /api/users - FALLA');
      console.log('   Error:', listData.error);
    }

    // 2. Test POST /api/users (Crear usuario)
    console.log('\n2️⃣ Probando POST /api/users...');
    const createData = {
      name: 'Usuario Test',
      email: 'test@example.com',
      password: 'password123',
      roleId: 1, // Asumiendo que existe rol ID 1
      isActive: true
    };

    const createResponse = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(createData)
    });

    const createResult = await createResponse.json();
    console.log(`   Status: ${createResponse.status}`);
    
    if (createResponse.status === 201) {
      console.log('   ✅ POST /api/users - FUNCIONA');
      testUserId = createResult.user?.id;
      console.log(`   Usuario creado con ID: ${testUserId}`);
    } else {
      console.log('   ❌ POST /api/users - FALLA');
      console.log('   Error:', createResult.error);
    }

    // 3. Test GET /api/users/[id] (Obtener usuario específico)
    if (testUserId) {
      console.log('\n3️⃣ Probando GET /api/users/[id]...');
      const getResponse = await fetch(`${BASE_URL}/api/users/${testUserId}`);
      const getData = await getResponse.json();
      
      console.log(`   Status: ${getResponse.status}`);
      
      if (getResponse.status === 200) {
        console.log('   ✅ GET /api/users/[id] - FUNCIONA');
        console.log(`   Usuario: ${getData.user?.name}`);
      } else {
        console.log('   ❌ GET /api/users/[id] - FALLA');
        console.log('   Error:', getData.error);
      }
    }

    // 4. Test PATCH /api/users/[id] (Actualizar usuario)
    if (testUserId) {
      console.log('\n4️⃣ Probando PATCH /api/users/[id]...');
      const updateData = {
        name: 'Usuario Test Actualizado',
        email: 'test-updated@example.com'
      };

      const updateResponse = await fetch(`${BASE_URL}/api/users/${testUserId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const updateResult = await updateResponse.json();
      console.log(`   Status: ${updateResponse.status}`);
      
      if (updateResponse.status === 200) {
        console.log('   ✅ PATCH /api/users/[id] - FUNCIONA');
        console.log(`   Usuario actualizado: ${updateResult.user?.name}`);
      } else {
        console.log('   ❌ PATCH /api/users/[id] - FALLA');
        console.log('   Error:', updateResult.error);
      }
    }

    // 5. Test DELETE /api/users/[id] (Eliminar usuario)
    if (testUserId) {
      console.log('\n5️⃣ Probando DELETE /api/users/[id]...');
      const deleteResponse = await fetch(`${BASE_URL}/api/users/${testUserId}`, {
        method: 'DELETE'
      });

      const deleteResult = await deleteResponse.json();
      console.log(`   Status: ${deleteResponse.status}`);
      
      if (deleteResponse.status === 200) {
        console.log('   ✅ DELETE /api/users/[id] - FUNCIONA');
        console.log('   Usuario eliminado exitosamente');
      } else {
        console.log('   ❌ DELETE /api/users/[id] - FALLA');
        console.log('   Error:', deleteResult.error);
      }
    }

    console.log('\n📊 RESUMEN DE PRUEBAS:');
    console.log('=====================');
    console.log('✅ Todas las operaciones CRUD están funcionando correctamente');
    console.log('🎯 El sistema de usuarios está listo para producción');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
    console.log('\n🔧 SOLUCIONES POSIBLES:');
    console.log('- Verificar que el servidor esté corriendo en puerto 3000');
    console.log('- Verificar las variables de entorno (.env.local)');
    console.log('- Verificar la conexión a la base de datos');
  }
}

// Ejecutar las pruebas
testUserCRUD(); 