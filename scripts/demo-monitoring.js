#!/usr/bin/env node

/**
 * DEMO DEL SISTEMA DE MONITOREO
 * Simulación de servidor Choreo para demostrar el monitoreo
 */

const http = require('http');
const path = require('path');

// Simular respuestas de Choreo
const choreoResponses = {
  '/api/health': {
    status: 200,
    body: JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'LUMO Inventory System',
      version: '1.0.0',
      buildFix: 'ultra-aggressive-working'
    })
  },
  '/api/categories': {
    status: 200,
    body: JSON.stringify({
      success: true,
      data: [
        { id: 1, name: 'Electronics', description: 'Electronic items' },
        { id: 2, name: 'Clothing', description: 'Apparel and accessories' }
      ],
      message: 'Categories retrieved successfully - No Supabase build errors!'
    })
  },
  '/api/auth/me': {
    status: 200,
    body: JSON.stringify({
      user: {
        id: 'demo-user-123',
        email: 'demo@lumo.com',
        role: 'ADMIN'
      },
      authenticated: true
    })
  },
  '/': {
    status: 200,
    body: `
<!DOCTYPE html>
<html>
<head>
  <title>LUMO Inventory - Demo Choreo</title>
</head>
<body>
  <h1>🎉 LUMO Inventory System</h1>
  <p>✅ Ultra Build Fix Working</p>
  <p>✅ No Supabase Configuration Errors</p>
  <p>✅ Production Ready</p>
  <p>🚀 Choreo Deployment Successful</p>
</body>
</html>
    `
  }
};

// Crear servidor de demo
const server = http.createServer((req, res) => {
  const url = req.url;
  const response = choreoResponses[url];
  
  // Simular latencia realista
  const delay = Math.random() * 200 + 50; // 50-250ms
  
  setTimeout(() => {
    if (response) {
      res.writeHead(response.status, {
        'Content-Type': url === '/' ? 'text/html' : 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Build-Mode': 'production',
        'X-Supabase-Fix': 'ultra-aggressive'
      });
      res.end(response.body);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  }, delay);
});

// Función para ejecutar demo completo
async function runDemo() {
  const port = 3001;
  
  console.log('🎬 [DEMO] Iniciando demostración del sistema de monitoreo...');
  console.log('='.repeat(70));
  
  // Iniciar servidor de demo
  server.listen(port, () => {
    console.log(`🚀 Servidor demo iniciado en http://localhost:${port}`);
    console.log('📡 Simulando respuestas de Choreo...');
    console.log('');
    
    // Ejecutar monitoreo después de un momento
    setTimeout(async () => {
      console.log('🔍 Ejecutando monitoreo de Supabase Build Fix...');
      console.log('');
      
      try {
        // Importar y ejecutar el monitor
        const SupabaseBuildFixMonitor = require('./monitor-supabase-fix.js');
        const monitor = new SupabaseBuildFixMonitor(`http://localhost:${port}`);
        
        const results = await monitor.runMonitoring();
        
        console.log('\\n' + '='.repeat(70));
        console.log('🎉 DEMO COMPLETADO');
        console.log('='.repeat(70));
        
        if (results.buildFixWorking) {
          console.log('✅ El sistema de monitoreo detectó que el Ultra Build Fix funciona correctamente');
          console.log('✅ No se encontraron errores de configuración de Supabase');
          console.log('✅ Todos los endpoints críticos responden correctamente');
          console.log('✅ Sistema listo para producción en Choreo');
        } else {
          console.log('⚠️ Se detectaron algunos problemas en el monitoreo');
        }
        
        console.log('\\n📊 Estadísticas del demo:');
        console.log(`   📡 Endpoints probados: ${results.endpointTests.length}`);
        console.log(`   ✅ Exitosos: ${results.endpointTests.filter(t => t.success).length}`);
        console.log(`   ❌ Fallidos: ${results.endpointTests.filter(t => !t.success).length}`);
        console.log(`   🚨 Errores de Supabase: ${results.supabaseErrors.length}`);
        
        console.log('\\n💡 Próximos pasos:');
        console.log('   1. Configurar URL real de Choreo: npm run monitor:setup');
        console.log('   2. Ejecutar monitoreo post-deploy: npm run monitor:quick');
        console.log('   3. Monitoreo continuo: npm run monitor:full');
        
      } catch (error) {
        console.error('❌ Error en demo:', error.message);
      } finally {
        server.close();
        process.exit(0);
      }
      
    }, 2000);
  });
}

// Función para mostrar capacidades del sistema
function showCapabilities() {
  console.log('🔍 CAPACIDADES DEL SISTEMA DE MONITOREO');
  console.log('='.repeat(70));
  console.log('');
  console.log('🎯 Detección de Errores de Supabase:');
  console.log('   ✅ "Missing Supabase configuration"');
  console.log('   ✅ "Failed to collect page data"');
  console.log('   ✅ "Supabase client not initialized"');
  console.log('');
  console.log('🏥 Health Checks:');
  console.log('   ✅ /api/health (crítico)');
  console.log('   ✅ /api/categories (crítico)');
  console.log('   ✅ /api/auth/me (no crítico)');
  console.log('   ✅ / (no crítico)');
  console.log('');
  console.log('⚡ Análisis de Performance:');
  console.log('   ✅ Tiempos de respuesta');
  console.log('   ✅ Disponibilidad de endpoints');
  console.log('   ✅ Detección de lentitud');
  console.log('');
  console.log('🚨 Sistema de Alertas:');
  console.log('   🚨 CRITICAL: Aplicación caída');
  console.log('   ⚠️ HIGH: Errores de Supabase');
  console.log('   💡 MEDIUM: Performance lenta');
  console.log('   ✅ INFO: Todo funcionando');
  console.log('');
  console.log('📊 Reportes:');
  console.log('   ✅ JSON detallado');
  console.log('   ✅ Reporte de texto');
  console.log('   ✅ Logs de alertas');
  console.log('   ✅ Recomendaciones de acción');
  console.log('');
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--capabilities')) {
    showCapabilities();
  } else {
    runDemo();
  }
}

module.exports = { runDemo, showCapabilities }; 