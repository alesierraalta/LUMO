#!/usr/bin/env node

/**
 * Script para preparar archivos para despliegue en Choreo
 * Asegura que todos los scripts tengan permisos de ejecución
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Preparando archivos para Choreo...');

// Detectar sistema operativo
const isWindows = process.platform === 'win32';

function execute(command, options = {}) {
  try {
    console.log(`⚙️ Ejecutando: ${command}`);
    const output = execSync(command, { 
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options
    });
    console.log(`✅ Completado: ${command}`);
    return output;
  } catch (error) {
    console.error(`❌ Error: ${command}`);
    console.error(error.message);
    if (!options.continueOnError) {
      process.exit(1);
    }
    return null;
  }
}

// Funciones para trabajar con archivos y directorios
function setExecutablePermission(filePath) {
  if (!isWindows) {
    try {
      fs.chmodSync(filePath, '755');
    } catch (error) {
      console.error(`No se pudieron establecer permisos para ${filePath}: ${error}`);
    }
  }
}

function processDirectory(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    entries.forEach(entry => {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        processDirectory(fullPath);
      } else if (entry.name.endsWith('.js') || entry.name.endsWith('.sh')) {
        setExecutablePermission(fullPath);
        console.log(`✓ Permisos asignados: ${fullPath}`);
      }
    });
  } catch (error) {
    console.error(`Error al procesar directorio ${dirPath}: ${error}`);
  }
}

// Establecer permisos para scripts
console.log('📁 Estableciendo permisos para scripts...');
if (!isWindows) {
  try {
    execute('chmod +x scripts/*.js', { continueOnError: true });
    execute('chmod +x *.sh', { continueOnError: true });
    execute('chmod +x build-fast.sh', { continueOnError: true });
  } catch (error) {
    console.error('Error al establecer permisos:', error);
  }
} else {
  console.log('En Windows, saltando establecimiento de permisos...');
  processDirectory(path.join(process.cwd(), 'scripts'));
}

// Finalizar
console.log('✅ Preparación para Choreo completada!'); 