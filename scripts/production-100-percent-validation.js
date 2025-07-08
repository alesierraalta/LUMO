#!/usr/bin/env node

/**
 * LUMO - Validación 100% Completa en Producción
 * Script exhaustivo para validar todas las funcionalidades en producción
 * Similar al que usamos en local pero adaptado para el entorno de producción
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de producción
const SUPABASE_URL = 'https://ubjujxtvlubxowsphvuk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4';
const PRODUCTION_URL = 'https://lumo-woad.vercel.app';

// Credenciales del admin
const ADMIN_EMAIL = 'alesierraalta@gmail.com';
const ADMIN_PASSWORD = 'admin123';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Resultados de las pruebas
let testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

// Función para registrar resultados
function logTest(testName, passed, details = '') {
    testResults.total++;
    if (passed) {
        testResults.passed++;
        console.log(`✅ ${testName}: PASÓ`);
    } else {
        testResults.failed++;
        console.log(`❌ ${testName}: FALLÓ - ${details}`);
    }
    testResults.details.push({
        name: testName,
        passed,
        details,
        timestamp: new Date().toISOString()
    });
}

// SECCIÓN 1: VALIDACIÓN DE INFRAESTRUCTURA
async function validateInfrastructure() {
    console.log('\n🏗️  SECCIÓN 1: VALIDACIÓN DE INFRAESTRUCTURA');
    console.log('='.repeat(60));
    
    // Test 1: Conexión a Supabase
    try {
        const { data, error } = await supabase.from('users').select('count', { count: 'exact' });
        logTest('Conexión a Supabase', !error, error?.message);
    } catch (err) {
        logTest('Conexión a Supabase', false, err.message);
    }
    
    // Test 2: Verificar todas las tablas
    const expectedTables = ['users', 'roles', 'categories', 'inventory_items', 'locations', 'stock_movements'];
    
    for (const table of expectedTables) {
        try {
            const { data, error } = await supabase.from(table).select('*').limit(1);
            logTest(`Tabla ${table} existe`, !error, error?.message);
        } catch (err) {
            logTest(`Tabla ${table} existe`, false, err.message);
        }
    }
    
    // Test 3: Health endpoint
    try {
        const response = await fetch(`${PRODUCTION_URL}/api/health`);
        const data = await response.json();
        logTest('Health endpoint', response.ok && data.status === 'healthy', `Status: ${data.status}`);
    } catch (err) {
        logTest('Health endpoint', false, err.message);
    }
}

// SECCIÓN 2: VALIDACIÓN DE AUTENTICACIÓN
async function validateAuthentication() {
    console.log('\n🔐 SECCIÓN 2: VALIDACIÓN DE AUTENTICACIÓN');
    console.log('='.repeat(60));
    
    // Test 1: Usuario admin existe
    try {
        const { data: adminUser, error } = await supabase
            .from('users')
            .select('id, email, name, is_active, role_id')
            .eq('email', ADMIN_EMAIL)
            .single();
        
        logTest('Usuario admin existe', !error && adminUser, error?.message);
        
        if (adminUser) {
            // Test 2: Usuario admin tiene rol ADMIN
            const { data: role, error: roleError } = await supabase
                .from('roles')
                .select('name')
                .eq('id', adminUser.role_id)
                .single();
            
            logTest('Usuario admin tiene rol ADMIN', !roleError && role?.name === 'ADMIN', `Rol: ${role?.name}`);
        }
    } catch (err) {
        logTest('Usuario admin existe', false, err.message);
    }
    
    // Test 3: Verificar todos los roles
    try {
        const { data: roles, error } = await supabase
            .from('roles')
            .select('*')
            .order('name');
        
        const expectedRoles = ['ADMIN', 'MANAGER', 'USER'];
        const foundRoles = roles?.map(r => r.name) || [];
        const hasAllRoles = expectedRoles.every(role => foundRoles.includes(role));
        
        logTest('Todos los roles existen', !error && hasAllRoles, `Roles: ${foundRoles.join(', ')}`);
    } catch (err) {
        logTest('Todos los roles existen', false, err.message);
    }
}

// SECCIÓN 3: VALIDACIÓN CRUD COMPLETA
async function validateCRUD() {
    console.log('\n📝 SECCIÓN 3: VALIDACIÓN CRUD COMPLETA');
    console.log('='.repeat(60));
    
    // Obtener ID del usuario admin para las pruebas
    const { data: adminUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', ADMIN_EMAIL)
        .single();
    
    if (!adminUser) {
        logTest('CRUD - Usuario admin disponible', false, 'No se encontró usuario admin');
        return;
    }
    
    // CRUD CATEGORÍAS
    console.log('\n📂 Probando CRUD de Categorías...');
    
    // Crear categoría
    const testCategory = {
        name: `Test Category ${Date.now()}`,
        description: 'Categoría de prueba para validación',
        created_by_id: adminUser.id
    };
    
    try {
        const { data: createdCategory, error: createError } = await supabase
            .from('categories')
            .insert([testCategory])
            .select()
            .single();
        
        logTest('CRUD - Crear categoría', !createError, createError?.message);
        
        if (createdCategory) {
            // Leer categoría
            const { data: readCategory, error: readError } = await supabase
                .from('categories')
                .select('*')
                .eq('id', createdCategory.id)
                .single();
            
            logTest('CRUD - Leer categoría', !readError, readError?.message);
            
            // Actualizar categoría
            const { data: updatedCategory, error: updateError } = await supabase
                .from('categories')
                .update({ description: 'Descripción actualizada' })
                .eq('id', createdCategory.id)
                .select()
                .single();
            
            logTest('CRUD - Actualizar categoría', !updateError, updateError?.message);
            
            // Eliminar categoría
            const { error: deleteError } = await supabase
                .from('categories')
                .delete()
                .eq('id', createdCategory.id);
            
            logTest('CRUD - Eliminar categoría', !deleteError, deleteError?.message);
        }
    } catch (err) {
        logTest('CRUD - Crear categoría', false, err.message);
    }
    
    // CRUD UBICACIONES
    console.log('\n📍 Probando CRUD de Ubicaciones...');
    
    const testLocation = {
        name: `Test Location ${Date.now()}`,
        description: 'Ubicación de prueba para validación'
    };
    
    try {
        const { data: createdLocation, error: createError } = await supabase
            .from('locations')
            .insert([testLocation])
            .select()
            .single();
        
        logTest('CRUD - Crear ubicación', !createError, createError?.message);
        
        if (createdLocation) {
            // Leer ubicación
            const { data: readLocation, error: readError } = await supabase
                .from('locations')
                .select('*')
                .eq('id', createdLocation.id)
                .single();
            
            logTest('CRUD - Leer ubicación', !readError, readError?.message);
            
            // Actualizar ubicación
            const { data: updatedLocation, error: updateError } = await supabase
                .from('locations')
                .update({ description: 'Descripción actualizada' })
                .eq('id', createdLocation.id)
                .select()
                .single();
            
            logTest('CRUD - Actualizar ubicación', !updateError, updateError?.message);
            
            // Eliminar ubicación
            const { error: deleteError } = await supabase
                .from('locations')
                .delete()
                .eq('id', createdLocation.id);
            
            logTest('CRUD - Eliminar ubicación', !deleteError, deleteError?.message);
        }
    } catch (err) {
        logTest('CRUD - Crear ubicación', false, err.message);
    }
    
    // CRUD INVENTARIO
    console.log('\n📦 Probando CRUD de Inventario...');
    
    // Primero necesitamos una categoría y ubicación existentes
    const { data: existingCategory } = await supabase
        .from('categories')
        .select('id')
        .limit(1)
        .single();
    
    const { data: existingLocation } = await supabase
        .from('locations')
        .select('id')
        .limit(1)
        .single();
    
    if (existingCategory && existingLocation) {
        const testInventoryItem = {
            name: `Test Product ${Date.now()}`,
            description: 'Producto de prueba para validación',
            sku: `TEST-${Date.now()}`,
            category_id: existingCategory.id,
            location_id: existingLocation.id,
            cost: 10.50,
            price: 15.75,
            current_stock: 100,
            min_level: 10,
            created_by_id: adminUser.id
        };
        
        try {
            const { data: createdItem, error: createError } = await supabase
                .from('inventory_items')
                .insert([testInventoryItem])
                .select()
                .single();
            
            logTest('CRUD - Crear item inventario', !createError, createError?.message);
            
            if (createdItem) {
                // Leer item
                const { data: readItem, error: readError } = await supabase
                    .from('inventory_items')
                    .select('*')
                    .eq('id', createdItem.id)
                    .single();
                
                logTest('CRUD - Leer item inventario', !readError, readError?.message);
                
                // Actualizar item
                const { data: updatedItem, error: updateError } = await supabase
                    .from('inventory_items')
                    .update({ current_stock: 150 })
                    .eq('id', createdItem.id)
                    .select()
                    .single();
                
                logTest('CRUD - Actualizar item inventario', !updateError, updateError?.message);
                
                // Eliminar item
                const { error: deleteError } = await supabase
                    .from('inventory_items')
                    .delete()
                    .eq('id', createdItem.id);
                
                logTest('CRUD - Eliminar item inventario', !deleteError, deleteError?.message);
            }
        } catch (err) {
            logTest('CRUD - Crear item inventario', false, err.message);
        }
    } else {
        logTest('CRUD - Prerrequisitos inventario', false, 'No hay categoría o ubicación disponible');
    }
}

// SECCIÓN 4: VALIDACIÓN DE API ENDPOINTS
async function validateAPIEndpoints() {
    console.log('\n🌐 SECCIÓN 4: VALIDACIÓN DE API ENDPOINTS');
    console.log('='.repeat(60));
    
    const endpoints = [
        { path: '/api/health', method: 'GET', auth: false },
        { path: '/api/users', method: 'GET', auth: true },
        { path: '/api/categories', method: 'GET', auth: true },
        { path: '/api/inventory', method: 'GET', auth: true },
        { path: '/api/locations', method: 'GET', auth: true },
        { path: '/api/roles', method: 'GET', auth: true }
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await fetch(`${PRODUCTION_URL}${endpoint.path}`);
            
            if (endpoint.auth) {
                // Para endpoints que requieren auth, esperamos 401 sin token
                logTest(`API ${endpoint.path}`, response.status === 401, `Status: ${response.status}`);
            } else {
                // Para endpoints públicos, esperamos 200
                logTest(`API ${endpoint.path}`, response.ok, `Status: ${response.status}`);
            }
        } catch (err) {
            logTest(`API ${endpoint.path}`, false, err.message);
        }
    }
}

// SECCIÓN 5: VALIDACIÓN DE INTEGRIDAD
async function validateIntegrity() {
    console.log('\n🔍 SECCIÓN 5: VALIDACIÓN DE INTEGRIDAD');
    console.log('='.repeat(60));
    
    // Test 1: Integridad referencial usuarios-roles
    try {
        const { data: usersWithoutRoles, error } = await supabase
            .from('users')
            .select('id, email, role_id')
            .is('role_id', null);
        
        logTest('Integridad - Usuarios sin rol', !error && (!usersWithoutRoles || usersWithoutRoles.length === 0), 
                `Usuarios sin rol: ${usersWithoutRoles?.length || 0}`);
    } catch (err) {
        logTest('Integridad - Usuarios sin rol', false, err.message);
    }
    
    // Test 2: Integridad referencial categorías-inventario
    try {
        const { data: itemsWithoutCategory, error } = await supabase
            .from('inventory_items')
            .select('id, name, category_id')
            .is('category_id', null);
        
        logTest('Integridad - Items sin categoría', !error && (!itemsWithoutCategory || itemsWithoutCategory.length === 0), 
                `Items sin categoría: ${itemsWithoutCategory?.length || 0}`);
    } catch (err) {
        logTest('Integridad - Items sin categoría', false, err.message);
    }
    
    // Test 3: Consistencia de datos
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, email, name, is_active')
            .not('email', 'is', null)
            .not('name', 'is', null);
        
        logTest('Integridad - Datos usuarios consistentes', !error, error?.message);
    } catch (err) {
        logTest('Integridad - Datos usuarios consistentes', false, err.message);
    }
}

// SECCIÓN 6: VALIDACIÓN DE ROLES Y PERMISOS
async function validateRolesAndPermissions() {
    console.log('\n👥 SECCIÓN 6: VALIDACIÓN DE ROLES Y PERMISOS');
    console.log('='.repeat(60));
    
    // Obtener IDs de roles
    const { data: roles, error: rolesError } = await supabase
        .from('roles')
        .select('id, name')
        .order('name');
    
    if (rolesError) {
        logTest('Roles - Obtener roles', false, rolesError.message);
        return;
    }
    
    const adminRole = roles.find(r => r.name === 'ADMIN');
    const managerRole = roles.find(r => r.name === 'MANAGER');
    const userRole = roles.find(r => r.name === 'USER');
    
    // Obtener ID del usuario admin para las pruebas
    const { data: adminUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', ADMIN_EMAIL)
        .single();
    
    // Test 1: Crear usuario con rol MANAGER
    console.log('\n👔 Probando creación de usuario MANAGER...');
    const testManager = {
        email: `manager_test_${Date.now()}@test.com`,
        password: '$2b$10$8K1p/a0dqailSurr.ONHVuEA7Q04ZJ6FN6qtqSzlayy.Ew5fHyOCG',
        name: 'Test Manager User',
        role_id: managerRole?.id,
        is_active: true
    };
    
    try {
        const { data: createdManager, error: createManagerError } = await supabase
            .from('users')
            .insert([testManager])
            .select()
            .single();
        
        logTest('Roles - Crear usuario MANAGER', !createManagerError, createManagerError?.message);
        
        if (createdManager) {
            // Verificar que el usuario tiene el rol correcto
            const { data: managerWithRole, error: managerRoleError } = await supabase
                .from('users')
                .select('id, email, role_id, roles(name)')
                .eq('id', createdManager.id)
                .single();
            
            logTest('Roles - Usuario MANAGER tiene rol correcto', 
                    !managerRoleError && managerWithRole?.roles?.name === 'MANAGER', 
                    managerRoleError?.message);
            
            // Limpiar - eliminar usuario de prueba
            await supabase.from('users').delete().eq('id', createdManager.id);
        }
    } catch (err) {
        logTest('Roles - Crear usuario MANAGER', false, err.message);
    }
    
    // Test 2: Crear usuario con rol USER
    console.log('\n👤 Probando creación de usuario USER...');
    const testUser = {
        email: `user_test_${Date.now()}@test.com`,
        password: '$2b$10$8K1p/a0dqailSurr.ONHVuEA7Q04ZJ6FN6qtqSzlayy.Ew5fHyOCG',
        name: 'Test Regular User',
        role_id: userRole?.id,
        is_active: true
    };
    
    try {
        const { data: createdUser, error: createUserError } = await supabase
            .from('users')
            .insert([testUser])
            .select()
            .single();
        
        logTest('Roles - Crear usuario USER', !createUserError, createUserError?.message);
        
        if (createdUser) {
            // Verificar que el usuario tiene el rol correcto
            const { data: userWithRole, error: userRoleError } = await supabase
                .from('users')
                .select('id, email, role_id, roles(name)')
                .eq('id', createdUser.id)
                .single();
            
            logTest('Roles - Usuario USER tiene rol correcto', 
                    !userRoleError && userWithRole?.roles?.name === 'USER', 
                    userRoleError?.message);
            
            // Limpiar - eliminar usuario de prueba
            await supabase.from('users').delete().eq('id', createdUser.id);
        }
    } catch (err) {
        logTest('Roles - Crear usuario USER', false, err.message);
    }
    
    // Test 3: Validar permisos por rol
    console.log('\n🔐 Probando sistema de permisos...');
    
    try {
        const { data: rolePermissions, error: permissionsError } = await supabase
            .from('role_permissions')
            .select('role_id, permission_id, roles(name), permissions(name, resource, action)')
            .order('roles(name)');
        
        logTest('Roles - Sistema de permisos configurado', !permissionsError && rolePermissions?.length > 0, 
                permissionsError?.message || `Permisos encontrados: ${rolePermissions?.length || 0}`);
        
        if (rolePermissions && rolePermissions.length > 0) {
            // Verificar que ADMIN tiene más permisos que otros roles
            const adminPermissions = rolePermissions.filter(rp => rp.roles?.name === 'ADMIN');
            const managerPermissions = rolePermissions.filter(rp => rp.roles?.name === 'MANAGER');
            const userPermissions = rolePermissions.filter(rp => rp.roles?.name === 'USER');
            
            logTest('Roles - ADMIN tiene permisos configurados', adminPermissions.length > 0, 
                    `ADMIN permisos: ${adminPermissions.length}`);
            logTest('Roles - Jerarquía de permisos correcta', 
                    adminPermissions.length >= managerPermissions.length && 
                    managerPermissions.length >= userPermissions.length,
                    `ADMIN: ${adminPermissions.length}, MANAGER: ${managerPermissions.length}, USER: ${userPermissions.length}`);
        }
    } catch (err) {
        logTest('Roles - Sistema de permisos configurado', false, err.message);
    }
    
    // Test 4: Validar integridad de la tabla permissions
    try {
        const { data: permissions, error: permError } = await supabase
            .from('permissions')
            .select('id, name, resource, action, category')
            .order('category, resource, action');
        
        logTest('Roles - Permisos base configurados', !permError && permissions?.length > 0, 
                permError?.message || `Permisos base: ${permissions?.length || 0}`);
        
        if (permissions && permissions.length > 0) {
            // Verificar que hay permisos para los recursos principales
            const categoryPerms = permissions.filter(p => p.resource === 'categories');
            const inventoryPerms = permissions.filter(p => p.resource === 'inventory');
            const userPerms = permissions.filter(p => p.resource === 'users');
            
            logTest('Roles - Permisos de categorías', categoryPerms.length > 0, `Permisos categorías: ${categoryPerms.length}`);
            logTest('Roles - Permisos de inventario', inventoryPerms.length > 0, `Permisos inventario: ${inventoryPerms.length}`);
            logTest('Roles - Permisos de usuarios', userPerms.length > 0, `Permisos usuarios: ${userPerms.length}`);
        }
    } catch (err) {
        logTest('Roles - Permisos base configurados', false, err.message);
    }
}

// SECCIÓN 7: VALIDACIÓN DE PERFORMANCE
async function validatePerformance() {
    console.log('\n⚡ SECCIÓN 7: VALIDACIÓN DE PERFORMANCE');
    console.log('='.repeat(60));
    
    // Test 1: Tiempo de respuesta health endpoint
    try {
        const startTime = Date.now();
        const response = await fetch(`${PRODUCTION_URL}/api/health`);
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        logTest('Performance - Health endpoint < 2000ms', responseTime < 2000, `Tiempo: ${responseTime}ms`);
    } catch (err) {
        logTest('Performance - Health endpoint < 2000ms', false, err.message);
    }
    
    // Test 2: Consulta de base de datos
    try {
        const startTime = Date.now();
        const { data, error } = await supabase
            .from('users')
            .select('id, email, name')
            .limit(10);
        const endTime = Date.now();
        const queryTime = endTime - startTime;
        
        logTest('Performance - Query usuarios < 1000ms', !error && queryTime < 1000, `Tiempo: ${queryTime}ms`);
    } catch (err) {
        logTest('Performance - Query usuarios < 1000ms', false, err.message);
    }
}

// FUNCIÓN PRINCIPAL
async function runCompleteValidation() {
    console.log('🚀 LUMO - VALIDACIÓN 100% COMPLETA EN PRODUCCIÓN');
    console.log('='.repeat(80));
    console.log(`🕐 Iniciado: ${new Date().toLocaleString()}`);
    console.log(`🌐 URL: ${PRODUCTION_URL}`);
    console.log(`📊 Base de datos: ${SUPABASE_URL}`);
    console.log('='.repeat(80));
    
    // Ejecutar todas las secciones
    await validateInfrastructure();
    await validateAuthentication();
    await validateCRUD();
    await validateAPIEndpoints();
    await validateIntegrity();
    await validateRolesAndPermissions();
    await validatePerformance();
    
    // Generar reporte final
    console.log('\n' + '='.repeat(80));
    console.log('📊 REPORTE FINAL DE VALIDACIÓN');
    console.log('='.repeat(80));
    console.log(`✅ Pruebas exitosas: ${testResults.passed}`);
    console.log(`❌ Pruebas fallidas: ${testResults.failed}`);
    console.log(`📈 Total de pruebas: ${testResults.total}`);
    console.log(`🎯 Porcentaje de éxito: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    if (testResults.failed === 0) {
        console.log('\n🎉 ¡VALIDACIÓN 100% EXITOSA!');
        console.log('✅ LUMO está funcionando perfectamente en producción');
        console.log('✅ Todas las funcionalidades están operativas');
        console.log('✅ Sistema listo para uso en producción');
    } else {
        console.log('\n⚠️  Se encontraron algunos problemas:');
        testResults.details
            .filter(test => !test.passed)
            .forEach(test => {
                console.log(`   ❌ ${test.name}: ${test.details}`);
            });
    }
    
    // Guardar reporte en archivo
    const reportPath = path.join(__dirname, '..', 'production-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        environment: 'production',
        url: PRODUCTION_URL,
        database: SUPABASE_URL,
        results: testResults
    }, null, 2));
    
    console.log(`\n📁 Reporte guardado en: ${reportPath}`);
    console.log(`🕐 Finalizado: ${new Date().toLocaleString()}`);
    
    return testResults.failed === 0;
}

// Ejecutar validación
if (require.main === module) {
    runCompleteValidation()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { runCompleteValidation }; 