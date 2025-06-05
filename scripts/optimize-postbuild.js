#!/usr/bin/env node

/**
 * Optimiza los procesos post-build combinando operaciones
 * y ejecutándolas de manera más eficiente.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// Identificar si estamos en Windows
const isWindows = os.platform() === 'win32';

console.log('🚀 Iniciando optimización post-build...');

// Función para ejecutar comandos con mejor rendimiento
function execute(command, options = {}) {
  const startTime = Date.now();
  try {
    console.log(`⚙️ Ejecutando: ${command}`);
    const output = execSync(command, { 
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options
    });
    const duration = (Date.now() - startTime) / 1000;
    console.log(`✅ Completado en ${duration.toFixed(2)}s: ${command}`);
    return output;
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    console.error(`❌ Error (${duration.toFixed(2)}s): ${command}`);
    console.error(error.message);
    if (!options.continueOnError) {
      process.exit(1);
    }
    return null;
  }
}

// Combinar todas las operaciones de copia en un solo comando
console.log('📋 Copiando archivos esenciales a standalone...');

// Verificar que la carpeta standalone existe
const standaloneDir = path.join(process.cwd(), '.next/standalone');
if (!fs.existsSync(standaloneDir)) {
  console.log('❌ No se encontró la carpeta standalone, verificando build...');
  process.exit(1);
}

// Ejecutar todas las copias en un solo paso
try {
  // Crear los directorios necesarios de una vez
  console.log('📁 Creando directorios necesarios...');
  fs.mkdirSync(path.join(standaloneDir, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(standaloneDir, 'prisma'), { recursive: true });
  fs.mkdirSync(path.join(standaloneDir, 'node_modules/.prisma/client'), { recursive: true });
  fs.mkdirSync(path.join(standaloneDir, '.next/server/app/api/inventory/import/process/dict'), { recursive: true });
  
  // Copiar scripts en un solo comando (más rápido)
  console.log('📋 Copiando scripts esenciales...');
  
  // Listar todos los scripts relevantes
  const scriptsToCopy = [
    'scripts/fix-database-url.js',
    'scripts/fix-import-session-model.js',
    'scripts/fix-import-session-postgres.js',
    'scripts/fix-import-session-sqlite.js',
    'scripts/run-import-session-migration.js',
    'scripts/import-session-preflight.js',
    'scripts/verify-import-schema.js',
    'scripts/audit-import-session-migrations.js',
    'scripts/verify-environment-config.js',
    'scripts/verify-database-connection.js',
    'scripts/deployment-verification-tests.js',
    'scripts/choreo-preflight.js',
    'scripts/ensure-import-dirs.js'
  ];
  
  // Copiar todos los scripts de una vez
  scriptsToCopy.forEach(scriptPath => {
    const sourcePath = path.join(process.cwd(), scriptPath);
    const destPath = path.join(standaloneDir, scriptPath);
    
    if (fs.existsSync(sourcePath)) {
      // Asegurarse de que el directorio destino existe
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      fs.copyFileSync(sourcePath, destPath);
      
      // Agregar permisos de ejecución (solo en sistemas Unix)
      if (!isWindows) {
        fs.chmodSync(destPath, '755');
      }
    } else {
      console.warn(`⚠️ No se encontró: ${scriptPath}`);
    }
  });
  
  // Copiar directorio prisma completo
  console.log('📋 Copiando esquema Prisma...');
  const prismaSrcDir = path.join(process.cwd(), 'prisma');
  const prismaDestDir = path.join(standaloneDir, 'prisma');
  
  if (fs.existsSync(prismaSrcDir)) {
    // Si estamos en Windows, copiamos archivos individualmente
    if (isWindows) {
      const copyPrismaFiles = (srcDir, destDir) => {
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        
        const entries = fs.readdirSync(srcDir, { withFileTypes: true });
        
        entries.forEach(entry => {
          const srcPath = path.join(srcDir, entry.name);
          const destPath = path.join(destDir, entry.name);
          
          if (entry.isDirectory()) {
            copyPrismaFiles(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        });
      };
      
      copyPrismaFiles(prismaSrcDir, prismaDestDir);
    } else {
      // En Unix podemos usar cp -r
      execute('cp -r prisma/* .next/standalone/prisma/', { continueOnError: true });
    }
  }
  
  // Copiar binarios de Prisma
  console.log('📋 Copiando binarios de Prisma...');
  const prismaBinDir = path.join(process.cwd(), 'node_modules/.prisma/client');
  const prismaBinDestDir = path.join(standaloneDir, 'node_modules/.prisma/client');
  
  if (fs.existsSync(prismaBinDir)) {
    const files = fs.readdirSync(prismaBinDir)
      .filter(file => file.startsWith('libquery_engine'));
      
    files.forEach(file => {
      fs.copyFileSync(
        path.join(prismaBinDir, file),
        path.join(prismaBinDestDir, file)
      );
    });
  }
  
  // Copiar módulos esenciales
  console.log('📋 Copiando módulos de Node esenciales...');
  const serverOnlyDir = path.join(process.cwd(), 'node_modules/server-only');
  const serverOnlyDestDir = path.join(standaloneDir, 'node_modules/server-only');
  
  if (fs.existsSync(serverOnlyDir)) {
    fs.mkdirSync(serverOnlyDestDir, { recursive: true });
    const serverOnlyFiles = fs.readdirSync(serverOnlyDir);
    serverOnlyFiles.forEach(file => {
      fs.copyFileSync(
        path.join(serverOnlyDir, file),
        path.join(serverOnlyDestDir, file)
      );
    });
  }
  
  console.log('✅ Todos los archivos han sido copiados con éxito!');
} catch (error) {
  console.error('❌ Error durante la copia de archivos:', error.message);
  process.exit(1);
}

// Finalizar
console.log('🚀 Proceso post-build optimizado completado!'); 