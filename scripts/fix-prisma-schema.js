#!/usr/bin/env node

/**
 * Script para asegurar que el schema de Prisma esté configurado correctamente
 * Este script se ejecuta durante el build para forzar PostgreSQL en producción
 */

const fs = require('fs');
const path = require('path');

console.log('[PRISMA SCHEMA FIX] 🚀 INICIANDO verificación del schema...');

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');

// Detectar si estamos en producción usando múltiples métodos
const isProduction = 
  process.env.NODE_ENV === 'production' ||
  process.env.CHOREO_DEPLOYMENT === 'true' ||
  process.env.DATABASE_URL?.includes('postgres') ||
  process.env.DATABASE_URL?.includes('postgresql') ||
  process.argv.includes('--force-postgresql');

console.log('[PRISMA SCHEMA FIX] 🔍 DETECCIÓN DE ENTORNO:');
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'not-set'}`);
console.log(`  CHOREO_DEPLOYMENT: ${process.env.CHOREO_DEPLOYMENT || 'not-set'}`);
console.log(`  DATABASE_URL exists: ${process.env.DATABASE_URL ? 'YES' : 'NO'}`);
if (process.env.DATABASE_URL) {
  const urlType = process.env.DATABASE_URL.includes('postgres') ? 'PostgreSQL' : 
                  process.env.DATABASE_URL.includes('file:') ? 'SQLite' : 'Unknown';
  console.log(`  DATABASE_URL type: ${urlType}`);
  console.log(`  DATABASE_URL preview: ${process.env.DATABASE_URL.substring(0, 20)}...`);
}
console.log(`  Command args: ${process.argv.join(' ')}`);
console.log(`  🎯 PRODUCTION DETECTED: ${isProduction ? 'YES' : 'NO'}`);

if (!fs.existsSync(schemaPath)) {
  console.error('[PRISMA SCHEMA FIX] ❌ Schema Prisma no encontrado en:', schemaPath);
  process.exit(1);
}

try {
  let schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Mostrar contenido relevante del schema
  const lines = schemaContent.split('\n');
  console.log('[PRISMA SCHEMA FIX] 📋 SCHEMA ACTUAL:');
  lines.forEach((line, index) => {
    if (line.includes('provider') || line.includes('datasource')) {
      console.log(`  ${index + 1}: ${line.trim()}`);
    }
  });
  
  const currentProvider = schemaContent.match(/provider\s*=\s*"(sqlite|postgresql)"/);
  
  if (!currentProvider) {
    console.error('[PRISMA SCHEMA FIX] ❌ No se pudo encontrar provider en schema.prisma');
    console.log('[PRISMA SCHEMA FIX] 📄 Contenido del datasource:');
    const datasourceMatch = schemaContent.match(/datasource\s+db\s*{[^}]+}/s);
    if (datasourceMatch) {
      console.log(datasourceMatch[0]);
    }
    process.exit(1);
  }

  const currentProviderValue = currentProvider[1];
  console.log(`[PRISMA SCHEMA FIX] 📊 Provider detectado: "${currentProviderValue}"`);
  
  if (isProduction) {
    // En producción, DEBE ser PostgreSQL
    if (currentProviderValue === 'sqlite') {
      console.log('[PRISMA SCHEMA FIX] 🔥 FORZANDO cambio a PostgreSQL para PRODUCCIÓN...');
      
      // Hacer el cambio más robusto
      const newSchemaContent = schemaContent.replace(
        /provider\s*=\s*"sqlite"/g,
        'provider = "postgresql"'
      );
      
      // Verificar que el cambio se hará
      if (newSchemaContent === schemaContent) {
        console.error('[PRISMA SCHEMA FIX] ❌ ERROR: No se pudo cambiar el provider');
        console.log('[PRISMA SCHEMA FIX] Original:', schemaContent.substring(0, 200));
        process.exit(1);
      }
      
      // Escribir el nuevo contenido
      fs.writeFileSync(schemaPath, newSchemaContent);
      console.log('[PRISMA SCHEMA FIX] ✅ Schema MODIFICADO a PostgreSQL');
      
      // VERIFICACIÓN CRÍTICA
      const verifyContent = fs.readFileSync(schemaPath, 'utf8');
      const newProvider = verifyContent.match(/provider\s*=\s*"(sqlite|postgresql)"/);
      
      if (!newProvider) {
        console.error('[PRISMA SCHEMA FIX] ❌ VERIFICACIÓN FALLÓ: No se encontró provider después del cambio');
        process.exit(1);
      }
      
      if (newProvider[1] !== 'postgresql') {
        console.error('[PRISMA SCHEMA FIX] ❌ VERIFICACIÓN FALLÓ: Provider sigue siendo', newProvider[1]);
        process.exit(1);
      }
      
      console.log(`[PRISMA SCHEMA FIX] ✅ VERIFICACIÓN EXITOSA: provider = "${newProvider[1]}"`);
      
      // Mostrar las líneas modificadas
      const verifyLines = verifyContent.split('\n');
      console.log('[PRISMA SCHEMA FIX] 📋 SCHEMA DESPUÉS DEL CAMBIO:');
      verifyLines.forEach((line, index) => {
        if (line.includes('provider') || line.includes('datasource')) {
          console.log(`  ${index + 1}: ${line.trim()}`);
        }
      });
      
    } else {
      console.log('[PRISMA SCHEMA FIX] ✅ Schema ya está configurado para PostgreSQL');
    }
  } else {
    // En desarrollo, informar del estado
    console.log('[PRISMA SCHEMA FIX] 🛠️ Modo desarrollo detectado - manteniendo configuración actual');
    console.log(`[PRISMA SCHEMA FIX] ℹ️ Schema configurado para: ${currentProviderValue}`);
  }

  console.log(`[PRISMA SCHEMA FIX] 🌍 RESUMEN - Entorno: ${isProduction ? 'PRODUCCIÓN' : 'DESARROLLO'}`);

} catch (error) {
  console.error('[PRISMA SCHEMA FIX] ❌ ERROR CRÍTICO:', error.message);
  console.error(error.stack);
  process.exit(1);
}

console.log('[PRISMA SCHEMA FIX] ✅ Proceso completado exitosamente'); 