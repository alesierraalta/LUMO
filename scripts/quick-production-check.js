#!/usr/bin/env node

/**
 * Quick Production Check - LUMO
 * Script rápido para verificar el estado del sistema en producción
 */

const PRODUCTION_URL = 'https://lumo-woad.vercel.app';

async function quickCheck() {
    console.log('🔍 LUMO - Verificación Rápida de Producción');
    console.log('='.repeat(50));
    
    try {
        // Check health endpoint
        console.log('⏳ Verificando health endpoint...');
        const response = await fetch(`${PRODUCTION_URL}/api/health`);
        const data = await response.json();
        
        if (response.ok && data.status === 'healthy') {
            console.log('✅ Sistema operativo');
            console.log(`   📊 Estado: ${data.status}`);
            console.log(`   🗄️  Base de datos: ${data.services?.database || data.database?.connected ? 'UP' : 'DOWN'}`);
            console.log(`   🖥️  Servidor: ${data.services?.server || 'UP'}`);
            console.log(`   🕐 Timestamp: ${data.timestamp}`);
            
            // Quick login page check
            console.log('\n⏳ Verificando página de login...');
            const loginResponse = await fetch(PRODUCTION_URL);
            if (loginResponse.ok) {
                console.log('✅ Página de login accesible');
            } else {
                console.log('❌ Problema con página de login');
            }
            
            console.log('\n🎉 ¡Sistema funcionando correctamente!');
            console.log(`🌐 URL: ${PRODUCTION_URL}`);
            console.log('👤 Admin: alesierraalta@gmail.com / admin123');
            
        } else {
            console.log('❌ Sistema con problemas');
            console.log(`   Estado: ${data.status || 'unknown'}`);
            console.log(`   Error: ${data.error || 'No especificado'}`);
        }
        
    } catch (error) {
        console.log('❌ Error al verificar el sistema');
        console.log(`   Error: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(50));
}

if (require.main === module) {
    quickCheck();
}

module.exports = { quickCheck }; 