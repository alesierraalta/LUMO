#!/usr/bin/env node

/**
 * LUMO - Creador de archivos .env completos
 * =========================================
 * 
 * Este script crea los archivos .env.local con toda la configuración necesaria
 */

const fs = require('fs');
const path = require('path');

function crearEnvCompleto() {
  console.log('🔧 LUMO - Creador de archivos .env completos');
  console.log('=============================================\n');

  // Configuración de desarrollo
  const envDesarrollo = `# LUMO INVENTORY - DESARROLLO LOCAL
# ===================================
# Archivo: .env.local (para desarrollo)

# Supabase Desarrollo (Proyecto: ndprriqyhddjoixrlqnz)
NEXT_PUBLIC_SUPABASE_URL=https://ndprriqyhddjoixrlqnz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcHJyaXF5aGRkam9peHJscW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMDg0MDAsImV4cCI6MjA2NTY4NDQwMH0.4rzi6UFGnN6ien_706ETHjBylZMK6jt0vjRvvnJ1J-8

# CRÍTICO: Service Role Key para APIs del servidor
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcHJyaXF5aGRkam9peHJscW56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDEwODQwMCwiZXhwIjoyMDY1Njg0NDAwfQ.Nqs_Lm2qdqcbgNV0r9BsxmkJPCEgPiZeKUOz0eJWXKI

# Configuración del servidor Supabase
SUPABASE_URL=https://ndprriqyhddjoixrlqnz.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcHJyaXF5aGRkam9peHJscW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMDg0MDAsImV4cCI6MjA2NTY4NDQwMH0.4rzi6UFGnN6ien_706ETHjBylZMK6jt0vjRvvnJ1J-8

# Database URL (PostgreSQL)
DATABASE_URL=postgresql://postgres.ndprriqyhddjoixrlqnz:Theale05042013$$@aws-0-us-east-2.pooler.supabase.com:6543/postgres

# JWT Secret para autenticación
JWT_SECRET=lpjKTHcdpkmEB5j79a5V9zbH9wZ0s0akqcf8qw/sTKH6yahONHoc/K+vfZhXxksu2EIZSv4bZiv8N7DiV6Ib7g==

# NextAuth (obsoleto pero mantenido por compatibilidad)
NEXTAUTH_SECRET=lpjKTHcdpkmEB5j79a5V9zbH9wZ0s0akqcf8qw/sTKH6yahONHoc/K+vfZhXxksu2EIZSv4bZiv8N7DiV6Ib7g==
NEXTAUTH_URL=http://localhost:3000

# Configuración de aplicación
FORCE_SUPABASE=true
NODE_ENV=development
APP_NAME=LUMO Inventory Management
APP_VERSION=2.0.0
PORT=3000

# Configuración adicional
CHOREO_ENVIRONMENT=Development
`;

  // Configuración de producción
  const envProduccion = `# LUMO INVENTORY - PRODUCCIÓN
# ============================
# Archivo: .env.production (para producción/Choreo)

# Supabase Producción (Proyecto: ubjujxtvlubxowsphvuk)
NEXT_PUBLIC_SUPABASE_URL=https://ubjujxtvlubxowsphvuk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4

# CRÍTICO: Service Role Key para APIs del servidor (NECESITAS OBTENERLA)
# Ve a: https://supabase.com/dashboard/project/ubjujxtvlubxowsphvuk/settings/api
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY_DE_PRODUCCION_AQUI

# Configuración del servidor Supabase
SUPABASE_URL=https://ubjujxtvlubxowsphvuk.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4

# Database URL (PostgreSQL) - NECESITAS OBTENERLA
# Ve a: https://supabase.com/dashboard/project/ubjujxtvlubxowsphvuk/settings/database
DATABASE_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres

# JWT Secret para autenticación
JWT_SECRET=lpjKTHcdpkmEB5j79a5V9zbH9wZ0s0akqcf8qw/sTKH6yahONHoc/K+vfZhXxksu2EIZSv4bZiv8N7DiV6Ib7g==

# NextAuth (obsoleto pero mantenido por compatibilidad)
NEXTAUTH_SECRET=lpjKTHcdpkmEB5j79a5V9zbH9wZ0s0akqcf8qw/sTKH6yahONHoc/K+vfZhXxksu2EIZSv4bZiv8N7DiV6Ib7g==
NEXTAUTH_URL=https://tu-app-choreo.choreoapps.dev

# Configuración de aplicación
FORCE_SUPABASE=true
NODE_ENV=production
APP_NAME=LUMO Inventory Management
APP_VERSION=2.0.0
PORT=8080

# Configuración de Choreo
CHOREO_ENVIRONMENT=Production
`;

  try {
    // Crear .env.local para desarrollo
    fs.writeFileSync('.env.local', envDesarrollo);
    console.log('✅ Archivo .env.local creado para DESARROLLO');

    // Crear .env.production
    fs.writeFileSync('.env.production', envProduccion);
    console.log('✅ Archivo .env.production creado para PRODUCCIÓN\n');

    console.log('🎯 ARCHIVOS CREADOS:');
    console.log('====================');
    console.log('• .env.local (desarrollo) - LISTO PARA USAR');
    console.log('• .env.production (producción) - NECESITA SERVICE_ROLE_KEY\n');

    console.log('🔧 SIGUIENTE PASO PARA DESARROLLO:');
    console.log('===================================');
    console.log('1. El archivo .env.local ya está listo');
    console.log('2. Reinicia el servidor: npm run dev');
    console.log('3. Las APIs deberían responder 200 en lugar de 401\n');

    console.log('🔧 PARA PRODUCCIÓN NECESITAS:');
    console.log('==============================');
    console.log('1. Ve a: https://supabase.com/dashboard/project/ubjujxtvlubxowsphvuk/settings/api');
    console.log('2. Copia la "service_role" key');
    console.log('3. Reemplaza "TU_SERVICE_ROLE_KEY_DE_PRODUCCION_AQUI" en .env.production');
    console.log('4. Configura la DATABASE_URL de producción\n');

    console.log('💡 NOTA IMPORTANTE:');
    console.log('===================');
    console.log('• El archivo .env.local para desarrollo YA TIENE todas las claves necesarias');
    console.log('• Para producción solo necesitas obtener la service_role key del dashboard');
    console.log('• NUNCA commites archivos .env al repositorio\n');

  } catch (error) {
    console.error('❌ Error creando archivos:', error.message);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  crearEnvCompleto();
}

module.exports = { crearEnvCompleto }; 