#!/usr/bin/env node

/**
 * Copy Prisma Engines Script
 * 
 * Este script busca y copia los archivos de motor de consulta de Prisma
 * a todas las ubicaciones necesarias dentro del proyecto para garantizar
 * que la funcionalidad de Prisma ORM funcione correctamente.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Log con timestamp
function log(level, ...messages) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}]`, ...messages);
}

// Función para ejecutar comandos con manejo de errores
function execCommand(command, options = {}) {
  try {
    log('INFO', `⚙️ Ejecutando: ${command}`);
    const output = execSync(command, {
      encoding: 'utf8',
      ...options
    });
    if (output && output.trim() !== '') {
      log('INFO', `📄 Salida del comando:\n${output}`);
    }
    return output;
  } catch (error) {
    log('ERROR', `❌ Error ejecutando comando: ${error.message}`);
    if (error.stdout) log('ERROR', `📄 Salida estándar: ${error.stdout}`);
    if (error.stderr) log('ERROR', `📄 Salida de error: ${error.stderr}`);
    
    if (options.throwOnError !== false) {
      throw error;
    }
    return null;
  }
}

// Función para buscar archivos de motor de Prisma
function findEngineFiles() {
  log('INFO', '🔍 Buscando archivos de motor de Prisma...');
  
  const possiblePaths = [
    path.join(process.cwd(), 'node_modules', '.prisma', 'client'),
    path.join(process.cwd(), 'node_modules', '@prisma', 'client'),
    path.join(process.cwd(), '.next', 'server', 'node_modules', '.prisma', 'client')
  ];
  
  let engineFiles = [];
  let sourcePath = null;
  
  for (const dir of possiblePaths) {
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir);
        const engines = files.filter(file => file.startsWith('libquery_engine') || file.startsWith('query_engine'));
        
        if (engines.length > 0) {
          engineFiles = engines;
          sourcePath = dir;
          log('INFO', `✅ Encontrados ${engines.length} archivos de motor en: ${dir}`);
          break;
        }
      } catch (error) {
        log('WARN', `⚠️ Error al leer directorio ${dir}: ${error.message}`);
      }
    }
  }
  
  if (engineFiles.length === 0) {
    log('WARN', '⚠️ No se encontraron archivos de motor de Prisma');
    
    // Intentar generar Prisma para crear los archivos de motor
    try {
      log('INFO', '🔄 Intentando generar archivos de motor con prisma generate...');
      execCommand('npx prisma generate', { stdio: 'inherit' });
      
      // Verificar nuevamente
      for (const dir of possiblePaths) {
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir);
          const engines = files.filter(file => file.startsWith('libquery_engine') || file.startsWith('query_engine'));
          
          if (engines.length > 0) {
            engineFiles = engines;
            sourcePath = dir;
            log('INFO', `✅ Ahora se encontraron ${engines.length} archivos de motor en: ${dir}`);
            break;
          }
        }
      }
    } catch (error) {
      log('ERROR', `❌ Error al generar archivos de motor: ${error.message}`);
    }
  }
  
  return { engineFiles, sourcePath };
}

// Función para copiar motores a todas las ubicaciones necesarias
function copyEngines(engineFiles, sourcePath) {
  log('INFO', '📋 Copiando archivos de motor a todas las ubicaciones necesarias...');
  
  if (engineFiles.length === 0 || !sourcePath) {
    log('ERROR', '❌ No hay archivos de motor para copiar o no se encontró la ruta de origen');
    return false;
  }
  
  const targetDirs = [
    path.join(process.cwd(), 'node_modules', '.prisma', 'client'),
    path.join(process.cwd(), '.next', 'standalone', 'node_modules', '.prisma', 'client'),
    path.join(process.cwd(), '.next', 'server', 'node_modules', '.prisma', 'client'),
    path.join(process.cwd(), 'prisma', 'client')
  ];
  
  // Copiar cada archivo a todos los directorios de destino
  let copiedCount = 0;
  
  for (const targetDir of targetDirs) {
    // Saltar si es el directorio de origen
    if (targetDir === sourcePath) {
      log('INFO', `↪️ Saltando directorio de origen: ${targetDir}`);
      continue;
    }
    
    // Crear directorio si no existe
    if (!fs.existsSync(targetDir)) {
      log('INFO', `📁 Creando directorio: ${targetDir}`);
      try {
        fs.mkdirSync(targetDir, { recursive: true });
      } catch (error) {
        log('ERROR', `❌ Error al crear directorio ${targetDir}: ${error.message}`);
        continue;
      }
    }
    
    // Copiar cada archivo de motor
    for (const file of engineFiles) {
      const source = path.join(sourcePath, file);
      const target = path.join(targetDir, file);
      
      try {
        fs.copyFileSync(source, target);
        fs.chmodSync(target, '755'); // Asegurarse de que sea ejecutable
        log('INFO', `✅ Copiado: ${file} -> ${targetDir}`);
        copiedCount++;
      } catch (error) {
        log('ERROR', `❌ Error al copiar ${file} a ${targetDir}: ${error.message}`);
      }
    }
  }
  
  log('INFO', `📊 Total de archivos copiados: ${copiedCount}`);
  return copiedCount > 0;
}

// Función para crear un vínculo simbólico para asegurar que los archivos de motor estén accesibles
function createEngineSymlinks() {
  log('INFO', '🔄 Verificando si se necesitan enlaces simbólicos para los motores...');
  
  const prismaClientDir = path.join(process.cwd(), 'node_modules', '.prisma', 'client');
  const standaloneClientDir = path.join(process.cwd(), '.next', 'standalone', 'node_modules', '.prisma', 'client');
  
  if (!fs.existsSync(prismaClientDir) || !fs.existsSync(standaloneClientDir)) {
    log('WARN', '⚠️ Directorios de cliente de Prisma no encontrados para crear enlaces');
    return false;
  }
  
  try {
    const files = fs.readdirSync(prismaClientDir);
    const engines = files.filter(file => file.startsWith('libquery_engine') || file.startsWith('query_engine'));
    
    if (engines.length === 0) {
      log('WARN', '⚠️ No se encontraron motores en el directorio de origen para enlazar');
      return false;
    }
    
    // Asegurarse de que el directorio de destino exista
    if (!fs.existsSync(standaloneClientDir)) {
      fs.mkdirSync(standaloneClientDir, { recursive: true });
    }
    
    // Intentar crear enlaces simbólicos si estamos en Linux/Unix
    if (process.platform !== 'win32') {
      for (const engine of engines) {
        const source = path.join(prismaClientDir, engine);
        const target = path.join(standaloneClientDir, engine);
        
        if (!fs.existsSync(target)) {
          try {
            fs.symlinkSync(source, target);
            log('INFO', `✅ Enlace simbólico creado: ${target} -> ${source}`);
          } catch (error) {
            log('WARN', `⚠️ No se pudo crear enlace simbólico para ${engine}: ${error.message}`);
            log('INFO', '🔄 Copiando archivo en su lugar...');
            
            try {
              fs.copyFileSync(source, target);
              fs.chmodSync(target, '755');
              log('INFO', `✅ Archivo copiado como alternativa: ${target}`);
            } catch (copyError) {
              log('ERROR', `❌ Error al copiar ${engine}: ${copyError.message}`);
            }
          }
        }
      }
      
      return true;
    } else {
      log('INFO', '⏩ Omitiendo creación de enlaces simbólicos en Windows');
      return false;
    }
  } catch (error) {
    log('ERROR', `❌ Error al crear enlaces simbólicos: ${error.message}`);
    return false;
  }
}

// Función principal
async function main() {
  log('INFO', '🚀 Iniciando script de copia de motores de Prisma...');
  
  // Buscar archivos de motor
  const { engineFiles, sourcePath } = findEngineFiles();
  
  if (engineFiles.length === 0) {
    log('ERROR', '❌ No se encontraron archivos de motor de Prisma');
    log('INFO', '🔧 Intentando generarlos con prisma generate');
    
    try {
      execCommand('npx prisma generate', { stdio: 'inherit' });
      const result = findEngineFiles();
      
      if (result.engineFiles.length === 0) {
        log('ERROR', '❌ No se pudieron generar archivos de motor');
        process.exit(1);
      } else {
        log('INFO', '✅ Archivos de motor generados exitosamente');
        copyEngines(result.engineFiles, result.sourcePath);
      }
    } catch (error) {
      log('ERROR', `❌ Error al generar archivos de motor: ${error.message}`);
      process.exit(1);
    }
  } else {
    // Copiar archivos de motor encontrados
    copyEngines(engineFiles, sourcePath);
  }
  
  // Intentar crear enlaces simbólicos para asegurar acceso a los archivos
  createEngineSymlinks();
  
  log('INFO', '✅ Script de copia de motores de Prisma completado');
}

// Ejecutar función principal
main().catch(error => {
  log('ERROR', `❌ Error inesperado: ${error.message}`);
  process.exit(1);
}); 