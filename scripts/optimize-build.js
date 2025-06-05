#!/usr/bin/env node

/**
 * Optimiza el proceso de build combinando varios pasos de preparación
 * para reducir el tiempo de build de 8 minutos a menos.
 * Versión Turbo: Usa técnicas de paralelización y caché avanzadas.
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const os = require('os');
const crypto = require('crypto');

// Identificar si estamos en Windows
const isWindows = os.platform() === 'win32';
const cpuCount = os.cpus().length;
const startTime = Date.now();
const workspaceRoot = process.cwd();

// Ejecutar hasta este número de tareas en paralelo
const MAX_PARALLEL_TASKS = Math.max(1, Math.min(cpuCount - 1, 4));

console.log(`🚀 Iniciando optimización del build (modo TURBO)...`);
console.log(`📊 Sistema: ${os.platform()} | CPUs: ${cpuCount} | Paralelo: ${MAX_PARALLEL_TASKS}`);

// Verificar memoria disponible
const totalMem = Math.floor(os.totalmem() / (1024 * 1024));
const freeMem = Math.floor(os.freemem() / (1024 * 1024));
console.log(`📊 Memoria: ${freeMem}MB libre de ${totalMem}MB total`);

// Función para ejecutar comandos en paralelo con mejor rendimiento
async function executeParallel(commands, options = {}) {
  const results = [];
  const runningTasks = new Set();
  let completedCount = 0;
  
  return new Promise((resolve, reject) => {
    // Función para ejecutar un comando
    const runCommand = (command, index) => {
      const startTime = Date.now();
      console.log(`⚙️ [${index + 1}/${commands.length}] Iniciando: ${command}`);
      
      const childProcess = spawn(isWindows ? 'cmd.exe' : 'sh', [
        isWindows ? '/c' : '-c',
        command
      ], {
        stdio: ['ignore', 'pipe', 'pipe'],
        ...options
      });
      
      let stdout = '';
      let stderr = '';
      
      childProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      childProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      childProcess.on('close', (code) => {
        runningTasks.delete(childProcess);
        completedCount++;
        
        const duration = (Date.now() - startTime) / 1000;
        
        if (code === 0) {
          console.log(`✅ [${index + 1}/${commands.length}] Completado en ${duration.toFixed(2)}s: ${command}`);
          results[index] = { success: true, stdout, stderr, duration };
        } else {
          console.error(`❌ [${index + 1}/${commands.length}] Error (${duration.toFixed(2)}s): ${command}`);
          if (stderr) console.error(stderr);
          results[index] = { success: false, stdout, stderr, duration };
        }
        
        // Iniciar la siguiente tarea si hay alguna
        if (nextIndex < commands.length) {
          runCommand(commands[nextIndex], nextIndex);
          nextIndex++;
        } else if (completedCount === commands.length) {
          // Todas las tareas están completas
          resolve(results);
        }
      });
      
      runningTasks.add(childProcess);
    };
    
    // Iniciar las primeras tareas hasta MAX_PARALLEL_TASKS
    let nextIndex = Math.min(MAX_PARALLEL_TASKS, commands.length);
    for (let i = 0; i < Math.min(MAX_PARALLEL_TASKS, commands.length); i++) {
      runCommand(commands[i], i);
    }
    
    // Si no hay comandos para ejecutar, resolver inmediatamente
    if (commands.length === 0) {
      resolve([]);
    }
  });
}

// Función para ejecutar un comando con registro avanzado
function execute(command, options = {}) {
  const startTime = Date.now();
  try {
    console.log(`⚙️ Ejecutando: ${command}`);
    const output = execSync(command, { 
      stdio: options.silent ? 'ignore' : ['pipe', 'pipe', 'pipe'],
      ...options
    });
    const duration = (Date.now() - startTime) / 1000;
    console.log(`✅ Completado en ${duration.toFixed(2)}s: ${command}`);
    return output?.toString() || '';
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    console.error(`❌ Error (${duration.toFixed(2)}s): ${command}`);
    if (error.stderr) console.error(error.stderr.toString());
    if (!options.continueOnError) {
      process.exit(1);
    }
    return null;
  }
}

// Verificar y crear directorio de caché
const cacheDir = path.join(workspaceRoot, '.next/cache/build-optimizer');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

// Hash de los archivos clave para determinar si se necesita reoptimizar
function getFilesHash(files) {
  try {
    const hash = crypto.createHash('sha256');
    for (const file of files) {
      const filePath = path.join(workspaceRoot, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath);
        hash.update(content);
      }
    }
    return hash.digest('hex');
  } catch (error) {
    console.error('Error calculando hash:', error.message);
    return Date.now().toString();
  }
}

// Verificar caché existente
const filesToHash = [
  'next.config.js',
  'package.json',
  'tsconfig.json',
  'prisma/schema.prisma'
];

const filesHash = getFilesHash(filesToHash);
const cacheFile = path.join(cacheDir, `build-cache-${filesHash}.json`);
const useCachedConfig = fs.existsSync(cacheFile);

if (useCachedConfig) {
  console.log('✅ Usando configuración en caché, saltando regeneración...');
} else {
  console.log('🔄 Generando nueva configuración óptima...');
  
  // Crear archivo .swcrc optimizado para compilación
  const swcConfig = {
    jsc: {
      parser: {
        syntax: "typescript",
        tsx: true,
        dynamicImport: true,
        decorators: true
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
      },
      target: "es2020",
      loose: true,
      externalHelpers: true
    },
    module: {
      type: "es6",
      noInterop: false
    },
    minify: process.env.NODE_ENV === "production",
    sourceMaps: process.env.NODE_ENV !== "production",
    inlineSourcesContent: false,
    env: {
      targets: {
        node: 18
      }
    }
  };

  fs.writeFileSync(path.join(workspaceRoot, '.swcrc'), JSON.stringify(swcConfig, null, 2));
  
  // Optimizar Babel (si existe)
  const babelConfig = {
    presets: [
      ["next/babel", {
        "preset-env": {
          targets: {
            node: 18
          },
          bugfixes: true,
          loose: true,
          modules: "auto"
        }
      }]
    ],
    plugins: [
      ["@babel/plugin-transform-runtime", {
        regenerator: true,
        helpers: true,
        useESModules: true
      }]
    ]
  };

  fs.writeFileSync(path.join(workspaceRoot, '.babelrc'), JSON.stringify(babelConfig, null, 2));
  
  // Guardar hash de configuración
  fs.writeFileSync(cacheFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    hash: filesHash,
    configs: ["swc", "babel"]
  }));
}

// Optimizar el espacio de trabajo
console.log('🧹 Limpiando espacio de trabajo para optimizar rendimiento...');

// 1. Eliminar archivos temporales en paralelo
const cleanupTasks = [
  // Limpiar caché de Next.js
  isWindows 
    ? 'if exist .next\\cache\\images rmdir /s /q .next\\cache\\images'
    : 'rm -rf .next/cache/images',
  
  // Limpiar logs antiguos
  isWindows 
    ? 'if exist logs\\*.log del /q logs\\*.log'
    : 'rm -f logs/*.log',
    
  // Limpiar archivos temporales
  isWindows 
    ? 'if exist tmp\\* del /q tmp\\*'
    : 'rm -f tmp/*'
];

// 2. Optimizar dependencias node_modules
if (freeMem > 2048) { // Solo si hay suficiente memoria
  // Deduplicar dependencias solo si hay suficiente memoria y no hay caché
  if (!useCachedConfig) {
    cleanupTasks.push('npx node-prune');
  }
}

// 3. Ejecutar tareas de limpieza en paralelo
executeParallel(cleanupTasks.filter(cmd => cmd), { continueOnError: true })
  .then(() => {
    console.log('✅ Limpieza completada');
    
    // Establecer variables de entorno para optimizar el proceso
    process.env.NEXT_TELEMETRY_DISABLED = '1';
    process.env.NEXT_OPTIMIZE_FONTS = '1';
    process.env.NEXT_OPTIMIZE_IMAGES = '1';
    process.env.NEXT_MINIMAL_TRACE = '1';
    
    // Configurar Terser para máxima compresión en producción
    if (process.env.NODE_ENV === 'production') {
      process.env.NEXT_OPTIMIZE_CSS = '1';
    }
    
    // Optimizar la memoria para Node
    const memLimitMb = Math.max(2048, Math.min(freeMem * 0.8, 8192));
    process.env.NODE_OPTIONS = `--max-old-space-size=${Math.floor(memLimitMb)}`;
    
    console.log(`🔧 NODE_OPTIONS: ${process.env.NODE_OPTIONS}`);
    
    // Ejecutar pasos de prebuild esenciales en paralelo
    const buildTasks = [
      'node scripts/fix-prisma-binaries.js',
      'node scripts/manifest-validator.js',
      'node scripts/fix-client-components.js'
    ];
    
    console.log('🔍 Ejecutando pasos críticos de prebuild en paralelo...');
    
    return executeParallel(buildTasks, { continueOnError: true });
  })
  .then(() => {
    // Escribir un archivo de marcador de preparación
    fs.writeFileSync(
      path.join(workspaceRoot, '.next', 'build-prep-complete'),
      `build-prep-completed=${Date.now()}`
    );
    
    const totalDuration = (Date.now() - startTime) / 1000;
    console.log(`🚀 Preparación de build optimizada completada en ${totalDuration.toFixed(2)}s!`);
  })
  .catch(error => {
    console.error('Error en la optimización del build:', error);
    process.exit(1);
  }); 