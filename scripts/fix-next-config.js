/**
 * Script para corregir next.config.js
 * 
 * Este script actualiza la configuración de Next.js para que sea compatible
 * con las versiones más recientes y con el despliegue en Choreo.
 */

const fs = require('fs');
const path = require('path');

const configPath = path.join(process.cwd(), 'next.config.js');

console.log('🔍 Verificando configuración de Next.js...');

if (!fs.existsSync(configPath)) {
  console.error('❌ No se encontró el archivo next.config.js');
  process.exit(1);
}

// Leer el archivo actual
let configContent = fs.readFileSync(configPath, 'utf8');
console.log('📄 Archivo next.config.js encontrado');

// Verificar y actualizar la configuración
let needsUpdate = false;

// Reemplazar serverComponentsExternalPackages por serverExternalPackages
if (configContent.includes('serverComponentsExternalPackages')) {
  console.log('⚠️ Encontrada configuración obsoleta: serverComponentsExternalPackages');
  configContent = configContent.replace(
    /serverComponentsExternalPackages/g,
    'serverExternalPackages'
  );
  needsUpdate = true;
}

// Asegurar que output está configurado como standalone
if (!configContent.includes('output:') || !configContent.includes('standalone')) {
  console.log('⚠️ Configuración de output:standalone no encontrada o incorrecta');
  
  // Si ya hay un objeto experimental, agregar output a ese objeto
  if (configContent.includes('experimental:') && configContent.includes('{')) {
    configContent = configContent.replace(
      /experimental:\s*{/,
      "experimental: {\n    output: 'standalone',"
    );
  } 
  // Si no hay experimental, agregarlo con output
  else if (!configContent.includes('experimental:')) {
    configContent = configContent.replace(
      /module\.exports\s*=\s*{/,
      "module.exports = {\n  experimental: {\n    output: 'standalone',\n  },"
    );
  }
  needsUpdate = true;
}

// Corregir configuración de optimizeFonts
if (configContent.includes('optimizeFonts')) {
  console.log('⚠️ Encontrada configuración obsoleta: optimizeFonts');
  configContent = configContent.replace(/optimizeFonts\s*:\s*[^,}]+[,]?/g, '');
  needsUpdate = true;
}

// Guardar cambios si es necesario
if (needsUpdate) {
  try {
    fs.writeFileSync(configPath, configContent);
    console.log('✅ Archivo next.config.js actualizado correctamente');
  } catch (error) {
    console.error('❌ Error al guardar el archivo:', error);
    process.exit(1);
  }
} else {
  console.log('✅ La configuración de Next.js es correcta, no se requieren cambios');
}

// Mostrar configuración final
console.log('\n📋 Configuración final:');
console.log(configContent); 