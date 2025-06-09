#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Configurando Prisma para el entorno...');

const isProduction = process.env.NODE_ENV === 'production';
const isChoreoBuild = process.env.CHOREO_ENVIRONMENT || process.env.DATABASE_URL?.includes('postgres');

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

let updatedSchema;

if (isProduction || isChoreoBuild) {
  console.log('📦 Configurando para PRODUCCIÓN (PostgreSQL)...');
  updatedSchema = schemaContent.replace(
    /provider = "sqlite"/,
    'provider = "postgresql"'
  );
} else {
  console.log('🛠️ Configurando para DESARROLLO (SQLite)...');
  updatedSchema = schemaContent.replace(
    /provider = "postgresql"/,
    'provider = "sqlite"'
  );
}

if (updatedSchema !== schemaContent) {
  fs.writeFileSync(schemaPath, updatedSchema);
  console.log('✅ Schema de Prisma actualizado para el entorno');
} else {
  console.log('ℹ️ Schema ya está configurado correctamente');
}

// Actualizar prisma-config.json también
const configPath = path.join(process.cwd(), 'prisma-config.json');
if (fs.existsSync(configPath)) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  
  if (isProduction || isChoreoBuild) {
    config.connectionType = 'postgresql-direct';
  } else {
    config.connectionType = 'sqlite';
  }
  
  config.timestamp = new Date().toISOString();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`✅ Configuración actualizada: ${config.connectionType}`);
} 