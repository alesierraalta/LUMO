#!/usr/bin/env node

/**
 * Database Environment Fix Script
 * 
 * Este script verifica y corrige problemas con la variable de entorno DATABASE_URL,
 * especialmente el uso de 'prisma://' en lugar de 'postgresql://'.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Log con timestamp
function log(level, ...messages) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}]`, ...messages);
}

// Función principal
function fixDatabaseUrl() {
  log('INFO', '🚀 Starting DATABASE_URL format fix...');
  
  // Obtener la URL de la base de datos
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    log('WARN', '⚠️ DATABASE_URL not defined');
    return false;
  }
  
  log('INFO', `🔍 URL actual: ${dbUrl.substring(0, 12)}...`);
  
  // Verificar si la URL comienza con prisma://
  if (dbUrl.startsWith('prisma://')) {
    log('🔄 Converting DATABASE_URL from prisma:// to postgresql://');
    
    // Extract the host and credentials from the prisma:// URL
    const match = dbUrl.match(/prisma:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
    
    if (!match) {
      log('❌ Failed to parse prisma:// URL format');
      return false;
    }
    
    const [_, username, password, host, port, database] = match;
    
    // Create the postgresql:// URL
    const correctedUrl = `postgresql://${username}:${password}@${host}:${port}/${database}`;
    
    // Establecer la URL corregida en el entorno
    process.env.DATABASE_URL = correctedUrl;
    
    // Mask the password for logging
    const maskedUrl = correctedUrl.replace(/\/\/([^:]+):[^@]+@/, '//\\1:****@');
    log('INFO', `✅ DATABASE_URL corrected: ${maskedUrl}`);
    
    return true;
  } else if (dbUrl.startsWith('postgresql://')) {
    log('INFO', '✅ DATABASE_URL already in correct format (postgresql://)');
    return true;
  } else {
    log('WARN', `⚠️ DATABASE_URL has unknown format: ${dbUrl.substring(0, 10)}...`);
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

// Export for use in other scripts
module.exports = { fixDatabaseUrl }; 