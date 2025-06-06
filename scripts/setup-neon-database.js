#!/usr/bin/env node

/**
 * Neon Database Setup for LUMO Inventory System
 * Configures Neon PostgreSQL for production while maintaining SQLite for local development
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🐘 LUMO Neon Database Setup');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

function validateNeonUrl(url) {
  if (!url) {
    console.error('❌ Error: DATABASE_URL no proporcionada');
    console.log('');
    console.log('💡 Uso:');
    console.log('   DATABASE_URL="postgresql://user:pass@host/db" npm run setup:neon');
    console.log('');
    console.log('📋 Formato esperado de Neon:');
    console.log('   postgresql://neondb_owner:PASSWORD@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require');
    process.exit(1);
  }

  if (!url.includes('neon.tech') && !url.startsWith('postgresql://')) {
    console.error('❌ Error: URL no parece ser de Neon PostgreSQL');
    console.log('Recibido:', url.substring(0, 50) + '...');
    console.log('');
    console.log('📋 Formato correcto de Neon:');
    console.log('   postgresql://neondb_owner:PASSWORD@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require');
    process.exit(1);
  }

  console.log('✅ URL de Neon válida detectada');
  return true;
}

function createEnvFile(neonUrl) {
  const envPath = path.join(process.cwd(), '.env');
  
  const envContent = `# =============================================================================
# LUMO INVENTORY SYSTEM - PRODUCTION CONFIGURATION (NEON)
# =============================================================================
# This file contains the production PostgreSQL configuration for Neon
# Local development still uses SQLite via .env.local

# =============================================================================
# PRODUCTION DATABASE (NEON POSTGRESQL)
# =============================================================================
DATABASE_URL=${neonUrl}

# Direct URL for Prisma Accelerate migrations (same as DATABASE_URL for now)
DIRECT_URL=${neonUrl}

# =============================================================================
# PRODUCTION ENVIRONMENT
# =============================================================================
NODE_ENV=production
DEVELOPMENT_MODE=false

# =============================================================================
# JWT AUTHENTICATION (NO CLERK)
# =============================================================================
# Use a strong JWT secret for production
JWT_SECRET=CHANGE_THIS_TO_STRONG_SECRET_FOR_PRODUCTION_MIN_32_CHARS

# =============================================================================
# LOGGING
# =============================================================================
LOG_LEVEL=info
ENABLE_DEBUG_LOGS=false
ENABLE_QUERY_LOGS=false

# =============================================================================
# CHOREO DEPLOYMENT
# =============================================================================
CHOREO_DEPLOYMENT=true

# =============================================================================
# NOTES
# =============================================================================
# - This .env file is for PRODUCTION ONLY
# - Local development uses .env.local with SQLite
# - Switch modes with: npm run mode:dev | npm run mode:prod
# - Never commit this file with real credentials
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Archivo .env creado con configuración de Neon');
  console.log('');
  console.log('⚠️  IMPORTANTE: Cambia JWT_SECRET por un valor seguro antes del deploy');
}

function updatePrismaForNeon() {
  console.log('🔧 Configurando Prisma para Neon...');
  
  // Asegurar que el schema esté en modo PostgreSQL
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  
  if (fs.existsSync(schemaPath)) {
    let schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    // Verificar que tenga PostgreSQL provider
    if (!schemaContent.includes('provider = "postgresql"')) {
      console.log('🔄 Cambiando schema a PostgreSQL...');
      schemaContent = schemaContent.replace(
        /provider\s*=\s*"sqlite"/g, 
        'provider = "postgresql"'
      );
      fs.writeFileSync(schemaPath, schemaContent);
    }
    
    console.log('✅ Schema Prisma configurado para PostgreSQL');
  }
}

function testNeonConnection(neonUrl) {
  console.log('🧪 Probando conexión a Neon...');
  
  try {
    // Crear cliente de prueba temporal
    const testScript = `
const { Client } = require('pg');
const client = new Client({ 
  connectionString: '${neonUrl}',
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => {
    console.log('✅ Conexión a Neon exitosa');
    return client.query('SELECT version()');
  })
  .then((result) => {
    console.log('🐘 PostgreSQL Version:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
    return client.end();
  })
  .catch((err) => {
    console.error('❌ Error de conexión:', err.message);
    process.exit(1);
  });
`;

    // Crear archivo temporal
    const testPath = path.join(process.cwd(), 'temp-neon-test.js');
    fs.writeFileSync(testPath, testScript);
    
    // Instalar pg si no está disponible
    try {
      require('pg');
    } catch {
      console.log('📦 Instalando pg para test de conexión...');
      execSync('npm install pg --no-save', { stdio: 'inherit' });
    }
    
    // Ejecutar test
    execSync(`node ${testPath}`, { stdio: 'inherit' });
    
    // Limpiar archivo temporal
    fs.unlinkSync(testPath);
    
  } catch (error) {
    console.error('❌ Error probando conexión:', error.message);
    process.exit(1);
  }
}

function runMigrations() {
  console.log('🚀 Ejecutando migraciones de Prisma...');
  
  try {
    // Push schema a la base de datos
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ Schema sincronizado con Neon');
    
    // Regenerar cliente Prisma
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Cliente Prisma regenerado');
    
  } catch (error) {
    console.error('❌ Error en migraciones:', error.message);
    console.log('');
    console.log('💡 Soluciones posibles:');
    console.log('1. Verificar que la URL de Neon sea correcta');
    console.log('2. Verificar que la base de datos esté accesible');
    console.log('3. Ejecutar manualmente: npx prisma db push');
    process.exit(1);
  }
}

function showNextSteps() {
  console.log('');
  console.log('🎉 ¡Configuración de Neon completada!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('📋 PRÓXIMOS PASOS:');
  console.log('');
  console.log('1️⃣  SEGURIDAD:');
  console.log('   📝 Edita .env y cambia JWT_SECRET por un valor seguro');
  console.log('   🔐 Nunca hagas commit del archivo .env con credenciales reales');
  console.log('');
  console.log('2️⃣  CONFIGURAR PRISMA ACCELERATE (Opcional pero recomendado):');
  console.log('   🌐 Visita: https://console.prisma.io/');
  console.log('   🔑 Crea proyecto y obtén API key');
  console.log('   📝 Actualiza DATABASE_URL a: prisma://accelerate.prisma-data.net/?api_key=TU_API_KEY');
  console.log('   📝 Mantén DIRECT_URL con la URL actual de Neon');
  console.log('');
  console.log('3️⃣  TESTING:');
  console.log('   🧪 Modo producción: npm run mode:prod');
  console.log('   🚀 Build y test: npm run build');
  console.log('   🔄 Volver a desarrollo: npm run mode:dev');
  console.log('');
  console.log('4️⃣  DEPLOYMENT:');
  console.log('   📦 Configurar variables en Choreo dashboard');
  console.log('   🚀 Deploy y verificar logs');
  console.log('');
  console.log('💡 SISTEMA DUAL CONFIGURADO:');
  console.log('   🏠 Local: SQLite (./dev.db) - Sin afectar producción');
  console.log('   🌐 Producción: Neon PostgreSQL - Datos reales');
  console.log('');
  console.log('📚 Documentación: PRISMA_ACCELERATE_SETUP.md');
}

// MAIN EXECUTION
function main() {
  const neonUrl = process.env.DATABASE_URL;
  
  // Validar URL de Neon
  validateNeonUrl(neonUrl);
  
  // Crear archivo .env para producción
  createEnvFile(neonUrl);
  
  // Configurar Prisma
  updatePrismaForNeon();
  
  // Probar conexión
  testNeonConnection(neonUrl);
  
  // Ejecutar migraciones
  runMigrations();
  
  // Mostrar pasos siguientes
  showNextSteps();
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { main, validateNeonUrl, createEnvFile }; 