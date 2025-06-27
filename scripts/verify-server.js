#!/usr/bin/env node

/**
 * LUMO Server Verification Script
 * Verifica que el servidor optimizado esté configurado correctamente
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración del servidor LUMO...');

// Verificar archivos necesarios
const files = [
  'lumo-optimized-server.js',
  '.next/standalone/server.js',
  'package.json'
];

let allFilesExist = true;

files.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - Existe`);
  } else {
    console.log(`❌ ${file} - No encontrado`);
    allFilesExist = false;
  }
});

// Verificar configuración del puerto
const validatePort = (port) => {
  const numPort = parseInt(port, 10);
  if (isNaN(numPort) || numPort < 0 || numPort > 65535) {
    return false;
  }
  return true;
};

const envPort = process.env.PORT;
if (envPort) {
  if (validatePort(envPort)) {
    console.log(`✅ PORT=${envPort} - Válido`);
  } else {
    console.log(`⚠️ PORT=${envPort} - Inválido, se usará 8080 por defecto`);
  }
} else {
  console.log(`ℹ️ PORT no definido, se usará 8080 por defecto`);
}

// Verificar package.json
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const startScript = packageJson.scripts?.start;
  
  if (startScript === 'node lumo-optimized-server.js') {
    console.log(`✅ Script start configurado correctamente`);
  } else {
    console.log(`⚠️ Script start: ${startScript} - Debería ser 'node lumo-optimized-server.js'`);
  }
} catch (error) {
  console.log(`❌ Error leyendo package.json: ${error.message}`);
  allFilesExist = false;
}

// Verificar estructura del proyecto
const directories = [
  '.next',
  'src',
  'public'
];

directories.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir}/ - Directorio existe`);
  } else {
    console.log(`⚠️ ${dir}/ - Directorio no encontrado`);
  }
});

// Resumen final
console.log('\n📊 Resumen de verificación:');

if (allFilesExist) {
  console.log('✅ Todos los archivos necesarios están presentes');
  console.log('✅ El servidor está listo para ejecutarse');
  console.log('\n🚀 Para iniciar el servidor:');
  console.log('   npm start');
  console.log('   # o directamente:');
  console.log('   node lumo-optimized-server.js');
} else {
  console.log('❌ Faltan archivos necesarios');
  console.log('💡 Sugerencias:');
  console.log('   1. Ejecutar: npm run build');
  console.log('   2. Verificar que el build se completó correctamente');
  console.log('   3. Verificar que existe .next/standalone/server.js');
}

console.log('\n📝 Variables de entorno importantes:');
console.log(`   PORT: ${process.env.PORT || 'no definido (usará 8080)'}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'no definido'}`);

process.exit(allFilesExist ? 0 : 1); 