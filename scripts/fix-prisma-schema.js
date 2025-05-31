#!/usr/bin/env node

/**
 * Script para asegurar que el schema de Prisma esté configurado correctamente
 * Este script se ejecuta durante el build para forzar PostgreSQL en producción
 */

const fs = require('fs');
const path = require('path');

console.log('[PRISMA SCHEMA FIX] Verificando configuración del schema...');

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
const isProduction = process.env.NODE_ENV === 'production';

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
  
  if (isProduction) {
    // En producción, debe ser PostgreSQL
    if (currentProviderValue === 'sqlite') {
      console.log('[PRISMA SCHEMA FIX] 🔄 Cambiando schema a PostgreSQL para producción...');
      schemaContent = schemaContent.replace(
        /provider\s*=\s*"sqlite"/,
        'provider = "postgresql"'
      );
      fs.writeFileSync(schemaPath, schemaContent);
      console.log('[PRISMA SCHEMA FIX] ✅ Schema actualizado a PostgreSQL');
    } else {
      console.log('[PRISMA SCHEMA FIX] ✅ Schema ya está configurado para PostgreSQL');
    }
  } else {
    // En desarrollo, puede ser SQLite
    if (currentProviderValue === 'postgresql') {
      console.log('[PRISMA SCHEMA FIX] ℹ️ Schema configurado para PostgreSQL (modo desarrollo)');
    } else {
      console.log('[PRISMA SCHEMA FIX] ✅ Schema configurado para SQLite (modo desarrollo)');
    }
  }

  console.log(`[PRISMA SCHEMA FIX] 📊 Estado final: provider = "${currentProviderValue}"`);
  console.log(`[PRISMA SCHEMA FIX] 🌍 Entorno: ${isProduction ? 'PRODUCCIÓN' : 'DESARROLLO'}`);

} catch (error) {
  console.error('[PRISMA SCHEMA FIX] ❌ Error procesando schema:', error.message);
  process.exit(1);
}

console.log('[PRISMA SCHEMA FIX] ✅ Verificación completada'); 