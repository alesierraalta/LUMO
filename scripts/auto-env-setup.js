const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 LUMO - Setup Automático de Entorno');
console.log('=====================================');

// Detectar entorno
const isProduction = process.env.NODE_ENV === 'production';
const isChoreoBuild = process.env.CHOREO_ENVIRONMENT || process.env.DATABASE_URL?.includes('postgres');
const isDevelopment = !isProduction && !isChoreoBuild;

console.log(`🔍 Entorno detectado: ${isProduction ? 'PRODUCCIÓN' : isChoreoBuild ? 'CHOREO BUILD' : 'DESARROLLO'}`);

// Configuración por entorno
const envConfig = {
  development: {
    provider: 'sqlite',
    connectionType: 'sqlite',
    needsEnvFile: true,
    needsDB: true,
    needsAdmin: true
  },
  production: {
    provider: 'postgresql',
    connectionType: 'postgresql-direct',
    needsEnvFile: false,
    needsDB: false,
    needsAdmin: true
  }
};

const config = isDevelopment ? envConfig.development : envConfig.production;

// 1. CONFIGURAR SCHEMA DE PRISMA
console.log('\n📝 Configurando Schema de Prisma...');
const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

const targetProvider = `provider = "${config.provider}"`;
const updatedSchema = schemaContent.replace(
  /provider = "(sqlite|postgresql)"/,
  targetProvider
);

if (updatedSchema !== schemaContent) {
  fs.writeFileSync(schemaPath, updatedSchema);
  console.log(`✅ Schema configurado para ${config.provider}`);
} else {
  console.log(`ℹ️ Schema ya está configurado para ${config.provider}`);
}

// 2. CONFIGURAR PRISMA-CONFIG.JSON
console.log('\n⚙️ Configurando prisma-config.json...');
const configPath = path.join(process.cwd(), 'prisma-config.json');
const prismaConfig = {
  databaseUrl: "${DATABASE_URL}",
  connectionType: config.connectionType,
  timestamp: new Date().toISOString(),
  autoConfigured: true,
  environment: isDevelopment ? 'development' : 'production'
};

fs.writeFileSync(configPath, JSON.stringify(prismaConfig, null, 2));
console.log(`✅ Configuración actualizada: ${config.connectionType}`);

// 3. CONFIGURAR ARCHIVO .ENV.LOCAL (SOLO DESARROLLO)
if (config.needsEnvFile && isDevelopment) {
  console.log('\n📋 Configurando .env.local para desarrollo...');
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    const envContent = `# LUMO INVENTORY - LOCAL DEVELOPMENT (AUTO-GENERATED)
NODE_ENV=development
DATABASE_URL=file:./dev.db
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-for-local-development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENVIRONMENT=development
LOG_LEVEL=debug
ENABLE_DEBUG_LOGS=true
`;
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Archivo .env.local creado');
  } else {
    console.log('ℹ️ Archivo .env.local ya existe');
  }
}

// 4. CONFIGURAR BASE DE DATOS (SOLO DESARROLLO)
if (config.needsDB && isDevelopment) {
  console.log('\n🗄️ Configurando base de datos SQLite...');
  
  try {
    // Generar cliente Prisma
    console.log('   📦 Generando cliente Prisma...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Verificar si dev.db existe
    const dbPath = path.join(process.cwd(), 'dev.db');
    if (!fs.existsSync(dbPath)) {
      console.log('   🔨 Creando base de datos SQLite...');
      execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
    } else {
      console.log('   ℹ️ Base de datos SQLite ya existe');
    }
    
    console.log('✅ Base de datos configurada');
  } catch (error) {
    console.log('⚠️ Error configurando base de datos:', error.message);
  }
}

// 5. CONFIGURAR USUARIO ADMIN
if (config.needsAdmin) {
  console.log('\n👤 Configurando usuario administrador...');
  
  try {
    execSync('node scripts/ensure-admin.js', { stdio: 'inherit' });
    console.log('✅ Usuario administrador configurado');
  } catch (error) {
    console.log('⚠️ Error configurando admin (se intentará en startup)');
  }
}

console.log('\n🎉 Setup automático completado');
console.log('=====================================');
console.log(`📊 Resumen:`);
console.log(`   • Entorno: ${isDevelopment ? 'Desarrollo' : 'Producción'}`);
console.log(`   • Base de datos: ${config.provider}`);
console.log(`   • Configuración: ${config.connectionType}`);
console.log(`   • Admin: ${config.needsAdmin ? 'Configurado' : 'No requerido'}`);

if (isDevelopment) {
  console.log('\n🚀 Para iniciar desarrollo:');
  console.log('   npm run dev');
} else {
  console.log('\n🚀 Listo para build de producción');
} 