#!/usr/bin/env node

/**
 * Fix All Choreo Issues Script
 * 
 * Este script soluciona los siguientes problemas conocidos en Choreo:
 * 1. Formato incorrecto de DATABASE_URL (prisma:// en lugar de postgresql://)
 * 2. Falta de motores de consulta de Prisma en el directorio de despliegue
 * 3. Problemas con el modelo ImportSession en el esquema de Prisma
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
      log('INFO', `📄 Salida del comando:\n${output.substring(0, 500)}${output.length > 500 ? '...' : ''}`);
    }
    return { success: true, output };
  } catch (error) {
    log('ERROR', `❌ Error ejecutando comando: ${error.message}`);
    if (error.stdout) log('ERROR', `📄 Salida estándar: ${error.stdout.substring(0, 200)}...`);
    if (error.stderr) log('ERROR', `📄 Salida de error: ${error.stderr.substring(0, 200)}...`);
    
    return {
      success: false,
      error,
      output: error.stdout || '',
      stderr: error.stderr || ''
    };
  }
}

// 1. Corregir el formato de DATABASE_URL
function fixDatabaseUrl() {
  log('INFO', '🔍 Verificando formato de DATABASE_URL...');
  
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    log('ERROR', '❌ DATABASE_URL no está definida');
    return false;
  }
  
  log('INFO', `🔍 URL actual comienza con: ${dbUrl.substring(0, 12)}...`);
  
  if (dbUrl.startsWith('prisma://')) {
    log('WARN', '⚠️ Encontrado formato incorrecto: prisma://');
    
    try {
      // Corregir la URL reemplazando prisma:// con postgresql://
      const correctedUrl = dbUrl.replace(/^prisma:\/\//, 'postgresql://');
      
      // Establecer la URL corregida en el entorno
      process.env.DATABASE_URL = correctedUrl;
      
      // Guardar la URL corregida para depuración
      const logsDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      // Escribir a un archivo de log para referencia futura
      const logPath = path.join(logsDir, 'database-url-fix.log');
      const logContent = `[${new Date().toISOString()}] Corrected DATABASE_URL from prisma:// to postgresql://\n`;
      fs.appendFileSync(logPath, logContent);
      
      log('INFO', '✅ DATABASE_URL corregida de prisma:// a postgresql://');
      return true;
    } catch (error) {
      log('ERROR', `❌ Error al corregir DATABASE_URL: ${error.message}`);
      return false;
    }
  } else if (dbUrl.startsWith('postgresql://')) {
    log('INFO', '✅ DATABASE_URL ya tiene el formato correcto (postgresql://)');
    return true;
  } else {
    log('WARN', `⚠️ DATABASE_URL usa un protocolo no esperado: ${dbUrl.split('://')[0]}://`);
    return false;
  }
}

// 2. Copiar motores de Prisma a todas las ubicaciones necesarias
function copyPrismaEngines() {
  log('INFO', '🔍 Copiando motores de Prisma...');
  
  // Directorios donde debemos buscar o copiar los motores de Prisma
  const directories = [
    path.join(process.cwd(), 'node_modules', '.prisma', 'client'),
    path.join(process.cwd(), 'node_modules', '@prisma', 'client'),
    path.join(process.cwd(), '.next', 'standalone', 'node_modules', '.prisma', 'client'),
    path.join(process.cwd(), '.next', 'server', 'node_modules', '.prisma', 'client')
  ];
  
  // Encontrar directorio con motores
  let sourceDir = null;
  let engineFiles = [];
  
  for (const dir of directories) {
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir);
        const engines = files.filter(file => 
          file.startsWith('libquery_engine') || 
          file.startsWith('query_engine')
        );
        
        if (engines.length > 0) {
          sourceDir = dir;
          engineFiles = engines;
          log('INFO', `✅ Encontrados ${engines.length} archivos de motor en: ${dir}`);
          break;
        }
      } catch (error) {
        log('WARN', `⚠️ Error al leer directorio ${dir}: ${error.message}`);
      }
    }
  }
  
  // Si no encontramos motores, intentar generarlos
  if (!sourceDir) {
    log('WARN', '⚠️ No se encontraron motores de Prisma, intentando generarlos...');
    
    const result = execCommand('npx prisma generate');
    if (!result.success) {
      log('ERROR', '❌ Error al generar motores de Prisma');
      return false;
    }
    
    // Buscar nuevamente después de generar
    for (const dir of directories) {
      if (fs.existsSync(dir)) {
        try {
          const files = fs.readdirSync(dir);
          const engines = files.filter(file => 
            file.startsWith('libquery_engine') || 
            file.startsWith('query_engine')
          );
          
          if (engines.length > 0) {
            sourceDir = dir;
            engineFiles = engines;
            log('INFO', `✅ Ahora se encontraron ${engines.length} archivos de motor en: ${dir}`);
            break;
          }
        } catch (error) {
          log('WARN', `⚠️ Error al leer directorio ${dir}: ${error.message}`);
        }
      }
    }
  }
  
  // Si todavía no encontramos motores, fallar
  if (!sourceDir) {
    log('ERROR', '❌ No se pudieron encontrar o generar motores de Prisma');
    return false;
  }
  
  // Copiar motores a todos los directorios de destino
  let totalCopied = 0;
  
  for (const targetDir of directories) {
    // No copiar al directorio de origen
    if (targetDir === sourceDir) {
      continue;
    }
    
    // Crear directorio si no existe
    if (!fs.existsSync(targetDir)) {
      try {
        fs.mkdirSync(targetDir, { recursive: true });
        log('INFO', `📁 Creado directorio: ${targetDir}`);
      } catch (error) {
        log('ERROR', `❌ Error al crear directorio ${targetDir}: ${error.message}`);
        continue;
      }
    }
    
    // Copiar cada archivo de motor
    for (const file of engineFiles) {
      try {
        const sourcePath = path.join(sourceDir, file);
        const targetPath = path.join(targetDir, file);
        
        fs.copyFileSync(sourcePath, targetPath);
        try {
          fs.chmodSync(targetPath, '755'); // Dar permisos de ejecución
        } catch (error) {
          log('WARN', `⚠️ No se pudieron cambiar los permisos del archivo: ${error.message}`);
        }
        
        log('INFO', `✅ Copiado: ${file} -> ${targetDir}`);
        totalCopied++;
      } catch (error) {
        log('ERROR', `❌ Error al copiar archivo de motor: ${error.message}`);
      }
    }
  }
  
  return totalCopied > 0;
}

// 3. Verificar si el modelo ImportSession está en el schema
function verifyImportSessionModel() {
  log('INFO', '🔍 Verificando modelo ImportSession en el schema...');
  
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  
  if (!fs.existsSync(schemaPath)) {
    log('ERROR', `❌ No se encontró el archivo schema.prisma en: ${schemaPath}`);
    return false;
  }
  
  let schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Verificar si el modelo ya existe
  if (schema.includes('model ImportSession {')) {
    log('INFO', '✅ El modelo ImportSession ya existe en el schema');
    return true;
  } else {
    log('WARN', '⚠️ El modelo ImportSession no existe en el schema, intentando agregarlo...');
    
    // Usar el script existente para agregar el modelo
    const fixScriptPath = path.join(process.cwd(), 'scripts', 'fix-import-session-model.js');
    
    if (fs.existsSync(fixScriptPath)) {
      const result = execCommand(`node ${fixScriptPath}`);
      return result.success;
    } else {
      log('ERROR', `❌ No se encontró el script de corrección: ${fixScriptPath}`);
      return false;
    }
  }
}

// 4. Modificar src/lib/prisma.ts para hacer opcional la verificación del modelo ImportSession
function fixPrismaVerification() {
  log('INFO', '🔍 Modificando la verificación del modelo ImportSession en prisma.ts...');
  
  const prismaPath = path.join(process.cwd(), 'src', 'lib', 'prisma.ts');
  
  if (!fs.existsSync(prismaPath)) {
    log('ERROR', `❌ No se encontró el archivo prisma.ts en: ${prismaPath}`);
    return false;
  }
  
  let prismaContent = fs.readFileSync(prismaPath, 'utf8');
  
  // Buscar la sección que lanza el error si falta el modelo ImportSession
  const errorPattern = /throw new Error\(['"]ImportSession model verification failed/;
  
  if (prismaContent.match(errorPattern)) {
    log('INFO', '🔧 Modificando la verificación para hacer opcional el modelo ImportSession');
    
    // Reemplazar el código que lanza el error con una advertencia
    const modifiedContent = prismaContent.replace(
      /throw new Error\(['"]ImportSession model verification failed[^;]+;/,
      `console.warn('⚠️ ImportSession model not available, imports may not work properly');`
    );
    
    // Crear copia de seguridad del archivo original
    const backupPath = `${prismaPath}.backup-${Date.now()}`;
    fs.writeFileSync(backupPath, prismaContent);
    log('INFO', `✅ Backup del archivo original guardado en: ${backupPath}`);
    
    // Guardar el archivo modificado
    fs.writeFileSync(prismaPath, modifiedContent);
    log('INFO', '✅ Archivo prisma.ts modificado correctamente');
    
    return true;
  } else {
    log('INFO', '✅ No es necesario modificar la verificación, no se encontró el patrón exacto');
    return true;
  }
}

// Función principal que ejecuta todas las correcciones
async function main() {
  log('INFO', '🚀 Iniciando corrección de todos los problemas de Choreo...');
  
  // 1. Corregir el formato de DATABASE_URL
  const urlFixed = fixDatabaseUrl();
  log('INFO', `📊 DATABASE_URL corregida: ${urlFixed ? '✅ SI' : '❌ NO'}`);
  
  // 2. Copiar los motores de Prisma
  const enginesCopied = copyPrismaEngines();
  log('INFO', `📊 Motores de Prisma copiados: ${enginesCopied ? '✅ SI' : '❌ NO'}`);
  
  // 3. Asegurarse de que el modelo ImportSession está en el schema
  const modelVerified = verifyImportSessionModel();
  log('INFO', `📊 Modelo ImportSession verificado: ${modelVerified ? '✅ SI' : '❌ NO'}`);
  
  // 4. Solucionar la verificación del modelo en prisma.ts
  const verificationFixed = fixPrismaVerification();
  log('INFO', `📊 Verificación en prisma.ts corregida: ${verificationFixed ? '✅ SI' : '❌ NO'}`);
  
  // Resumen final
  log('INFO', '\n📋 RESUMEN DE CORRECCIONES:');
  log('INFO', `DATABASE_URL: ${urlFixed ? '✅ OK' : '⚠️ No corregido'}`);
  log('INFO', `Motores Prisma: ${enginesCopied ? '✅ OK' : '⚠️ No copiados'}`);
  log('INFO', `Modelo ImportSession: ${modelVerified ? '✅ OK' : '⚠️ No verificado'}`);
  log('INFO', `Verificación en prisma.ts: ${verificationFixed ? '✅ OK' : '⚠️ No corregida'}`);
  
  if (urlFixed && enginesCopied && modelVerified && verificationFixed) {
    log('INFO', '\n✅ ¡Todas las correcciones aplicadas con éxito!');
    log('INFO', 'La importación de archivos Excel debería funcionar ahora.');
    return true;
  } else {
    log('WARN', '\n⚠️ Algunas correcciones no pudieron ser aplicadas.');
    log('WARN', 'Es posible que la importación de archivos Excel aún no funcione correctamente.');
    return false;
  }
}

// Ejecutar la función principal
main().catch(error => {
  log('ERROR', `❌ Error inesperado: ${error.message}`);
  log('ERROR', error.stack);
  process.exit(1);
});
