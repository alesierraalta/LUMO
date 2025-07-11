#!/usr/bin/env node

/**
 * Script para ejecutar pruebas de integración con diferentes configuraciones
 * Uso: node scripts/run-integration-tests.js [opciones]
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Parsear argumentos de línea de comandos
const args = process.argv.slice(2);
const options = {
  environment: 'development',
  suite: 'all',
  verbose: false,
  coverage: false,
  watch: false,
  bail: false
};

// Procesar argumentos
for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--env':
    case '-e':
      options.environment = args[++i] || 'development';
      break;
    case '--suite':
    case '-s':
      options.suite = args[++i] || 'all';
      break;
    case '--verbose':
    case '-v':
      options.verbose = true;
      break;
    case '--coverage':
    case '-c':
      options.coverage = true;
      break;
    case '--watch':
    case '-w':
      options.watch = true;
      break;
    case '--bail':
    case '-b':
      options.bail = true;
      break;
    case '--help':
    case '-h':
      showHelp();
      process.exit(0);
  }
}

function showHelp() {
  console.log(`
📋 Integration Test Runner

Usage: node scripts/run-integration-tests.js [options]

Options:
  --env, -e <environment>    Environment to test (development/production) [default: development]
  --suite, -s <suite>        Test suite to run [default: all]
                            Available suites:
                              - all: Run all integration tests
                              - auth: Authentication tests
                              - categories: Category management tests
                              - inventory: Inventory management tests
                              - users: User management tests
                              - performance: Performance benchmarking
                              - production: Production validation tests
                              - sync: Environment synchronization tests
  --verbose, -v             Show detailed output
  --coverage, -c            Generate code coverage report
  --watch, -w               Watch mode for development
  --bail, -b                Stop on first test failure
  --help, -h                Show this help message

Examples:
  # Run all tests in development environment
  node scripts/run-integration-tests.js

  # Run auth tests in production with coverage
  node scripts/run-integration-tests.js --env production --suite auth --coverage

  # Run performance benchmarks with verbose output
  node scripts/run-integration-tests.js --suite performance --verbose

  # Watch mode for development
  node scripts/run-integration-tests.js --suite categories --watch
`);
}

// Mapeo de suites a patrones de archivos
const suitePatterns = {
  all: '',
  auth: 'auth',
  categories: 'categories|category',
  inventory: 'inventory',
  users: 'users',
  performance: 'performance-benchmarking',
  production: 'vercel-production-validation',
  sync: 'environment-sync-validation'
};

// Construir comando Jest
function buildJestCommand() {
  const jestArgs = ['run', 'test:integration', '--'];

  // Agregar patrón de suite si no es "all"
  if (options.suite !== 'all') {
    const pattern = suitePatterns[options.suite];
    if (pattern) {
      jestArgs.push(`--testPathPattern="${pattern}"`);
    } else {
      console.error(`❌ Unknown suite: ${options.suite}`);
      showHelp();
      process.exit(1);
    }
  }

  // Agregar opciones adicionales
  if (options.verbose) {
    jestArgs.push('--verbose');
  }

  if (options.coverage) {
    jestArgs.push('--coverage');
  }

  if (options.watch) {
    jestArgs.push('--watch');
  }

  if (options.bail) {
    jestArgs.push('--bail');
  }

  return jestArgs;
}

// Configurar variables de entorno
function setupEnvironment() {
  const env = { ...process.env };

  // Establecer modo de test
  env.TEST_MODE = options.environment;

  // Cargar variables de entorno según el ambiente
  if (options.environment === 'production') {
    console.log('🌐 Running tests against PRODUCTION environment');
    console.log('⚠️  WARNING: This will interact with the production database!');
    console.log('');
    
    // En producción, esperamos que las variables estén configuradas
    // o usar las de .env.production si existe
    const prodEnvPath = path.join(process.cwd(), '.env.production');
    if (fs.existsSync(prodEnvPath)) {
      require('dotenv').config({ path: prodEnvPath });
    }
  } else {
    console.log('💻 Running tests against DEVELOPMENT environment');
    
    // Cargar .env.local para desarrollo
    const localEnvPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(localEnvPath)) {
      require('dotenv').config({ path: localEnvPath });
    }
  }

  return env;
}

// Función principal
async function runTests() {
  console.log('🚀 Starting Integration Tests');
  console.log('================================');
  console.log(`Environment: ${options.environment}`);
  console.log(`Test Suite: ${options.suite}`);
  console.log(`Options: ${Object.entries(options)
    .filter(([key, value]) => value === true)
    .map(([key]) => key)
    .join(', ') || 'none'}`);
  console.log('================================\n');

  // Configurar entorno
  const env = setupEnvironment();

  // Construir comando
  const jestArgs = buildJestCommand();

  // Ejecutar tests
  console.log(`Executing: npm ${jestArgs.join(' ')}\n`);

  const jest = spawn('npm', jestArgs, {
    env,
    stdio: 'inherit',
    shell: true
  });

  jest.on('error', (error) => {
    console.error('❌ Failed to start test runner:', error);
    process.exit(1);
  });

  jest.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ All tests completed successfully!');
      
      // Mostrar ubicación de reportes si se generaron
      if (options.coverage) {
        console.log('\n📊 Coverage report available at: ./coverage/lcov-report/index.html');
      }
      
      // Mostrar benchmark results si se ejecutaron
      if (options.suite === 'performance' || options.suite === 'all') {
        const benchmarkDir = path.join(process.cwd(), 'benchmark-results');
        if (fs.existsSync(benchmarkDir)) {
          const files = fs.readdirSync(benchmarkDir);
          if (files.length > 0) {
            console.log(`\n📈 Benchmark results saved to: ./benchmark-results/`);
          }
        }
      }
    } else {
      console.log(`\n❌ Tests failed with exit code ${code}`);
    }
    
    process.exit(code);
  });
}

// Manejo de señales para limpieza
process.on('SIGINT', () => {
  console.log('\n\n🛑 Test execution interrupted by user');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Test execution terminated');
  process.exit(143);
});

// Ejecutar tests
runTests().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});