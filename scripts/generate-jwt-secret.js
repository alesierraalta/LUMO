#!/usr/bin/env node

/**
 * 🔐 Generador de JWT Secret para LUMO
 * 
 * Este script genera un JWT secret seguro que puedes usar en tu .env.local
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔐 Generando JWT Secret seguro...\n');

// Generar JWT secret seguro
const jwtSecret = crypto.randomBytes(32).toString('hex');

console.log('✅ JWT Secret generado:');
console.log(`JWT_SECRET=${jwtSecret}\n`);

// Verificar si existe .env.local
const envLocalPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envLocalPath);

if (envExists) {
  console.log('📝 Archivo .env.local encontrado.');
  
  // Leer contenido actual
  const currentContent = fs.readFileSync(envLocalPath, 'utf8');
  
  if (currentContent.includes('JWT_SECRET=')) {
    console.log('⚠️  JWT_SECRET ya existe en .env.local');
    console.log('💡 Copia manualmente el valor de arriba si quieres actualizarlo.');
  } else {
    // Agregar JWT_SECRET al archivo
    const newContent = currentContent + `\n# JWT Secret (generado automáticamente)\nJWT_SECRET=${jwtSecret}\n`;
    fs.writeFileSync(envLocalPath, newContent);
    console.log('✅ JWT_SECRET agregado a .env.local');
  }
} else {
  console.log('📄 Creando .env.local con JWT_SECRET...');
  
  const envContent = `# 🚀 LUMO - Variables de Entorno
# Configuración local para desarrollo y testing

# Supabase (Requerido)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Base de datos (Requerido para producción)
DATABASE_URL=your_database_url_here

# JWT Secret (generado automáticamente)
JWT_SECRET=${jwtSecret}

# Opcional
NEXT_PUBLIC_APP_ENV=development
`;

  fs.writeFileSync(envLocalPath, envContent);
  console.log('✅ Archivo .env.local creado con JWT_SECRET');
}

console.log('\n🎯 Próximos pasos:');
console.log('1. Completa las variables de Supabase en .env.local');
console.log('2. Ejecuta: scripts\\quick-choreo-test.bat');
console.log('3. ¡Listo para deployar en Choreo!\n'); 