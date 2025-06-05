#!/usr/bin/env node

/**
 * Database Environment Fix Script
 * 
 * Este script verifica y corrige problemas con la variable de entorno DATABASE_URL,
 * especialmente el uso de 'prisma://' en lugar de 'postgresql://'.
 */

const fs = require('fs');
const path = require('path');

// Log con timestamp
function log(level, ...messages) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}]`, ...messages);
}

// Función principal
function fixDatabaseUrl() {
  log('INFO', '🔍 Verificando DATABASE_URL...');
  
  // Obtener la URL de la base de datos
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    log('ERROR', '❌ DATABASE_URL no está definida');
    return false;
  }
  
  log('INFO', `🔍 URL actual: ${dbUrl.substring(0, 12)}...`);
  
  // Verificar si la URL comienza con prisma://
  if (dbUrl.startsWith('prisma://')) {
    log('WARN', '⚠️ Encontrado formato incorrecto: prisma://');
    
    try {
      // Corregir la URL reemplazando prisma:// con postgresql://
      const correctedUrl = dbUrl.replace(/^prisma:\/\//, 'postgresql://');
      
      // Establecer la URL corregida en el entorno
      process.env.DATABASE_URL = correctedUrl;
      
      // Guardar la URL corregida para depuración
      const envLocalPath = path.join(process.cwd(), '.env.local');
      const envContent = `# Corregida por fix-database-env.js a ${new Date().toISOString()}\nDATABASE_URL="${correctedUrl}"\n`;
      
      // Crear el directorio logs si no existe
      const logsDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      // Escribir a un archivo de log para referencia futura
      const logPath = path.join(logsDir, 'database-url-fix.log');
      const logContent = `[${new Date().toISOString()}] Corrected DATABASE_URL from prisma:// to postgresql://\n`;
      fs.appendFileSync(logPath, logContent);
      
      // Escribir a .env.local si estamos en desarrollo
      if (process.env.NODE_ENV !== 'production') {
        fs.writeFileSync(envLocalPath, envContent, { flag: 'a' });
        log('INFO', `✅ URL corregida guardada en ${envLocalPath}`);
      }
      
      // Para depuración, imprimir partes de la URL (ocultando credenciales)
      const urlParts = new URL(correctedUrl);
      log('INFO', '🔄 Partes de la URL corregida:');
      log('INFO', `  - Protocolo: ${urlParts.protocol}`);
      log('INFO', `  - Host: ${urlParts.host}`);
      log('INFO', `  - Path: ${urlParts.pathname}`);
      
      log('INFO', '✅ DATABASE_URL corregida de prisma:// a postgresql://');
      
      // Imprimir la URL variable para que pueda ser capturada por scripts externos
      console.log(`DATABASE_URL=${correctedUrl}`);
      
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
    log('INFO', 'ℹ️ Formato esperado: postgresql://usuario:contraseña@host:puerto/basedatos');
    return false;
  }
}

// Verificar si Prisma necesita regeneración
function checkPrismaGeneration() {
  log('INFO', '🔍 Verificando generación de Prisma...');
  
  const clientPath = path.join(process.cwd(), 'node_modules', '.prisma', 'client');
  
  if (!fs.existsSync(clientPath)) {
    log('WARN', '⚠️ Cliente de Prisma no encontrado en:', clientPath);
    log('INFO', '🔧 Deberías ejecutar "npx prisma generate"');
    return false;
  }
  
  // Buscar motores de consulta
  try {
    const files = fs.readdirSync(clientPath);
    const engineFiles = files.filter(file => file.startsWith('libquery_engine') || file.startsWith('query_engine'));
    
    if (engineFiles.length === 0) {
      log('WARN', '⚠️ No se encontraron archivos de motor en:', clientPath);
      log('INFO', '🔧 Deberías ejecutar "npx prisma generate"');
      return false;
    }
    
    log('INFO', `✅ Encontrados ${engineFiles.length} archivos de motor de Prisma`);
    engineFiles.forEach(file => log('INFO', `  - ${file}`));
    return true;
  } catch (error) {
    log('ERROR', `❌ Error al verificar archivos de motor: ${error.message}`);
    return false;
  }
}

// Ejecutar funciones
const urlFixed = fixDatabaseUrl();
const prismaOk = checkPrismaGeneration();

// Reporte final
log('INFO', '📊 Resumen:');
log('INFO', `DATABASE_URL: ${urlFixed ? '✅ OK' : '❌ Requiere atención'}`);
log('INFO', `Cliente Prisma: ${prismaOk ? '✅ OK' : '❌ Requiere atención'}`);

if (urlFixed && prismaOk) {
  log('INFO', '✅ Entorno de base de datos verificado correctamente');
  process.exit(0);
} else {
  log('WARN', '⚠️ Se encontraron problemas con el entorno de base de datos');
  // No fallamos el script, solo reportamos
  process.exit(0);
} 