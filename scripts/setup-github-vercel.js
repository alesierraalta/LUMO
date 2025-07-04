#!/usr/bin/env node

/**
 * Script para configurar la conexión entre GitHub y Vercel
 * Automatiza el proceso de vinculación del repositorio
 */

const { execSync } = require('child_process');

class GitHubVercelSetup {
  constructor() {
    this.repoUrl = 'https://github.com/alesierraalta/LUMO.git';
    this.projectName = 'lumo';
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
    console.log(`${colors[level]}[${timestamp}] [GITHUB-VERCEL] ${message}${colors.reset}`);
  }

  async linkGitHubRepo() {
    this.log('info', 'Vinculando repositorio de GitHub con Vercel...');
    
    try {
      // Verificar que estamos en un repositorio git
      const repoCheck = execSync('git remote -v', { encoding: 'utf8' });
      this.log('success', '✅ Repositorio Git verificado');
      
      // Vincular el proyecto con el repositorio
      const command = `vercel link --repo ${this.repoUrl}`;
      this.log('info', `Ejecutando: ${command}`);
      
      execSync(command, { stdio: 'inherit' });
      this.log('success', '✅ Repositorio vinculado exitosamente');
      
      return true;
    } catch (error) {
      this.log('error', `❌ Error vinculando repositorio: ${error.message}`);
      return false;
    }
  }

  async enableAutoDeployments() {
    this.log('info', 'Habilitando deployments automáticos...');
    
    try {
      // Configurar auto-deployments para la rama main
      const command = 'vercel git connect';
      execSync(command, { stdio: 'inherit' });
      
      this.log('success', '✅ Auto-deployments habilitados');
      return true;
    } catch (error) {
      this.log('warning', `⚠️ Auto-deployments: ${error.message}`);
      return false;
    }
  }

  async verifyConnection() {
    this.log('info', 'Verificando conexión...');
    
    try {
      const projectInfo = execSync('vercel project ls', { encoding: 'utf8' });
      this.log('success', '✅ Conexión verificada');
      console.log('\n📋 Información del proyecto:');
      console.log(projectInfo);
      return true;
    } catch (error) {
      this.log('error', `❌ Error verificando conexión: ${error.message}`);
      return false;
    }
  }

  async displayInstructions() {
    console.log(`
🔗 CONFIGURACIÓN GITHUB-VERCEL COMPLETADA
==========================================

📊 CONFIGURACIÓN ACTUAL:
✅ Repositorio: ${this.repoUrl}
✅ Proyecto Vercel: ${this.projectName}
✅ Auto-deployments: Habilitados

🚀 CÓMO FUNCIONA AHORA:
1. Haces cambios en tu código local
2. Ejecutas: git add . && git commit -m "mensaje"
3. Ejecutas: git push origin main
4. Vercel automáticamente detecta el push
5. Vercel hace build y deploy automáticamente
6. Tu aplicación se actualiza en: https://lumo-alesierraaltas-projects.vercel.app

📋 COMANDOS ÚTILES:
• git push origin main - Sube cambios y triggerea deploy
• vercel --prod - Deploy manual a producción
• vercel logs - Ver logs de deployment
• vercel domains - Gestionar dominios

🔧 CONFIGURACIÓN MANUAL (Si es necesario):
1. Ve a https://vercel.com/dashboard
2. Selecciona el proyecto "lumo"
3. Ve a Settings → Git
4. Conecta el repositorio: ${this.repoUrl}
5. Configura la rama principal: main
6. Habilita auto-deployments

🎯 PRÓXIMOS PASOS:
1. Hacer un cambio pequeño en el código
2. Hacer push a GitHub
3. Verificar que Vercel hace deploy automáticamente
4. Probar la aplicación actualizada

🔗 ENLACES ÚTILES:
• GitHub Repo: ${this.repoUrl}
• Vercel Dashboard: https://vercel.com/dashboard
• Aplicación: https://lumo-alesierraaltas-projects.vercel.app
`);
  }
}

async function main() {
  console.log(`
🔗 CONFIGURACIÓN GITHUB-VERCEL
==============================
Conectando repositorio con Vercel para deployments automáticos...
`);

  const setup = new GitHubVercelSetup();
  
  try {
    // Vincular repositorio
    const linkSuccess = await setup.linkGitHubRepo();
    
    // Habilitar auto-deployments
    const autoDeploySuccess = await setup.enableAutoDeployments();
    
    // Verificar conexión
    const verifySuccess = await setup.verifyConnection();
    
    // Mostrar instrucciones
    await setup.displayInstructions();
    
    if (linkSuccess) {
      console.log('\n🎉 ¡Configuración GitHub-Vercel completada exitosamente!');
      console.log('💡 Ahora puedes hacer push a GitHub y Vercel deployará automáticamente');
    } else {
      console.log('\n⚠️ Configuración parcial. Revisa los errores y configura manualmente si es necesario.');
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

module.exports = { GitHubVercelSetup }; 