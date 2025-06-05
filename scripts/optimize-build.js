#!/usr/bin/env node

/**
 * Optimiza el proceso de build combinando varios pasos de preparación
 * para reducir el tiempo de build de 8 minutos a menos.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// Identificar si estamos en Windows
const isWindows = os.platform() === 'win32';

console.log('🚀 Iniciando optimización del build...');

// Función para ejecutar comandos con mejor rendimiento
function execute(command, options = {}) {
  const startTime = Date.now();
  try {
    console.log(`⚙️ Ejecutando: ${command}`);
    const output = execSync(command, { 
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options
    });
    const duration = (Date.now() - startTime) / 1000;
    console.log(`✅ Completado en ${duration.toFixed(2)}s: ${command}`);
    return output;
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    console.error(`❌ Error (${duration.toFixed(2)}s): ${command}`);
    console.error(error.message);
    if (!options.continueOnError) {
      process.exit(1);
    }
    return null;
  }
}

// Asegurarse de que existe el directorio de node_modules/.cache
const cacheDir = path.join(process.cwd(), 'node_modules/.cache');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

// Crear archivo .swcrc para optimizar la compilación
const swcConfig = {
  jsc: {
    parser: {
      syntax: "typescript",
      tsx: true,
      dynamicImport: true
    },
    transform: {
      react: {
        runtime: "automatic",
        pragma: "React.createElement",
        pragmaFrag: "React.Fragment",
        throwIfNamespace: true,
        development: process.env.NODE_ENV !== "production",
        useBuiltins: true
      }
    }
  },
  module: {
    type: "es6"
  },
  minify: process.env.NODE_ENV === "production"
};

fs.writeFileSync(path.join(process.cwd(), '.swcrc'), JSON.stringify(swcConfig, null, 2));

console.log('🧹 Limpiando caches para optimizar rendimiento...');
try {
  // Limpiar caché de Next.js usando comandos compatibles con Windows
  if (fs.existsSync('.next')) {
    if (isWindows) {
      execute('if exist .next\\cache rmdir /s /q .next\\cache', { continueOnError: true });
    } else {
      execute('rm -rf .next/cache', { continueOnError: true });
    }
  }

  // Verificar espacio en disco (compatible con Windows)
  if (isWindows) {
    execute('wmic logicaldisk get size,freespace,caption', { continueOnError: true });
  } else {
    execute('df -h', { continueOnError: true });
  }
} catch (error) {
  console.log('Advertencia al limpiar caché:', error.message);
}

console.log('🔍 Ejecutando pasos de prebuild en paralelo...');

// Combinar pasos clave de preparación
Promise.all([
  new Promise(resolve => {
    execute('node scripts/fix-prisma-binaries.js', { continueOnError: true });
    resolve();
  }),
  new Promise(resolve => {
    execute('node scripts/manifest-validator.js', { continueOnError: true });
    resolve();
  }),
  new Promise(resolve => {
    execute('node scripts/fix-client-components.js', { continueOnError: true });
    resolve();
  })
]).then(() => {
  console.log('🔧 Configurando entorno para build rápido...');
  
  // Establecer variables de entorno para optimizar el proceso
  process.env.NEXT_TELEMETRY_DISABLED = '1';
  process.env.NEXT_OPTIMIZE_FONTS = '1';
  
  console.log('🚀 Preparación de build optimizada completada!');
}); 