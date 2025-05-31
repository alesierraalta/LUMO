#!/usr/bin/env node

/**
 * Script para asegurar que el schema de Prisma esté configurado correctamente
 * Este script se ejecuta durante el build para forzar PostgreSQL en producción
 */

const fs = require('fs');
const path = require('path');

console.log('[PRISMA SCHEMA FIX] Verificando configuración del schema...');

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');

// Detectar si estamos en producción usando múltiples métodos
const isProduction = 
  process.env.NODE_ENV === 'production' ||
  process.env.CHOREO_DEPLOYMENT === 'true' ||
  process.env.DATABASE_URL?.includes('postgres') ||
  process.env.DATABASE_URL?.includes('postgresql') ||
  process.argv.includes('--force-postgresql');

console.log('[PRISMA SCHEMA FIX] 🔍 Detección de entorno:');
console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`  CHOREO_DEPLOYMENT: ${process.env.CHOREO_DEPLOYMENT}`);
console.log(`  DATABASE_URL: ${process.env.DATABASE_URL ? 'configurada' : 'no configurada'}`);
console.log(`  DATABASE_URL type: ${process.env.DATABASE_URL?.includes('postgres') ? 'PostgreSQL' : 'Other'}`);
console.log(`  Production detected: ${isProduction}`);

if (!fs.existsSync(schemaPath)) {
  console.error('[PRISMA SCHEMA FIX] ❌ Schema Prisma no encontrado');
  process.exit(1);
}

try {
  let schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const currentProvider = schemaContent.match(/provider\s*=\s*"(sqlite|postgresql)"/);
  
  if (!currentProvider) {
    console.error('[PRISMA SCHEMA FIX] ❌ No se pudo encontrar provider en schema.prisma');
    process.exit(1);
  }

  const currentProviderValue = currentProvider[1];
  console.log(`[PRISMA SCHEMA FIX] 📊 Provider actual: ${currentProviderValue}`);
  
  if (isProduction) {
    // En producción, debe ser PostgreSQL
    if (currentProviderValue === 'sqlite') {
      console.log('[PRISMA SCHEMA FIX] 🔄 FORZANDO cambio a PostgreSQL para producción...');
      schemaContent = schemaContent.replace(
        /provider\s*=\s*"sqlite"/,
        'provider = "postgresql"'
      );
      fs.writeFileSync(schemaPath, schemaContent);
      console.log('[PRISMA SCHEMA FIX] ✅ Schema FORZADO a PostgreSQL');
      
      // Verificar que el cambio se aplicó
      const verifyContent = fs.readFileSync(schemaPath, 'utf8');
      const newProvider = verifyContent.match(/provider\s*=\s*"(sqlite|postgresql)"/);
      console.log(`[PRISMA SCHEMA FIX] 🔍 Verificación: provider = "${newProvider[1]}"`);
    } else {
      console.log('[PRISMA SCHEMA FIX] ✅ Schema ya está configurado para PostgreSQL');
    }
  } else {
    // En desarrollo, informar del estado
    console.log('[PRISMA SCHEMA FIX] 🛠️ Modo desarrollo detectado - no se cambia el schema');
    if (currentProviderValue === 'postgresql') {
      console.log('[PRISMA SCHEMA FIX] ℹ️ Schema configurado para PostgreSQL (desarrollo)');
    } else {
      console.log('[PRISMA SCHEMA FIX] ℹ️ Schema configurado para SQLite (desarrollo)');
    }
  }

  console.log(`[PRISMA SCHEMA FIX] 🌍 Entorno final: ${isProduction ? 'PRODUCCIÓN' : 'DESARROLLO'}`);

} catch (error) {
  console.error('[PRISMA SCHEMA FIX] ❌ Error procesando schema:', error.message);
  process.exit(1);
}

console.log('[PRISMA SCHEMA FIX] ✅ Verificación completada'); 