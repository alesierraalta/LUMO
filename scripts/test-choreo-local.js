#!/usr/bin/env node

/**
 * 🚀 LUMO - Sistema de Testing Local para Choreo
 * 
 * Este script simula las condiciones de deployment de Choreo localmente
 * para detectar errores antes del deployment real (ahorra 10-15 min por fallo)
 * 
 * Uso:
 *   npm run test:choreo-quick     # Test rápido (2-3 min)
 *   npm run test:choreo-full      # Test completo (5-8 min)
 *   node scripts/test-choreo-local.js --mode=quick
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

class ChoreoLocalTester {
  constructor(options = {}) {
    this.mode = options.mode || 'quick'; // quick | full
    this.verbose = options.verbose || false;
    this.startTime = Date.now();
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const colors = {
      info: '\x1b[36m',    // cyan
      success: '\x1b[32m', // green
      warning: '\x1b[33m', // yellow
      error: '\x1b[31m',   // red
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async runTest(name, testFn) {
    this.log(`🧪 Testing: ${name}`, 'info');
    const startTime = Date.now();
    
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      if (result.success) {
        this.results.passed++;
        this.log(`✅ ${name} (${duration}ms)`, 'success');
      } else {
        this.results.failed++;
        this.log(`❌ ${name}: ${result.error} (${duration}ms)`, 'error');
      }
      
      this.results.tests.push({
        name,
        success: result.success,
        duration,
        error: result.error,
        details: result.details
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.failed++;
      this.log(`💥 ${name}: ${error.message} (${duration}ms)`, 'error');
      
      this.results.tests.push({
        name,
        success: false,
        duration,
        error: error.message
      });
      
      return { success: false, error: error.message };
    }
  }

  // 1. Validación de Variables de Entorno
  async testEnvironmentVariables() {
    return this.runTest('Environment Variables', async () => {
      const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'JWT_SECRET'
      ];
      
      const missing = requiredVars.filter(varName => !process.env[varName]);
      
      if (missing.length > 0) {
        return {
          success: false,
          error: `Missing variables: ${missing.join(', ')}`,
          details: 'Check your .env.local file'
        };
      }
      
      return {
        success: true,
        details: `All ${requiredVars.length} required variables present`
      };
    });
  }

  // 2. Test de Build de Producción
  async testProductionBuild() {
    return this.runTest('Production Build', async () => {
      try {
        // Limpiar build anterior (Windows compatible)
        if (fs.existsSync('.next')) {
          try {
            if (process.platform === 'win32') {
              execSync('rmdir /s /q .next', { stdio: this.verbose ? 'inherit' : 'pipe' });
            } else {
              execSync('rm -rf .next', { stdio: this.verbose ? 'inherit' : 'pipe' });
            }
          } catch (error) {
            // Si falla el comando, intentar con fs
            fs.rmSync('.next', { recursive: true, force: true });
          }
        }
        
        // Build de producción
        this.log('Building for production...', 'info');
        execSync('npm run build', { 
          stdio: this.verbose ? 'inherit' : 'pipe',
          timeout: 120000 // 2 minutos timeout
        });
        
        // Verificar que se crearon los archivos necesarios
        const requiredFiles = [
          '.next/BUILD_ID',
          '.next/standalone/server.js',
          '.next/static'
        ];
        
        const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
        
        if (missingFiles.length > 0) {
          return {
            success: false,
            error: `Missing build files: ${missingFiles.join(', ')}`
          };
        }
        
        return {
          success: true,
          details: 'Production build completed successfully'
        };
      } catch (error) {
        return {
          success: false,
          error: `Build failed: ${error.message}`
        };
      }
    });
  }

  // 3. Test de Servidor Standalone
  async testStandaloneServer() {
    return this.runTest('Standalone Server', async () => {
      return new Promise((resolve) => {
        let serverProcess;
        let serverStarted = false;
        const timeout = 30000; // 30 segundos
        
        try {
          // Iniciar servidor standalone
          serverProcess = spawn('node', ['.next/standalone/server.js'], {
            env: { ...process.env, PORT: '3001' },
            stdio: this.verbose ? 'inherit' : 'pipe'
          });
          
          // Timeout para startup
          const startupTimeout = setTimeout(() => {
            if (!serverStarted) {
              serverProcess?.kill();
              resolve({
                success: false,
                error: 'Server startup timeout (30s)'
              });
            }
          }, timeout);
          
          // Test de conectividad
          const testConnection = () => {
            const req = http.get('http://localhost:3001/api/health', (res) => {
              clearTimeout(startupTimeout);
              serverStarted = true;
              serverProcess?.kill();
              
              if (res.statusCode === 200) {
                resolve({
                  success: true,
                  details: `Server responded with status ${res.statusCode}`
                });
              } else {
                resolve({
                  success: false,
                  error: `Health check failed with status ${res.statusCode}`
                });
              }
            });
            
            req.on('error', (error) => {
              // Reintentar conexión si el servidor aún no está listo
              if (!serverStarted && error.code === 'ECONNREFUSED') {
                setTimeout(testConnection, 1000);
              } else {
                clearTimeout(startupTimeout);
                serverProcess?.kill();
                resolve({
                  success: false,
                  error: `Connection failed: ${error.message}`
                });
              }
            });
          };
          
          // Esperar un poco antes del primer intento
          setTimeout(testConnection, 2000);
          
        } catch (error) {
          resolve({
            success: false,
            error: `Failed to start server: ${error.message}`
          });
        }
      });
    });
  }

  // 4. Test de Docker Build (solo en modo full)
  async testDockerBuild() {
    if (this.mode === 'quick') {
      this.log('⏩ Skipping Docker test in quick mode', 'warning');
      return { success: true, skipped: true };
    }
    
    return this.runTest('Docker Build', async () => {
      try {
        // Verificar que Docker está disponible
        execSync('docker --version', { stdio: 'pipe' });
        
        // Build de imagen Docker
        this.log('Building Docker image...', 'info');
        execSync('docker build -t lumo-test .', {
          stdio: this.verbose ? 'inherit' : 'pipe',
          timeout: 300000 // 5 minutos
        });
        
        return {
          success: true,
          details: 'Docker image built successfully'
        };
      } catch (error) {
        if (error.message.includes('docker: command not found')) {
          this.results.warnings++;
          return {
            success: true,
            warning: 'Docker not available - skipping test',
            details: 'Install Docker to enable container testing'
          };
        }
        
        return {
          success: false,
          error: `Docker build failed: ${error.message}`
        };
      }
    });
  }

  // 5. Test de Configuración de Choreo
  async testChoreoConfig() {
    return this.runTest('Choreo Configuration', async () => {
      const choreoFile = 'choreo.yaml';
      
      if (!fs.existsSync(choreoFile)) {
        return {
          success: false,
          error: 'choreo.yaml not found'
        };
      }
      
      const content = fs.readFileSync(choreoFile, 'utf8');
      const issues = [];
      
      // Verificaciones básicas
      if (!content.includes('deploy:')) {
        issues.push('Missing deploy configuration');
      }
      
      if (!content.includes('env:')) {
        issues.push('Missing environment variables section');
      }
      
      if (!content.includes('healthCheck:')) {
        issues.push('Missing health check configuration');
      }
      
      if (issues.length > 0) {
        return {
          success: false,
          error: issues.join(', ')
        };
      }
      
      return {
        success: true,
        details: 'Choreo configuration valid'
      };
    });
  }

  // 6. Test de Dependencias
  async testDependencies() {
    return this.runTest('Dependencies Check', async () => {
      try {
        // Verificar package.json
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        const requiredScripts = ['build', 'start'];
        const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
        
        if (missingScripts.length > 0) {
          return {
            success: false,
            error: `Missing scripts: ${missingScripts.join(', ')}`
          };
        }
        
        // Verificar node_modules
        if (!fs.existsSync('node_modules')) {
          return {
            success: false,
            error: 'node_modules not found - run npm install'
          };
        }
        
        return {
          success: true,
          details: 'All dependencies and scripts present'
        };
      } catch (error) {
        return {
          success: false,
          error: `Dependencies check failed: ${error.message}`
        };
      }
    });
  }

  // Ejecutar todos los tests
  async runAllTests() {
    this.log(`🚀 Starting Choreo Local Testing (${this.mode} mode)`, 'info');
    this.log('═══════════════════════════════════════════════', 'info');
    
    // Tests en orden de importancia
    await this.testDependencies();
    await this.testEnvironmentVariables();
    await this.testChoreoConfig();
    await this.testProductionBuild();
    await this.testStandaloneServer();
    await this.testDockerBuild();
    
    this.showResults();
  }

  showResults() {
    const totalTime = Date.now() - this.startTime;
    const totalTests = this.results.passed + this.results.failed;
    
    this.log('═══════════════════════════════════════════════', 'info');
    this.log('📊 RESULTADOS DEL TEST', 'info');
    this.log('═══════════════════════════════════════════════', 'info');
    
    this.log(`✅ Tests pasados: ${this.results.passed}`, 'success');
    this.log(`❌ Tests fallidos: ${this.results.failed}`, this.results.failed > 0 ? 'error' : 'info');
    this.log(`⚠️  Advertencias: ${this.results.warnings}`, this.results.warnings > 0 ? 'warning' : 'info');
    this.log(`⏱️  Tiempo total: ${(totalTime / 1000).toFixed(1)}s`, 'info');
    
    if (this.results.failed === 0) {
      this.log('🎉 ¡TODOS LOS TESTS PASARON! Tu deployment debería funcionar en Choreo.', 'success');
      this.log('💡 Puedes proceder con el deployment con confianza.', 'success');
    } else {
      this.log('🚨 ALGUNOS TESTS FALLARON. Revisa los errores antes de hacer deployment.', 'error');
      this.log('💡 Esto te ahorra 10-15 minutos de deployment fallido en Choreo.', 'warning');
    }
    
    // Detalles de tests fallidos
    const failedTests = this.results.tests.filter(test => !test.success);
    if (failedTests.length > 0) {
      this.log('\n🔍 DETALLES DE ERRORES:', 'error');
      failedTests.forEach(test => {
        this.log(`   • ${test.name}: ${test.error}`, 'error');
      });
    }
    
    this.log('═══════════════════════════════════════════════', 'info');
    
    // Exit code para CI/CD
    process.exit(this.results.failed > 0 ? 1 : 0);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const args = process.argv.slice(2);
  const mode = args.find(arg => arg.startsWith('--mode='))?.split('=')[1] || 'quick';
  const verbose = args.includes('--verbose');
  
  const tester = new ChoreoLocalTester({ mode, verbose });
  tester.runAllTests().catch(console.error);
}

module.exports = ChoreoLocalTester; 