#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const modes = {
  development: {
    description: 'Desarrollo local con SQLite y datos de prueba',
    env: {
      NODE_ENV: 'development',
      DEVELOPMENT_MODE: 'true',
      PORT: '3000',
      HOSTNAME: 'localhost',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NEXT_PUBLIC_ENVIRONMENT: 'development',
      DATABASE_URL: 'file:./dev.db',
      JWT_SECRET: 'dev-jwt-secret-key-for-lumo-inventory-system-2024-local',
      ENABLE_DEBUG_LOGS: 'true',
      ENABLE_QUERY_LOGS: 'true',
      LOG_LEVEL: 'debug',
      NEXT_PUBLIC_ENABLE_DEV_TOOLS: 'true'
    },
    schema: {
      provider: 'sqlite'
    }
  },
  production: {
    description: 'Producción con PostgreSQL y datos reales',
    env: {
      NODE_ENV: 'production',
      DEVELOPMENT_MODE: 'false',
      PORT: '8080',
      HOSTNAME: '0.0.0.0',
      ENABLE_DEBUG_LOGS: 'false',
      ENABLE_QUERY_LOGS: 'false',
      LOG_LEVEL: 'info',
      NEXT_PUBLIC_ENABLE_DEV_TOOLS: 'false'
    },
    schema: {
      provider: 'postgresql'
    }
  }
};

function updatePrismaSchema(mode) {
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  const modeConfig = modes[mode];
  
  if (!fs.existsSync(schemaPath)) {
    console.log('⚠️  Schema Prisma no encontrado');
    return false;
  }
  
  try {
    let schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    // Actualizar el provider de la base de datos
    const providerRegex = /provider\s*=\s*"(sqlite|postgresql)"/;
    const newProvider = modeConfig.schema.provider;
    
    if (providerRegex.test(schemaContent)) {
      schemaContent = schemaContent.replace(providerRegex, `provider = "${newProvider}"`);
      fs.writeFileSync(schemaPath, schemaContent);
      console.log(`✓ Schema actualizado a: ${newProvider}`);
      return true;
    } else {
      console.log('⚠️  No se pudo encontrar provider en schema.prisma');
      return false;
    }
  } catch (error) {
    console.log('⚠️  Error actualizando schema:', error.message);
    return false;
  }
}

function manageEnvFiles(mode) {
  const envPath = path.join(process.cwd(), '.env');
  const envProductionPath = path.join(process.cwd(), '.env.production');
  
  if (mode === 'development') {
    // En modo desarrollo, ocultar .env si existe
    if (fs.existsSync(envPath)) {
      if (!fs.existsSync(envProductionPath)) {
        fs.renameSync(envPath, envProductionPath);
        console.log('✓ Archivo .env guardado como .env.production');
      }
    }
  } else if (mode === 'production') {
    // En modo producción, restaurar .env desde .env.production
    if (fs.existsSync(envProductionPath) && !fs.existsSync(envPath)) {
      fs.renameSync(envProductionPath, envPath);
      console.log('✓ Archivo .env.production restaurado como .env');
    }
  }
}

function updateEnvLocal(mode) {
  const envLocalPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envLocalPath)) {
    console.error('❌ .env.local no encontrado. Ejecuta: npm run dev:setup');
    process.exit(1);
  }
  
  let envContent = fs.readFileSync(envLocalPath, 'utf8');
  const modeConfig = modes[mode];
  
  if (!modeConfig) {
    console.error(`❌ Modo inválido: ${mode}. Modos disponibles: ${Object.keys(modes).join(', ')}`);
    process.exit(1);
  }
  
  console.log(`🔄 Cambiando a modo: ${mode}`);
  console.log(`📝 ${modeConfig.description}`);
  
  // Gestionar archivos .env
  manageEnvFiles(mode);
  
  // Actualizar schema de Prisma
  updatePrismaSchema(mode);
  
  // Para modo producción, leer DATABASE_URL desde .env
  let envVariables = {...modeConfig.env};
  if (mode === 'production') {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envFileContent = fs.readFileSync(envPath, 'utf8');
      const dbUrlMatch = envFileContent.match(/^DATABASE_URL=(.*)$/m);
      if (dbUrlMatch) {
        envVariables.DATABASE_URL = dbUrlMatch[1];
        console.log('✓ DATABASE_URL leída desde .env');
      }
    }
  }
  
  // Actualizar variables de entorno
  Object.entries(envVariables).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
      console.log(`✓ ${key}=${key === 'DATABASE_URL' && value.includes('postgres') ? 'PostgreSQL URL' : value}`);
    } else {
      envContent += `\n${key}=${value}`;
      console.log(`+ ${key}=${key === 'DATABASE_URL' && value.includes('postgres') ? 'PostgreSQL URL' : value}`);
    }
  });
  
  // Guardar archivo
  fs.writeFileSync(envLocalPath, envContent);
  
  console.log(`\n✅ Configuración actualizada para modo: ${mode}`);
  
  if (mode === 'development') {
    console.log('\n🛠️ Comandos de desarrollo:');
    console.log('  npm run dev          # Iniciar servidor');
    console.log('  npm run dev:seed     # Poblar con datos de prueba');
    console.log('  npm run dev:reset    # Reset completo de datos');
    console.log('  npm run db:studio    # Abrir editor de DB');
    console.log('\n📊 Base de datos: SQLite (./dev.db)');
    console.log('  ✅ No requiere PostgreSQL');
    console.log('  ✅ Completamente separado de producción');
    console.log('  ✅ Reset instantáneo');
  } else {
    console.log('\n🚀 Modo producción activado');
    console.log('  ⚠️ Usando base de datos real de producción');
    console.log('  ⚠️ Ten cuidado con los cambios');
    console.log('\n📊 Para despliegue:');
    console.log('  npm run build        # Construir para producción');
    console.log('  npm run start        # Iniciar servidor producción');
  }
}

