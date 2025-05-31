#!/usr/bin/env node

/**
 * Script para probar el fix del schema localmente
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 TESTING Schema Fix...');

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');

// Hacer una copia de respaldo
const backupPath = schemaPath + '.backup';
fs.copyFileSync(schemaPath, backupPath);
console.log('✅ Backup created');

try {
  // Simular entorno de producción
  process.env.NODE_ENV = 'production';
  process.env.CHOREO_DEPLOYMENT = 'true';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost/test';
  
  console.log('🔄 Testing with production environment...');
  
  // Ejecutar el script de fix
  require('./fix-prisma-schema.js');
  
  // Verificar resultado
  const content = fs.readFileSync(schemaPath, 'utf8');
  const provider = content.match(/provider\s*=\s*"(sqlite|postgresql)"/);
  
  if (provider && provider[1] === 'postgresql') {
    console.log('✅ TEST PASSED: Schema correctly changed to PostgreSQL');
  } else {
    console.log('❌ TEST FAILED: Schema not changed properly');
    console.log('Current provider:', provider ? provider[1] : 'not found');
  }
  
} catch (error) {
  console.error('❌ TEST ERROR:', error.message);
} finally {
  // Restaurar backup
  fs.copyFileSync(backupPath, schemaPath);
  fs.unlinkSync(backupPath);
  console.log('🔄 Schema restored from backup');
}

console.log('🧪 Test completed'); 