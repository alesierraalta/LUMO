#!/usr/bin/env node

/**
 * Script para configurar el entorno de Supabase JWT y probar el token del usuario
 */

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// Token JWT de usuario proporcionado (token de sesión)
const userJwtToken = 'lpjKTHcdpkmEB5j79a5V9zbH9wZ0s0akqcf8qw/sTKH6yahONHoc/K+vfZhXxksu2EIZSv4bZiv8N7DiV6Ib7g==';

console.log('🔐 Configurando Supabase JWT para LUMO...\n');

// Crear archivo .env.local
const envContent = `# LUMO Inventory Management - Environment Configuration
# Supabase JWT Authentication System

# Supabase Development Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ndprriqyhddjoixrlqnz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcHJyaXF5aGRkam9peHJscW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMDg0MDAsImV4cCI6MjA2NTY4NDQwMH0.4rzi6UFGnN6ien_706ETHjBylZMK6jt0vjRvvnJ1J-8

# Server-side Supabase Configuration
SUPABASE_URL=https://ndprriqyhddjoixrlqnz.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcHJyaXF5aGRkam9peHJscW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMDg0MDAsImV4cCI6MjA2NTY4NDQwMH0.4rzi6UFGnN6ien_706ETHjBylZMK6jt0vjRvvnJ1J-8

# Production Database Configuration (for GitHub Actions)
SUPABASE_URL_PROD=https://ubjujxtvlubxowsphvuk.supabase.co
SUPABASE_KEY_PROD=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4

# Force Supabase usage (disable Prisma/SQLite)
FORCE_SUPABASE=true

# Environment
NODE_ENV=development

# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here-change-in-production
NEXTAUTH_URL=http://localhost:3000

# Application Settings
APP_NAME=LUMO Inventory Management
APP_VERSION=2.0.0

# User JWT Token for Testing (provided by user)
# This is a session token, not an API key
DEV_USER_JWT_TOKEN=${userJwtToken}
`;

// Escribir archivo .env.local
const envPath = path.join(process.cwd(), '.env.local');
fs.writeFileSync(envPath, envContent);
console.log('✅ Archivo .env.local creado exitosamente');

// Analizar el token JWT del usuario
console.log('\n🔍 Analizando token JWT del usuario...');
console.log(`Token: ${userJwtToken}`);
console.log(`Longitud: ${userJwtToken.length} caracteres`);

// Intentar decodificar como JWT
if (userJwtToken.includes('.')) {
  try {
    const decoded = jwt.decode(userJwtToken, { complete: true });
    if (decoded) {
      console.log('\n✅ Token JWT decodificado:');
      console.log('Header:', JSON.stringify(decoded.header, null, 2));
      console.log('Payload:', JSON.stringify(decoded.payload, null, 2));
      
      if (decoded.payload && decoded.payload.exp) {
        const expDate = new Date(decoded.payload.exp * 1000);
        const isValid = decoded.payload.exp > Date.now() / 1000;
        console.log(`\n⏰ Expiración: ${expDate.toISOString()}`);
        console.log(`🔒 Estado: ${isValid ? 'VÁLIDO' : 'EXPIRADO'}`);
      }
    }
  } catch (error) {
    console.log('❌ Error decodificando JWT:', error.message);
  }
} else {
  console.log('\n💡 Este token no parece ser un JWT estándar');
  console.log('🔑 Podría ser un token de sesión personalizado de Supabase');
}

// Información del sistema
console.log('\n📋 Configuración del sistema:');
console.log('- Supabase URL (Dev): https://ndprriqyhddjoixrlqnz.supabase.co');
console.log('- Supabase URL (Prod): https://ubjujxtvlubxowsphvuk.supabase.co');
console.log('- Sistema de Auth: JWT Nativo de Supabase');
console.log('- Middleware: Verificación automática de tokens');
console.log('- AuthContext: Cache de 5 minutos');

console.log('\n🧪 Próximos pasos:');
console.log('1. Reiniciar el servidor de desarrollo: npm run dev');
console.log('2. Visitar: http://localhost:3000/test-supabase-jwt');
console.log('3. Probar login con tu cuenta: alesierraalta@gmail.com');
console.log('4. Verificar que el token JWT se genere correctamente');

console.log('\n🎯 GitHub Actions configurado para:');
console.log('- Base de datos de desarrollo: ndprriqyhddjoixrlqnz');
console.log('- Base de datos de producción: ubjujxtvlubxowsphvuk');
console.log('- Solo ejecuta tests, no deployment');

console.log('\n✅ Configuración de Supabase JWT completada!'); 