function showCurrentMode() {
  const envLocalPath = path.join(process.cwd(), '.env.local');
  const envPath = path.join(process.cwd(), '.env');
  const envProductionPath = path.join(process.cwd(), '.env.production');
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  
  if (!fs.existsSync(envLocalPath)) {
    console.log('❌ .env.local no encontrado');
    return;
  }
  
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  const nodeEnvMatch = envContent.match(/^NODE_ENV=(.*)$/m);
  const devModeMatch = envContent.match(/^DEVELOPMENT_MODE=(.*)$/m);
  const dbUrlMatch = envContent.match(/^DATABASE_URL=(.*)$/m);
  
  const nodeEnv = nodeEnvMatch ? nodeEnvMatch[1] : 'unknown';
  const devMode = devModeMatch ? devModeMatch[1] : 'unknown';
  const dbUrl = dbUrlMatch ? dbUrlMatch[1] : 'unknown';
  
  // Leer provider del schema
  let schemaProvider = 'unknown';
  if (fs.existsSync(schemaPath)) {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const providerMatch = schemaContent.match(/provider\s*=\s*"(sqlite|postgresql)"/);
    schemaProvider = providerMatch ? providerMatch[1] : 'unknown';
  }
  
  console.log('📊 Configuración actual:');
  console.log(`   NODE_ENV: ${nodeEnv}`);
  console.log(`   DEVELOPMENT_MODE: ${devMode}`);
  console.log(`   DATABASE: ${dbUrl.includes('file:') ? 'SQLite (desarrollo)' : 'PostgreSQL (producción)'}`);
  console.log(`   SCHEMA: ${schemaProvider}`);
  console.log(`   .env: ${fs.existsSync(envPath) ? 'presente' : 'oculto'}`);
  console.log(`   .env.production: ${fs.existsSync(envProductionPath) ? 'presente' : 'no existe'}`);
  
  if (nodeEnv === 'development' && devMode === 'true' && dbUrl.includes('file:') && schemaProvider === 'sqlite') {
    console.log('   🛠️ Modo: DESARROLLO (SQLite)');
  } else if (nodeEnv === 'production' && schemaProvider === 'postgresql') {
    console.log('   🚀 Modo: PRODUCCIÓN (PostgreSQL)');
  } else {
    console.log('   ❓ Modo: MIXTO/DESCONOCIDO');
    console.log('   💡 Ejecuta npm run mode:dev o npm run mode:prod');
  }
}

function showUsage() {
  console.log('🔧 LUMO Mode Switcher');
  console.log('====================');
  console.log('');
  console.log('Uso: node scripts/switch-mode.js [comando]');
  console.log('');
  console.log('Comandos:');
  console.log('  dev         Cambiar a modo desarrollo (SQLite)');
  console.log('  prod        Cambiar a modo producción (PostgreSQL)');
  console.log('  status      Mostrar modo actual');
  console.log('  help        Mostrar esta ayuda');
  console.log('');
  console.log('Ejemplos:');
  console.log('  npm run mode:dev     # Activar desarrollo con SQLite');
  console.log('  npm run mode:prod    # Activar producción con PostgreSQL');
  console.log('  npm run mode:status  # Ver modo actual');
}

// Procesamiento de argumentos
const command = process.argv[2];

switch (command) {
  case 'dev':
  case 'development':
    updateEnvLocal('development');
    break;
  case 'prod':
  case 'production':
    updateEnvLocal('production');
    break;
  case 'status':
  case 'current':
    showCurrentMode();
    break;
  case 'help':
  case '--help':
  case '-h':
    showUsage();
    break;
  default:
    console.log(`❌ Comando desconocido: ${command || 'ninguno'}\n`);
    showUsage();
    process.exit(1);
} 