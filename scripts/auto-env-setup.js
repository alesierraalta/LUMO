const fs = require('fs');
const path = require('path');

console.log('🚀 LUMO - Setup Automático de Entorno (Supabase)');
console.log('=====================================');

// Detectar entorno
const isProduction = process.env.NODE_ENV === 'production';
const isChoreoBuild = process.env.CHOREO_ENVIRONMENT || process.env.DATABASE_URL?.includes('postgres');
const isDevelopment = !isProduction && !isChoreoBuild;

console.log(`🔍 Entorno detectado: ${isProduction ? 'PRODUCCIÓN' : isChoreoBuild ? 'CHOREO BUILD' : 'DESARROLLO'}`);

// Configuración por entorno
const envConfig = {
  development: {
    provider: 'supabase',
    connectionType: 'supabase-direct',
    needsEnvFile: true,
    needsDB: false, // Supabase is already set up
    needsAdmin: false // Admin is created in Supabase
  },
  production: {
    provider: 'supabase',
    connectionType: 'supabase-direct',
    needsEnvFile: false,
    needsDB: false,
    needsAdmin: false
  }
};

const config = isDevelopment ? envConfig.development : envConfig.production;

// 1. VERIFICAR CONFIGURACIÓN DE SUPABASE
console.log('\n📝 Verificando configuración de Supabase...');

// Check if .env.local exists and has Supabase config
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  if (envContent.includes('NEXT_PUBLIC_SUPABASE_URL')) {
    console.log('✅ Configuración de Supabase encontrada');
  } else {
    console.log('⚠️ Configuración de Supabase no encontrada en .env.local');
  }
} else {
  console.log('⚠️ Archivo .env.local no encontrado');
}

// 2. CONFIGURAR ARCHIVO .ENV.LOCAL (SOLO DESARROLLO)
if (config.needsEnvFile && isDevelopment) {
  console.log('\n📋 Verificando .env.local para desarrollo...');
  
  if (!fs.existsSync(envPath)) {
    console.log('⚠️ Archivo .env.local no encontrado. Copiando desde supabase.env...');
    
    const supabaseEnvPath = path.join(process.cwd(), 'supabase.env');
    if (fs.existsSync(supabaseEnvPath)) {
      const supabaseEnvContent = fs.readFileSync(supabaseEnvPath, 'utf-8');
      fs.writeFileSync(envPath, supabaseEnvContent);
      console.log('✅ Archivo .env.local creado desde supabase.env');
    } else {
      console.log('❌ Archivo supabase.env no encontrado');
    }
  } else {
    console.log('ℹ️ Archivo .env.local ya existe');
  }
}

console.log('\n🎉 Setup automático completado');
console.log('=====================================');
console.log(`📊 Resumen:`);
console.log(`   • Entorno: ${isDevelopment ? 'Desarrollo' : 'Producción'}`);
console.log(`   • Base de datos: ${config.provider}`);
console.log(`   • Configuración: ${config.connectionType}`);
console.log(`   • Supabase: Configurado`);

if (isDevelopment) {
  console.log('\n🚀 Para iniciar desarrollo:');
  console.log('   npm run dev');
} else {
  console.log('\n🚀 Listo para build de producción');
}

console.log('\n📋 Notas importantes:');
console.log('   • Asegúrate de que la base de datos Supabase esté configurada');
console.log('   • Ejecuta el schema SQL en tu proyecto Supabase');
console.log('   • Verifica las credenciales en .env.local'); 