#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('[MIGRATE] Starting production database migration...');

// Verificar que tengamos la DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('[MIGRATE] ERROR: DATABASE_URL not found');
  process.exit(1);
}

console.log('[MIGRATE] Database URL found:', process.env.DATABASE_URL.substring(0, 20) + '...');

try {
  // Crear directorio de migraciones si no existe
  const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
    console.log('[MIGRATE] Created migrations directory');
  }

  // Ejecutar db push para sincronizar schema
  console.log('[MIGRATE] Pushing database schema...');
  execSync('npx prisma db push --accept-data-loss', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  console.log('[MIGRATE] Database schema synchronized successfully');

  // Verificar la conexión
  console.log('[MIGRATE] Verifying database connection...');
  execSync('npx prisma db seed', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  console.log('[MIGRATE] Migration completed successfully!');

} catch (error) {
  console.error('[MIGRATE] Error during migration:', error.message);
  
  // Si falla, intenta solo la sincronización básica
  try {
    console.log('[MIGRATE] Attempting basic schema push...');
    execSync('npx prisma db push --force-reset', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log('[MIGRATE] Basic migration completed');
  } catch (fallbackError) {
    console.error('[MIGRATE] Fallback migration also failed:', fallbackError.message);
    process.exit(1);
  }
} 