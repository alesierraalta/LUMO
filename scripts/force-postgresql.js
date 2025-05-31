#!/usr/bin/env node

/**
 * Script de emergencia para forzar PostgreSQL en schema.prisma
 * Este es un respaldo que siempre fuerza PostgreSQL sin condiciones
 */

const fs = require('fs');
const path = require('path');

console.log('[FORCE POSTGRESQL] Forzando configuración PostgreSQL...');

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');

if (!fs.existsSync(schemaPath)) {
  console.error('[FORCE POSTGRESQL] ❌ Schema Prisma no encontrado');
  process.exit(1);
}

try {
  let schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  console.log('[FORCE POSTGRESQL] 📊 Schema antes:');
  const beforeProvider = schemaContent.match(/provider\s*=\s*"(sqlite|postgresql)"/);
  console.log(`  Provider: ${beforeProvider ? beforeProvider[1] : 'no encontrado'}`);
  
  // SIEMPRE forzar PostgreSQL
  schemaContent = schemaContent.replace(
    /provider\s*=\s*"sqlite"/,
    'provider = "postgresql"'
  );
  
  fs.writeFileSync(schemaPath, schemaContent);
  
  // Verificar el cambio
  const verifyContent = fs.readFileSync(schemaPath, 'utf8');
  const afterProvider = verifyContent.match(/provider\s*=\s*"(sqlite|postgresql)"/);
  
  console.log('[FORCE POSTGRESQL] 📊 Schema después:');
  console.log(`  Provider: ${afterProvider ? afterProvider[1] : 'no encontrado'}`);
  
  if (afterProvider && afterProvider[1] === 'postgresql') {
    console.log('[FORCE POSTGRESQL] ✅ PostgreSQL FORZADO exitosamente');
  } else {
    console.log('[FORCE POSTGRESQL] ⚠️ El schema no cambió como se esperaba');
  }

} catch (error) {
  console.error('[FORCE POSTGRESQL] ❌ Error:', error.message);
  process.exit(1);
}

console.log('[FORCE POSTGRESQL] ✅ Completado'); 