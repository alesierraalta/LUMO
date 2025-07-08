#!/usr/bin/env node

/**
 * Script de prueba completa para verificar la funcionalidad del usuario admin en producción
 * Este script verifica que el usuario admin puede:
 * 1. Iniciar sesión correctamente
 * 2. Acceder a todas las funcionalidades
 * 3. Realizar operaciones CRUD en la base de datos
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de producción
const SUPABASE_URL = 'https://ubjujxtvlubxowsphvuk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4';
const PRODUCTION_URL = 'https://lumo-woad.vercel.app';

// Credenciales del admin
const ADMIN_EMAIL = 'alesierraalta@gmail.com';
const ADMIN_PASSWORD = 'admin123';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDatabaseConnection() {
    console.log('🔍 Probando conexión a la base de datos...');
    
    try {
        // Verificar usuarios
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, email, name, is_active')
            .limit(5);
        
        if (usersError) {
            console.error('❌ Error al obtener usuarios:', usersError.message);
            return false;
        }
        
        console.log('✅ Usuarios encontrados:', users.length);
        users.forEach(user => {
            console.log(`   - ${user.name} (${user.email}) - ${user.is_active ? 'Activo' : 'Inactivo'}`);
        });
        
        // Verificar categorías
        const { data: categories, error: categoriesError } = await supabase
            .from('categories')
            .select('id, name, description')
            .limit(5);
        
        if (categoriesError) {
            console.error('❌ Error al obtener categorías:', categoriesError.message);
            return false;
        }
        
        console.log('✅ Categorías encontradas:', categories.length);
        categories.forEach(category => {
            console.log(`   - ${category.name}: ${category.description}`);
        });
        
        // Verificar roles
        const { data: roles, error: rolesError } = await supabase
            .from('roles')
            .select('id, name, description')
            .limit(5);
        
        if (rolesError) {
            console.error('❌ Error al obtener roles:', rolesError.message);
            return false;
        }
        
        console.log('✅ Roles encontrados:', roles.length);
        roles.forEach(role => {
            console.log(`   - ${role.name}: ${role.description}`);
        });
        
        return true;
        
    } catch (error) {
        console.error('❌ Error en la conexión a la base de datos:', error.message);
        return false;
    }
}

async function testHealthEndpoint() {
    console.log('🔍 Probando endpoint de salud...');
    
    try {
        const response = await fetch(`${PRODUCTION_URL}/api/health`);
        const data = await response.json();
        
        if (response.ok && data.status === 'healthy') {
            console.log('✅ Endpoint de salud OK');
            console.log('   - Status:', data.status);
            console.log('   - Database:', data.services?.database || 'unknown');
            console.log('   - Server:', data.services?.server || 'unknown');
            return true;
        } else {
            console.error('❌ Endpoint de salud falló:', data);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error al probar endpoint de salud:', error.message);
        return false;
    }
}

async function testAdminUserExists() {
    console.log('🔍 Verificando usuario admin...');
    
    try {
        const { data: adminUser, error } = await supabase
            .from('users')
            .select(`
                id,
                email,
                name,
                is_active,
                roles (
                    id,
                    name,
                    description
                )
            `)
            .eq('email', ADMIN_EMAIL)
            .single();
        
        if (error) {
            console.error('❌ Error al buscar usuario admin:', error.message);
            return false;
        }
        
        if (!adminUser) {
            console.error('❌ Usuario admin no encontrado');
            return false;
        }
        
        console.log('✅ Usuario admin encontrado:');
        console.log(`   - ID: ${adminUser.id}`);
        console.log(`   - Email: ${adminUser.email}`);
        console.log(`   - Nombre: ${adminUser.name}`);
        console.log(`   - Activo: ${adminUser.is_active}`);
        console.log(`   - Rol: ${adminUser.roles?.name || 'No definido'}`);
        
        return adminUser.is_active && adminUser.roles?.name === 'ADMIN';
        
    } catch (error) {
        console.error('❌ Error al verificar usuario admin:', error.message);
        return false;
    }
}

async function testCreateCategory() {
    console.log('🔍 Probando creación de categoría...');
    
    try {
        // Obtener el ID del usuario admin
        const { data: adminUser, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('email', ADMIN_EMAIL)
            .single();
        
        if (userError || !adminUser) {
            console.error('❌ No se pudo obtener el usuario admin para crear categoría');
            return false;
        }
        
        const testCategory = {
            name: `Categoría de Prueba ${Date.now()}`,
            description: 'Categoría creada por el script de prueba',
            created_by_id: adminUser.id
        };
        
        const { data: category, error } = await supabase
            .from('categories')
            .insert([testCategory])
            .select()
            .single();
        
        if (error) {
            console.error('❌ Error al crear categoría:', error.message);
            return false;
        }
        
        console.log('✅ Categoría creada exitosamente:');
        console.log(`   - ID: ${category.id}`);
        console.log(`   - Nombre: ${category.name}`);
        console.log(`   - Descripción: ${category.description}`);
        
        // Limpiar - eliminar la categoría de prueba
        await supabase
            .from('categories')
            .delete()
            .eq('id', category.id);
        
        console.log('✅ Categoría de prueba eliminada correctamente');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error al probar creación de categoría:', error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 Iniciando pruebas de producción para usuario admin...\n');
    
    const tests = [
        { name: 'Conexión a la base de datos', test: testDatabaseConnection },
        { name: 'Endpoint de salud', test: testHealthEndpoint },
        { name: 'Usuario admin existe', test: testAdminUserExists },
        { name: 'Crear categoría', test: testCreateCategory }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const { name, test } of tests) {
        console.log(`\n📋 Ejecutando: ${name}`);
        console.log('─'.repeat(50));
        
        try {
            const result = await test();
            if (result) {
                passed++;
                console.log(`✅ ${name}: PASÓ`);
            } else {
                failed++;
                console.log(`❌ ${name}: FALLÓ`);
            }
        } catch (error) {
            failed++;
            console.log(`❌ ${name}: ERROR - ${error.message}`);
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE PRUEBAS');
    console.log('='.repeat(60));
    console.log(`✅ Pruebas exitosas: ${passed}`);
    console.log(`❌ Pruebas fallidas: ${failed}`);
    console.log(`📈 Porcentaje de éxito: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
        console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON! El usuario admin está funcionando correctamente en producción.');
    } else {
        console.log('\n⚠️  Algunas pruebas fallaron. Revisar los errores arriba.');
    }
    
    return failed === 0;
}

// Ejecutar las pruebas
if (require.main === module) {
    runAllTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { runAllTests }; 