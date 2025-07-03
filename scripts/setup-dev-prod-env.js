#!/usr/bin/env node

/**
 * Script completo para configurar ambientes DEV y PROD
 * Configura automáticamente las variables de entorno para ambos ambientes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DEV_ENV_VARS = `# LUMO INVENTORY - DESARROLLO LOCAL
# Base de datos de DESARROLLO
NEXT_PUBLIC_SUPABASE_URL=https://ndprriqyhddjoixrlqnz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcHJyaXF5aGRkam9peHJscW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMDg0MDAsImV4cCI6MjA2NTY4NDQwMH0.4rzi6UFGnN6ien_706ETHjBylZMK6jt0vjRvvnJ1J-8

# Configuración de aplicación
FORCE_SUPABASE=true
NODE_ENV=development
APP_NAME=LUMO Inventory Management
APP_VERSION=2.0.0

# Autenticación para desarrollo
NEXTAUTH_SECRET=lumo-dev-secret-key-2024
NEXTAUTH_URL=http://localhost:3000`;

const PRODUCTION_ENV_VARS = {
  'NEXT_PUBLIC_SUPABASE_URL': 'https://ubjujxtvlubxowsphvuk.supabase.co',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4',
  'FORCE_SUPABASE': 'true',
  'NODE_ENV': 'production',
  'APP_NAME': 'LUMO Inventory Management',
  'APP_VERSION': '2.0.0',
  'NEXTAUTH_SECRET': 'lumo-super-secret-production-key-2024-secure',
  'NEXTAUTH_URL': 'https://lumo-alesierraaltas-projects.vercel.app'
};

class DevProdEnvSetup {
  constructor() {
    this.rootDir = process.cwd();
    this.envLocalPath = path.join(this.rootDir, '.env.local');
  }

  log(level, message) {
    const colors = {
      info: '\x1b[34m',    // Blue
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m'     // Reset
    };
    
    const timestamp = new Date().toISOString().substring(11, 19);
    console.log(`${colors[level]}[${timestamp}] [ENV-SETUP] ${message}${colors.reset}`);
  }

  async setupDevelopmentEnv() {
    this.log('info', 'Configurando entorno de DESARROLLO...');
    
    try {
      // Crear .env.local para desarrollo
      fs.writeFileSync(this.envLocalPath, DEV_ENV_VARS);
      this.log('success', '✅ .env.local creado para desarrollo');
      
      // Verificar que existe
      if (fs.existsSync(this.envLocalPath)) {
        this.log('success', '✅ Archivo .env.local verificado');
        return true;
      } else {
        this.log('error', '❌ No se pudo crear .env.local');
        return false;
      }
    } catch (error) {
      this.log('error', `❌ Error configurando desarrollo: ${error.message}`);
      return false;
    }
  }

  async setupProductionEnv() {
    this.log('info', 'Configurando entorno de PRODUCCIÓN en Vercel...');
    
    let successCount = 0;
    let totalCount = Object.keys(PRODUCTION_ENV_VARS).length;
    
    for (const [key, value] of Object.entries(PRODUCTION_ENV_VARS)) {
      try {
        this.log('info', `Configurando ${key}...`);
        
        // Usar vercel env add para cada variable
        const command = `echo "${value}" | vercel env add ${key} production`;
        execSync(command, { stdio: 'pipe' });
        
        this.log('success', `✅ ${key} configurado en Vercel`);
        successCount++;
      } catch (error) {
        this.log('warning', `⚠️ ${key} ya existe o error: ${error.message}`);
        // Continuar con las demás variables
      }
    }
    
    return successCount;
  }

  async verifySetup() {
    this.log('info', 'Verificando configuración...');
    
    // Verificar archivo local
    const localExists = fs.existsSync(this.envLocalPath);
    this.log(localExists ? 'success' : 'error', 
      localExists ? '✅ .env.local existe' : '❌ .env.local no existe');
    
    // Verificar variables de Vercel
    try {
      const vercelEnvs = execSync('vercel env ls', { encoding: 'utf8' });
      this.log('success', '✅ Variables de Vercel verificadas');
      console.log('\n📋 Variables en Vercel:');
      console.log(vercelEnvs);
    } catch (error) {
      this.log('error', '❌ Error verificando variables de Vercel');
    }
    
    return localExists;
  }

  async displaySummary(devSuccess, prodSuccess) {
    console.log(`
🎯 CONFIGURACIÓN COMPLETA DE AMBIENTES
=====================================

📊 RESULTADOS:
${devSuccess ? '✅' : '❌'} Desarrollo: ${devSuccess ? 'Configurado' : 'Error'}
✅ Producción: ${prodSuccess}/8 variables configuradas

🗄️ BASES DE DATOS:
• DEV:  ndprriqyhddjoixrlqnz.supabase.co
• PROD: ubjujxtvlubxowsphvuk.supabase.co

🔧 CONFIGURACIÓN:
• Local (.env.local): Base de datos DEV
• Vercel (producción): Base de datos PROD

📋 PRÓXIMOS PASOS:
1. Verificar en Vercel Dashboard las variables
2. Hacer redeploy: npm run deploy
3. Probar aplicación en desarrollo: npm run dev
4. Probar aplicación en producción: https://lumo-alesierraaltas-projects.vercel.app

🔗 ENLACES ÚTILES:
• Vercel Dashboard: https://vercel.com/dashboard
• Supabase DEV: https://supabase.com/dashboard/project/ndprriqyhddjoixrlqnz
• Supabase PROD: https://supabase.com/dashboard/project/ubjujxtvlubxowsphvuk
`);
  }
}

async function main() {
  console.log(`
🚀 CONFIGURACIÓN COMPLETA DEV/PROD
==================================
Configurando ambientes de desarrollo y producción...
`);

  const setup = new DevProdEnvSetup();
  
  try {
    // Configurar desarrollo
    const devSuccess = await setup.setupDevelopmentEnv();
    
    // Configurar producción
    const prodSuccess = await setup.setupProductionEnv();
    
    // Verificar configuración
    await setup.verifySetup();
    
    // Mostrar resumen
    await setup.displaySummary(devSuccess, prodSuccess);
    
    if (devSuccess && prodSuccess > 0) {
      console.log('\n🎉 ¡Configuración completada exitosamente!');
      console.log('💡 Ejecuta: npm run dev (desarrollo) o npm run deploy (producción)');
    } else {
      console.log('\n⚠️ Configuración parcial completada.');
      console.log('Revisa los errores y configura manualmente si es necesario.');
    }
    
  } catch (error) {
    console.error('❌ Error durante la configuración:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { DevProdEnvSetup }; 