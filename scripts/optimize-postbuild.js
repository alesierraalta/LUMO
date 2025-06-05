#!/usr/bin/env node

/**
 * Optimiza los procesos post-build combinando operaciones
 * y ejecutándolas de manera más eficiente.
 * Versión Turbo: Paralelización máxima y optimización de recursos.
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const os = require('os');
const zlib = require('zlib');

// Identificar si estamos en Windows
const isWindows = os.platform() === 'win32';
const cpuCount = os.cpus().length;
const startTime = Date.now();
const workspaceRoot = process.cwd();

// Ejecutar hasta este número de tareas en paralelo
const MAX_PARALLEL_TASKS = Math.max(1, Math.min(cpuCount - 1, 4));

console.log(`🚀 Iniciando optimización post-build (modo TURBO)...`);
console.log(`📊 Sistema: ${os.platform()} | CPUs: ${cpuCount} | Paralelo: ${MAX_PARALLEL_TASKS}`);

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

// Función para comprimir archivos JS/CSS en gzip
function compressFile(filePath, deleteOriginal = false) {
  if (!fs.existsSync(filePath)) return false;
  
  try {
    const content = fs.readFileSync(filePath);
    const compressed = zlib.gzipSync(content, { level: 9 });
    fs.writeFileSync(`${filePath}.gz`, compressed);
    
    if (deleteOriginal) {
      fs.unlinkSync(filePath);
    }
    
    return true;
  } catch (error) {
    console.error(`Error comprimiendo ${filePath}:`, error.message);
    return false;
  }
}

// Verificar que la carpeta standalone existe
const standaloneDir = path.join(workspaceRoot, '.next/standalone');
if (!fs.existsSync(standaloneDir)) {
  console.log('❌ No se encontró la carpeta standalone, verificando build...');
  process.exit(1);
}

// 1. Crear directorios necesarios de una vez
console.log('📁 Creando directorios necesarios...');
const dirsToCreate = [
  path.join(standaloneDir, 'scripts'),
  path.join(standaloneDir, 'prisma'),
  path.join(standaloneDir, 'node_modules/.prisma/client'),
  path.join(standaloneDir, '.next/server/app/api/inventory/import/process/dict'),
  path.join(standaloneDir, 'logs'),
  path.join(standaloneDir, 'tmp'),
  path.join(standaloneDir, 'node_modules/server-only')
];

for (const dir of dirsToCreate) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 2. Copiar scripts esenciales de forma paralela
console.log('📋 Preparando copia de archivos esenciales...');

// Listar todos los scripts relevantes
const scriptsToCopy = [
  'scripts/fix-database-url.js',
  'scripts/fix-import-session-model.js',
  'scripts/fix-import-session-postgres.js',
  'scripts/fix-import-session-sqlite.js',
  'scripts/run-import-session-migration.js',
  'scripts/import-session-preflight.js',
  'scripts/verify-import-schema.js',
  'scripts/audit-import-session-migrations.js',
  'scripts/verify-environment-config.js',
  'scripts/verify-database-connection.js',
  'scripts/deployment-verification-tests.js',
  'scripts/choreo-preflight.js',
  'scripts/ensure-import-dirs.js',
  'scripts/fix-all-choreo-issues.js',
  'scripts/fix-choreo-deploy.js',
  'scripts/test-import-session.js',
  'scripts/fix-database-env.js',
  'scripts/copy-prisma-engines.js'
];

// 3. Crear lista de comandos de copia para ejecutar en paralelo
const copyCommands = [];

// Comandos para copiar scripts
scriptsToCopy.forEach(scriptPath => {
  const sourcePath = path.join(workspaceRoot, scriptPath);
  if (fs.existsSync(sourcePath)) {
    const destPath = path.join(standaloneDir, scriptPath);
    
    if (isWindows) {
      const destDir = path.dirname(destPath);
      copyCommands.push(`mkdir -p "${destDir}" 2>nul || true`);
      copyCommands.push(`copy "${sourcePath}" "${destPath}" /Y >nul`);
    } else {
      const destDir = path.dirname(destPath);
      copyCommands.push(`mkdir -p "${destDir}" && cp "${sourcePath}" "${destPath}" && chmod +x "${destPath}"`);
    }
  }
});

// Comando para copiar schema de Prisma
if (isWindows) {
  copyCommands.push(`xcopy /E /Y /Q "prisma\\*" ".next\\standalone\\prisma\\" >nul`);
} else {
  copyCommands.push(`cp -r prisma/* .next/standalone/prisma/`);
}

// 4. Ejecutar comandos de copia en grupos para evitar sobrecarga
const batchSize = Math.ceil(copyCommands.length / MAX_PARALLEL_TASKS);
const copyBatches = [];

for (let i = 0; i < copyCommands.length; i += batchSize) {
  const batch = copyCommands.slice(i, i + batchSize);
  if (isWindows) {
    copyBatches.push(batch.join(' && '));
  } else {
    copyBatches.push(batch.join(' && '));
  }
}

// 5. Ejecutar copias en paralelo
console.log(`📋 Copiando archivos en ${copyBatches.length} lotes paralelos...`);
executeParallel(copyBatches, { continueOnError: true, shell: true })
  .then(() => {
    console.log('✅ Copia de archivos completada');
    
    // 6. Copiar motores de Prisma
    console.log('📋 Copiando motores de Prisma...');
    const prismaBinDir = path.join(workspaceRoot, 'node_modules/.prisma/client');
    const prismaBinDestDir = path.join(standaloneDir, 'node_modules/.prisma/client');
    
    if (fs.existsSync(prismaBinDir)) {
      const files = fs.readdirSync(prismaBinDir)
        .filter(file => file.startsWith('libquery_engine') || file.includes('query_engine'));
        
      files.forEach(file => {
        try {
          fs.copyFileSync(
            path.join(prismaBinDir, file),
            path.join(prismaBinDestDir, file)
          );
          
          // Dar permisos de ejecución
          if (!isWindows) {
            fs.chmodSync(path.join(prismaBinDestDir, file), '755');
          }
          console.log(`✅ Copiado motor: ${file}`);
        } catch (error) {
          console.error(`❌ Error copiando motor ${file}:`, error.message);
        }
      });
    }
    
    // 7. Copiar módulos esenciales
    console.log('📋 Copiando módulos Node esenciales...');
    const serverOnlyDir = path.join(workspaceRoot, 'node_modules/server-only');
    const serverOnlyDestDir = path.join(standaloneDir, 'node_modules/server-only');
    
    if (fs.existsSync(serverOnlyDir)) {
      const serverOnlyFiles = fs.readdirSync(serverOnlyDir);
      serverOnlyFiles.forEach(file => {
        try {
          fs.copyFileSync(
            path.join(serverOnlyDir, file),
            path.join(serverOnlyDestDir, file)
          );
        } catch (error) {
          console.error(`❌ Error copiando ${file}:`, error.message);
        }
      });
    }
    
    // 8. Optimizar tamaño de archivos estáticos
    if (process.env.NODE_ENV === 'production') {
      console.log('🔍 Optimizando tamaño de archivos estáticos...');
      
      // Comprimir archivos JS y CSS para CDN
      const staticDir = path.join(standaloneDir, '.next/static');
      if (fs.existsSync(staticDir)) {
        // Encontrar archivos JS y CSS en el directorio estático
        const findFiles = (dir, extension) => {
          const results = [];
          const files = fs.readdirSync(dir, { withFileTypes: true });
          
          for (const file of files) {
            const fullPath = path.join(dir, file.name);
            if (file.isDirectory()) {
              results.push(...findFiles(fullPath, extension));
            } else if (file.name.endsWith(extension)) {
              results.push(fullPath);
            }
          }
          
          return results;
        };
        
        // Encontrar todos los archivos JS y CSS
        const jsFiles = findFiles(staticDir, '.js');
        const cssFiles = findFiles(staticDir, '.css');
        
        // Comprimir archivos en paralelo
        console.log(`🔍 Comprimiendo ${jsFiles.length} archivos JS y ${cssFiles.length} CSS...`);
        
        [...jsFiles, ...cssFiles].forEach(file => {
          compressFile(file);
        });
      }
    }
    
    // 9. Crear marca de tiempo para despliegue
    console.log('📋 Creando archivo de marca de tiempo para despliegue...');
    const deployMarker = {
      timestamp: new Date().toISOString(),
      buildId: fs.existsSync(path.join(workspaceRoot, '.next/BUILD_ID')) 
        ? fs.readFileSync(path.join(workspaceRoot, '.next/BUILD_ID'), 'utf8').trim()
        : `build-${Date.now()}`,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'production'
    };
    
    fs.writeFileSync(
      path.join(standaloneDir, '.next/DEPLOY_MARKER.json'),
      JSON.stringify(deployMarker, null, 2)
    );
    
    // 10. Generar archivo de verificación de despliegue
    console.log('📋 Generando archivo de verificación de despliegue...');
    const verificationFile = path.join(standaloneDir, '.next/VERIFICATION.txt');
    const verificationContent = `DEPLOY_TIMESTAMP=${deployMarker.timestamp}\nBUILD_ID=${deployMarker.buildId}\nVERSION=${deployMarker.version}\nENVIRONMENT=${deployMarker.environment}\n`;
    fs.writeFileSync(verificationFile, verificationContent);
    
    // Finalizar
    const totalDuration = (Date.now() - startTime) / 1000;
    console.log(`🚀 Proceso post-build optimizado completado en ${totalDuration.toFixed(2)}s!`);
  })
  .catch(error => {
    console.error('Error en la optimización post-build:', error);
    process.exit(1);
  }); 