#!/usr/bin/env node

/**
 * Script para configurar variables de entorno en Vercel
 * Configura automáticamente las variables para producción
 */

const { execSync } = require('child_process');

const PRODUCTION_ENV_VARS = {
  // Base de datos de PRODUCCIÓN
  'NEXT_PUBLIC_SUPABASE_URL': 'https://ubjujxtvlubxowsphvuk.supabase.co',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4',
  
  // Configuración de aplicación
  'FORCE_SUPABASE': 'true',
  'NODE_ENV': 'production',
  'APP_NAME': 'LUMO Inventory Management',
  'APP_VERSION': '2.0.0',
  
  // Autenticación
  'NEXTAUTH_SECRET': 'lumo-super-secret-production-key-2024-secure',
  'NEXTAUTH_URL': 'https://lumo-alesierraaltas-projects.vercel.app'
};

class VercelEnvSetup {
  constructor() {
    this.projectName = 'lumo';
  }

  log(level, message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [ENV-SETUP] [${level.toUpperCase()}] ${message}`);
  }

  async setEnvironmentVariable(key, value) {
    try {
      const command = `vercel env add ${key} production`;
      this.log('info', `Setting ${key}...`);
      
      // Use echo to pipe the value to vercel env add
      const fullCommand = `echo "${value}" | ${command}`;
      execSync(fullCommand, { stdio: 'pipe' });
      
      this.log('success', `✅ ${key} configured`);
      return true;
    } catch (error) {
      this.log('error', `❌ Failed to set ${key}: ${error.message}`);
      return false;
    }
  }

  async setupAllVariables() {
    this.log('info', 'Starting Vercel environment setup...');
    
    let successCount = 0;
    let totalCount = Object.keys(PRODUCTION_ENV_VARS).length;
    
    for (const [key, value] of Object.entries(PRODUCTION_ENV_VARS)) {
      const success = await this.setEnvironmentVariable(key, value);
      if (success) successCount++;
    }
    
    console.log(`
🎯 VERCEL ENVIRONMENT SETUP COMPLETE
====================================
✅ Success: ${successCount}/${totalCount} variables configured
🗄️ Database: PRODUCTION (ubjujxtvlubxowsphvuk.supabase.co)
🌍 Environment: Production
🔒 Security: Environment variables secured

📋 NEXT STEPS:
1. Verify variables in Vercel Dashboard
2. Redeploy your application: vercel --prod
3. Test the production deployment
4. Configure your local .env.local for development

🔗 Vercel Dashboard: https://vercel.com/dashboard
🌐 Your App: https://lumo-alesierraaltas-projects.vercel.app
`);
    
    return successCount === totalCount;
  }

  async verifySetup() {
    this.log('info', 'Verifying environment setup...');
    
    try {
      const output = execSync('vercel env ls', { encoding: 'utf8' });
      this.log('info', 'Current environment variables:');
      console.log(output);
      return true;
    } catch (error) {
      this.log('error', `Failed to verify setup: ${error.message}`);
      return false;
    }
  }
}

// Función principal
async function main() {
  console.log(`
🚀 LUMO VERCEL ENVIRONMENT SETUP
================================
Configurando variables de entorno para producción...

📊 Variables a configurar:
${Object.keys(PRODUCTION_ENV_VARS).map(key => `  • ${key}`).join('\n')}
`);

  const setup = new VercelEnvSetup();
  
  try {
    const success = await setup.setupAllVariables();
    
    if (success) {
      await setup.verifySetup();
      console.log('\n🎉 ¡Configuración completada exitosamente!');
      console.log('\n💡 Ahora ejecuta: vercel --prod');
    } else {
      console.log('\n⚠️ Algunas variables no se pudieron configurar.');
      console.log('Configúralas manualmente en Vercel Dashboard.');
    }
  } catch (error) {
    console.error('Error durante la configuración:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { VercelEnvSetup, PRODUCTION_ENV_VARS }; 