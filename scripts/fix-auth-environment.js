#!/usr/bin/env node

/**
 * LUMO Authentication Environment Fix
 * Creates the correct .env.local file with all necessary variables
 */

const fs = require('fs');
const path = require('path');

function fixAuthEnvironment() {
  console.log('🔧 LUMO Authentication Environment Fix');
  console.log('=====================================\n');

  const envContent = `# LUMO INVENTORY - DESARROLLO LOCAL
# Base de datos de DESARROLLO
NEXT_PUBLIC_SUPABASE_URL=https://ndprriqyhddjoixrlqnz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcHJyaXF5aGRkam9peHJscW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMDg0MDAsImV4cCI6MjA2NTY4NDQwMH0.4rzi6UFGnN6ien_706ETHjBylZMK6jt0vjRvvnJ1J-8

# CRÍTICO: Clave de servicio para operaciones del servidor (APIs)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcHJyaXF5aGRkam9peHJscW56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDEwODQwMCwiZXhwIjoyMDY1Njg0NDAwfQ.Nqs_Lm2qdqcbgNV0r9BsxmkJPCEgPiZeKUOz0eJWXKI

# Configuración de aplicación
FORCE_SUPABASE=true
NODE_ENV=development
APP_NAME=LUMO Inventory Management
APP_VERSION=2.0.0

# Autenticación para desarrollo
NEXTAUTH_SECRET=lumo-dev-secret-key-2024
NEXTAUTH_URL=http://localhost:3000

# JWT Secret para autenticación (mínimo 32 caracteres)
JWT_SECRET=lumo-super-secret-jwt-key-2024-production-ready-32chars

# Configuración adicional para Choreo (si es necesario)
CHOREO_ENVIRONMENT=Development
`;

  const envPath = '.env.local';
  
  try {
    // Backup existing .env.local if it exists
    if (fs.existsSync(envPath)) {
      const backupPath = `.env.local.backup.${Date.now()}`;
      fs.copyFileSync(envPath, backupPath);
      console.log(`📋 Backup created: ${backupPath}`);
    }

    // Write new .env.local
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env.local file created successfully');
    
    console.log('\n📝 Variables added:');
    console.log('   ✅ NEXT_PUBLIC_SUPABASE_URL (Development)');
    console.log('   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY (Development)');
    console.log('   ✅ SUPABASE_SERVICE_ROLE_KEY (CRITICAL for APIs)');
    console.log('   ✅ JWT_SECRET (Authentication)');
    console.log('   ✅ NEXTAUTH_SECRET (NextAuth)');
    console.log('   ✅ FORCE_SUPABASE (Configuration)');
    
    console.log('\n🎯 Next Steps:');
    console.log('   1. Restart your development server (npm run dev)');
    console.log('   2. Try creating a user again');
    console.log('   3. Check that APIs return 200 instead of 401');
    
    console.log('\n⚠️ Important Notes:');
    console.log('   - The SUPABASE_SERVICE_ROLE_KEY was missing (this was the main issue)');
    console.log('   - This key allows server-side APIs to authenticate with Supabase');
    console.log('   - Without it, all API calls return 401 Unauthorized');
    
  } catch (error) {
    console.error('❌ Error creating .env.local:', error.message);
    console.log('\n🔧 Manual Fix:');
    console.log('   Copy the following content to .env.local manually:');
    console.log('   ' + '-'.repeat(50));
    console.log(envContent);
    console.log('   ' + '-'.repeat(50));
  }
}

fixAuthEnvironment(); 