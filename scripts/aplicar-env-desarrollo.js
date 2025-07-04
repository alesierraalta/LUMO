#!/usr/bin/env node

/**
 * LUMO - Aplicar .env.local de Desarrollo
 * =======================================
 * 
 * Este script aplica automáticamente el archivo .env.local correcto
 */

const fs = require('fs');
const path = require('path');

function aplicarEnvDesarrollo() {
  console.log('🔧 LUMO - Aplicando .env.local de Desarrollo');
  console.log('=============================================\n');

  const envContent = `# LUMO INVENTORY - DESARROLLO LOCAL
# ===================================

# Supabase Desarrollo (Proyecto: ndprriqyhddjoixrlqnz)
NEXT_PUBLIC_SUPABASE_URL=https://ndprriqyhddjoixrlqnz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcHJyaXF5aGRkam9peHJscW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMDg0MDAsImV4cCI6MjA2NTY4NDQwMH0.4rzi6UFGnN6ien_706ETHjBylZMK6jt0vjRvvnJ1J-8

# CRÍTICO: Service Role Key para APIs del servidor
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcHJyaXF5aGRkam9peHJscW56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDEwODQwMCwiZXhwIjoyMDY1Njg0NDAwfQ.Nqs_Lm2qdqcbgNV0r9BsxmkJPCEgPiZeKUOz0eJWXKI

# Configuración del servidor Supabase
SUPABASE_URL=https://ndprriqyhddjoixrlqnz.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcHJyaXF5aGRkam9peHJscW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMDg0MDAsImV4cCI6MjA2NTY4NDQwMH0.4rzi6UFGnN6ien_706ETHjBylZMK6jt0vjRvvnJ1J-8

# JWT Secret para autenticación adicional
JWT_SECRET=lumo-super-secret-jwt-key-2024-production-ready-32chars

# Configuración de la aplicación
NODE_ENV=development
APP_NAME=LUMO Inventory Management
APP_VERSION=2.0.0

# Configuración adicional para desarrollo
FORCE_SUPABASE=true
NEXTAUTH_URL=http://localhost:3000

# Base de datos URL (para compatibilidad)
DATABASE_URL=postgresql://postgres.ndprriqyhddjoixrlqnz:TU_PASSWORD_AQUI@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Configuración de logs
LOG_LEVEL=info
ENABLE_DETAILED_LOGGING=true

# Configuración de desarrollo
DEVELOPMENT_MODE=true
SKIP_AUTH_IN_DEV=false
`;

  try {
    // Crear backup del .env.local actual si existe
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const backupPath = path.join(process.cwd(), '.env.local.backup');
      fs.copyFileSync(envPath, backupPath);
      console.log('✅ Backup creado: .env.local.backup');
    }

    // Escribir el nuevo .env.local
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Archivo .env.local creado exitosamente');

    console.log('\n📋 VARIABLES CONFIGURADAS:');
    console.log('==========================');
    console.log('✅ NEXT_PUBLIC_SUPABASE_URL');
    console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.log('✅ SUPABASE_SERVICE_ROLE_KEY (CRÍTICA)');
    console.log('✅ JWT_SECRET');
    console.log('✅ NODE_ENV');
    console.log('✅ APP_NAME y APP_VERSION');
    console.log('✅ FORCE_SUPABASE');
    console.log('✅ NEXTAUTH_URL');
    console.log('✅ DATABASE_URL');

    console.log('\n🚀 SIGUIENTE PASO:');
    console.log('==================');
    console.log('1. Reinicia el servidor de desarrollo:');
    console.log('   npm run dev');
    console.log('');
    console.log('2. Prueba las operaciones CRUD:');
    console.log('   node scripts/test-user-crud.js');
    console.log('');
    console.log('3. Verifica que ya no hay errores 401/403');

  } catch (error) {
    console.error('❌ Error aplicando .env.local:', error);
    console.log('\n🔧 SOLUCIÓN MANUAL:');
    console.log('===================');
    console.log('Copia el contenido del archivo ENV_DESARROLLO_COMPLETO.txt');
    console.log('y pégalo en un nuevo archivo .env.local en la raíz del proyecto');
  }
}

// Ejecutar el script
aplicarEnvDesarrollo(); 