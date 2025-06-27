#!/usr/bin/env node

/**
 * CHOREO MONITORING SETUP
 * Quick setup script for post-deploy monitoring
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function setupMonitoring() {
  console.log('🔧 [MONITORING-SETUP] Configurando monitoreo post-deploy para Choreo');
  console.log('='.repeat(70));
  
  try {
    // Get Choreo URL
    const choreoUrl = await question('📍 Ingresa la URL de tu aplicación en Choreo: ');
    
    if (!choreoUrl || !choreoUrl.startsWith('http')) {
      throw new Error('URL inválida. Debe empezar con http:// o https://');
    }
    
    // Get monitoring duration
    const durationInput = await question('⏱️ Duración del monitoreo en minutos (default: 10): ');
    const duration = durationInput ? parseInt(durationInput) : 10;
    
    if (isNaN(duration) || duration <= 0) {
      throw new Error('Duración inválida. Debe ser un número positivo.');
    }
    
    // Get alert email (optional)
    const alertEmail = await question('📧 Email para alertas (opcional): ');
    
    console.log('\\n✅ Configuración completada:');
    console.log(`   📍 URL: ${choreoUrl}`);
    console.log(`   ⏱️ Duración: ${duration} minutos`);
    console.log(`   📧 Alertas: ${alertEmail || 'No configurado'}`);
    
    // Create environment file
    const envContent = `# Choreo Monitoring Configuration
CHOREO_APP_URL=${choreoUrl}
MONITORING_DURATION=${duration}
${alertEmail ? `ALERT_EMAIL=${alertEmail}` : '# ALERT_EMAIL=your-email@example.com'}
MONITORING_ENABLED=true
`;
    
    const envFile = path.join(__dirname, '../.env.monitoring');
    fs.writeFileSync(envFile, envContent);
    
    console.log(`\\n📝 Configuración guardada en: ${envFile}`);
    
    // Create monitoring directory
    const logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      console.log(`📁 Directorio de logs creado: ${logsDir}`);
    }
    
    // Create quick start script
    const quickStartContent = `#!/bin/bash

# CHOREO MONITORING QUICK START
# Automatically generated configuration

echo "🚀 Iniciando monitoreo post-deploy para Choreo..."
echo "📍 URL: ${choreoUrl}"
echo "⏱️ Duración: ${duration} minutos"
echo ""

# Set environment variables
export CHOREO_APP_URL="${choreoUrl}"

# Start monitoring
node scripts/choreo-post-deploy-monitor.js ${duration}
`;
    
    const quickStartFile = path.join(__dirname, '../start-monitoring.sh');
    fs.writeFileSync(quickStartFile, quickStartContent);
    fs.chmodSync(quickStartFile, '755');
    
    console.log(`🚀 Script de inicio rápido creado: ${quickStartFile}`);
    
    // Create Windows batch file
    const batchContent = `@echo off
REM CHOREO MONITORING QUICK START
REM Automatically generated configuration

echo 🚀 Iniciando monitoreo post-deploy para Choreo...
echo 📍 URL: ${choreoUrl}
echo ⏱️ Duración: ${duration} minutos
echo.

REM Set environment variables
set CHOREO_APP_URL=${choreoUrl}

REM Start monitoring
node scripts/choreo-post-deploy-monitor.js ${duration}
`;
    
    const batchFile = path.join(__dirname, '../start-monitoring.bat');
    fs.writeFileSync(batchFile, batchContent);
    
    console.log(`🪟 Script de Windows creado: ${batchFile}`);
    
    console.log('\\n' + '='.repeat(70));
    console.log('🎉 CONFIGURACIÓN COMPLETADA');
    console.log('='.repeat(70));
    console.log('');
    console.log('📋 Para iniciar el monitoreo, ejecuta uno de estos comandos:');
    console.log('');
    console.log('   🐧 Linux/Mac:');
    console.log('   ./start-monitoring.sh');
    console.log('');
    console.log('   🪟 Windows:');
    console.log('   start-monitoring.bat');
    console.log('');
    console.log('   📦 NPM:');
    console.log('   npm run monitor:choreo');
    console.log('');
    console.log('💡 El monitoreo verificará:');
    console.log('   ✅ Health checks de endpoints críticos');
    console.log('   ✅ Detección de errores de Supabase');
    console.log('   ✅ Análisis de performance');
    console.log('   ✅ Alertas automáticas');
    console.log('');
    console.log('📊 Los resultados se guardarán en:');
    console.log(`   📁 ${logsDir}/choreo-alerts.log`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error en configuración:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run setup
if (require.main === module) {
  setupMonitoring().catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
}

module.exports = setupMonitoring; 