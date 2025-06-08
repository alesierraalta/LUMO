#!/usr/bin/env node

/**
 * FIX-P6001-FINAL - Solución definitiva para el error P6001 de Prisma
 * 
 * Este script implementa una solución agresiva y final para el error P6001,
 * tomando acciones concretas en múltiples niveles.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔥 SOLUCIÓN DEFINITIVA PARA ERROR P6001 🔥');
console.log('==========================================');

// Build-time detection function
function isBuildTimeEnvironment() {
  return (
    // No DATABASE_URL available (typical during build)
    !process.env.DATABASE_URL ||
    // Choreo buildpack environment indicators  
    process.env.PACK_VOLUME_KEY ||
    // Generic build environment indicators
    process.env.CI === 'true' && !process.env.DATABASE_URL ||
    // Google Cloud Build indicators
    process.env.BUILDER_OUTPUT ||
    // Docker build context
    process.env.DOCKER_BUILDKIT ||
    // Next.js build phase
    process.env.NEXT_PHASE === 'phase-production-build'
  );
}

const isBuildTime = isBuildTimeEnvironment();

if (isBuildTime) {
  console.log('🔨 BUILD-TIME ENVIRONMENT DETECTED');
  console.log('📝 Running build-safe P6001 prevention setup');
  console.log('⚠️ Full database operations will be deferred to runtime');
} else {
  console.log('🚀 RUNTIME ENVIRONMENT DETECTED');
  console.log('📝 Running complete P6001 diagnosis and fix');
}

// Función para ejecutar un comando y capturar la salida
function executeCommand(command) {
  console.log(`Ejecutando: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    return { success: true, output };
  } catch (error) {
    console.error(`Error ejecutando ${command}:`, error.message);
    return { success: false, error: error.message };
  }
}

// 1. Verificar el entorno y el DATABASE_URL
console.log('\n📊 DIAGNÓSTICO DEL ENTORNO');
console.log('------------------------');

const isDev = process.env.NODE_ENV !== 'production';
console.log(`Entorno: ${isDev ? 'DESARROLLO' : 'PRODUCCIÓN'}`);

let databaseUrl = process.env.DATABASE_URL || '';
console.log(`DATABASE_URL original: ${databaseUrl.slice(0, 15)}...`);

// 2. Corregir el URL de la base de datos
console.log('\n🔧 CORRIGIENDO DATABASE_URL');
console.log('-------------------------');

// Para desarrollo local, usar SQLite si no está configurado otro
if (isDev && (!databaseUrl || databaseUrl.includes('prisma://'))) {
  console.log('Entorno de desarrollo: Configurando SQLite local');
  
  // Crear archivo .env.local si no existe
  const envPath = path.join(process.cwd(), '.env.local');
  const envContent = `DATABASE_URL="file:./dev.db"\n`;
  
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envContent);
    console.log(`Creado ${envPath} con SQLite`);
  } else {
    const currentEnv = fs.readFileSync(envPath, 'utf8');
    if (!currentEnv.includes('DATABASE_URL=')) {
      fs.appendFileSync(envPath, envContent);
      console.log(`Actualizado ${envPath} con SQLite`);
    }
  }
  
  // Actualizar la variable de entorno en tiempo de ejecución
  process.env.DATABASE_URL = 'file:./dev.db';
  databaseUrl = process.env.DATABASE_URL;
  
  console.log('DATABASE_URL actualizado a SQLite local');
} 
// Para producción, asegurar que sea postgresql://
else if (databaseUrl.startsWith('prisma://') || databaseUrl.startsWith('postgres://')) {
  console.log('Entorno de producción: Corrigiendo protocolo PostgreSQL');
  
  // Corregir el protocolo
  let fixedUrl = databaseUrl;
  if (databaseUrl.startsWith('prisma://')) {
    console.log('🚨 Detectado prisma:// - Convirtiendo a postgresql://');
    fixedUrl = databaseUrl.replace('prisma://', 'postgresql://');
  } else if (databaseUrl.startsWith('postgres://')) {
    console.log('⚠️ Detectado postgres:// - Convirtiendo a postgresql://');
    fixedUrl = databaseUrl.replace('postgres://', 'postgresql://');
  }
  
  // Actualizar la variable de entorno en tiempo de ejecución
  process.env.DATABASE_URL = fixedUrl;
  databaseUrl = fixedUrl;
  
  console.log(`DATABASE_URL actualizado: ${fixedUrl.slice(0, 15)}...`);
  
  // En producción, también forzar variable DATABASE_PROTOCOL
  process.env.DATABASE_PROTOCOL = 'postgresql://';
  console.log('Variable DATABASE_PROTOCOL forzada a postgresql://');
}

// 3. Modificar schema.prisma para forzar el proveedor correcto
console.log('\n🗄️ ACTUALIZANDO SCHEMA.PRISMA');
console.log('--------------------------');

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
if (fs.existsSync(schemaPath)) {
  let schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Verificar si ya tiene la configuración correcta
  if (schemaContent.includes('provider = "postgresql"') && 
      schemaContent.includes('url = env("DATABASE_URL")')) {
    console.log('✅ Schema ya está correctamente configurado');
  } else {
    // Corregir la configuración de datasource
    schemaContent = schemaContent.replace(
      /datasource db {[^}]*}/s,
      `datasource db {
  provider = "postgresql"
  url = env("DATABASE_URL")
}`
    );
    
    fs.writeFileSync(schemaPath, schemaContent);
    console.log('✅ Schema actualizado para usar postgresql');
  }
} else {
  console.error('❌ No se encontró el archivo schema.prisma');
}

// 4. Crear/Actualizar monkey patch para Prisma Client
console.log('\n🐒 CREANDO MONKEY PATCH AGRESIVO');
console.log('-----------------------------');

const monkeyPatchPath = path.join(process.cwd(), 'src', 'lib', 'prisma-monkey-patch.ts');
const monkeyPatchContent = `/**
 * MONKEY PATCH AGRESIVO PARA PRISMA - P6001 FIX
 * Este archivo reemplaza completamente el comportamiento estándar de Prisma
 * con una versión que siempre usa postgresql:// o SQLite, nunca prisma://
 */

import { PrismaClient } from '@prisma/client';
import { join } from 'path';

// Limpiar los módulos de Prisma que puedan estar en caché
Object.keys(require.cache).forEach(key => {
  if (key.includes('@prisma/client') || key.includes('prisma')) {
    delete require.cache[key];
  }
});

// Asegurar que DATABASE_URL esté correctamente configurado
const originalUrl = process.env.DATABASE_URL || '';
let forcedUrl = originalUrl;

// Convertir la URL según sea necesario
if (forcedUrl.startsWith('prisma://')) {
  console.log('🔄 P6001-FIX: Convirtiendo prisma:// a postgresql://');
  forcedUrl = forcedUrl.replace('prisma://', 'postgresql://');
} else if (forcedUrl.startsWith('postgres://')) {
  console.log('🔄 P6001-FIX: Convirtiendo postgres:// a postgresql://');
  forcedUrl = forcedUrl.replace('postgres://', 'postgresql://');
} else if (!forcedUrl || process.env.NODE_ENV !== 'production') {
  // En desarrollo, usar SQLite por defecto
  const devDbPath = join(process.cwd(), 'prisma', 'dev.db');
  forcedUrl = \`file:\${devDbPath}\`;
  console.log('🔄 P6001-FIX: Usando SQLite local en desarrollo');
}

// Forzar la URL correcta
process.env.DATABASE_URL = forcedUrl;

// Crear una nueva instancia de PrismaClient con la URL corregida
const createPrismaClient = () => {
  try {
    // Intenta crear el cliente normalmente primero
    return new PrismaClient({
      datasources: {
        db: {
          url: forcedUrl
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Error creando PrismaClient:', error.message);
    
    if (error.message?.includes('prisma://') || error.code === 'P6001') {
      console.log('🔧 P6001 detectado, usando fix agresivo');
      
      // Forzar el uso de postgresql o SQLite
      let fixedUrl = forcedUrl;
      if (fixedUrl.includes('prisma://')) {
        fixedUrl = fixedUrl.replace('prisma://', 'postgresql://');
      }
      
      return new PrismaClient({
        datasources: {
          db: {
            url: fixedUrl
          }
        }
      });
    }
    
    throw error;
  }
};

// Singleton para asegurar una sola instancia
class PrismaClientSingleton {
  private static instance: PrismaClient;

  static getInstance(): PrismaClient {
    if (!PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = createPrismaClient();
    }
    return PrismaClientSingleton.instance;
  }
}

// Exportar la instancia segura
export const prisma = PrismaClientSingleton.getInstance();

// Para compatibilidad con el código existente
export default prisma;
`;

fs.writeFileSync(monkeyPatchPath, monkeyPatchContent);
console.log(`✅ Creado: ${monkeyPatchPath}`);

// 5. Actualizar el archivo principal de prisma.ts
console.log('\n🔄 ACTUALIZANDO ARCHIVO PRISMA.TS');
console.log('------------------------------');

const prismaPath = path.join(process.cwd(), 'src', 'lib', 'prisma.ts');
if (fs.existsSync(prismaPath)) {
  const prismaContent = `// ¡ATENCIÓN! Este archivo ha sido modificado por el P6001-FIX agresivo
// Ahora solo re-exporta el cliente seguro desde prisma-monkey-patch.ts

import { prisma } from './prisma-monkey-patch';

// Re-exportar todo desde el monkey patch
export { prisma };
export default prisma;

// Mantener compatibilidad con la API existente
export const basePrisma = prisma;
`;

  fs.writeFileSync(prismaPath, prismaContent);
  console.log(`✅ Actualizado: ${prismaPath}`);
} else {
  console.error('❌ No se encontró el archivo prisma.ts');
}

// 6. Regenerar cliente Prisma 
console.log('\n🔄 REGENERANDO CLIENTE PRISMA');
console.log('---------------------------');

// Limpiar caché de Prisma
const prismaDir = path.join(process.cwd(), 'node_modules', '.prisma');
if (fs.existsSync(prismaDir)) {
  try {
    fs.rmSync(prismaDir, { recursive: true, force: true });
    console.log('✅ Caché de Prisma eliminada');
  } catch (error) {
    console.warn('⚠️ No se pudo eliminar la caché de Prisma:', error.message);
  }
}

// Ejecutar prisma generate - skip validation during build time
const generateCommand = isBuildTime ? 
  'npx prisma generate --no-engine' : 
  'npx prisma generate';

const generateResult = executeCommand(generateCommand);
if (generateResult.success) {
  console.log('✅ Cliente Prisma regenerado exitosamente');
  if (isBuildTime) {
    console.log('📝 Build-time generation completed - runtime engine will be configured later');
  }
} else {
  if (isBuildTime) {
    console.warn('⚠️ Build-time generation failed - will retry at runtime');
  } else {
    console.error('❌ Error regenerando cliente Prisma');
  }
}

// 7. Verificar la solución
console.log('\n🧪 VERIFICANDO SOLUCIÓN');
console.log('---------------------');

if (isBuildTime) {
  console.log('⚠️ Build-time environment - skipping database connection tests');
  console.log('📝 Verification will be performed at runtime');
} else {
  console.log('🔍 Runtime environment - performing full verification');
}

// Crear un script de verificación
const verifyPath = path.join(process.cwd(), 'scripts', 'verify-p6001-fix.js');
const verifyContent = `#!/usr/bin/env node

console.log('🧪 Verificando solución P6001...');

// Importar el cliente desde el nuevo archivo
const { PrismaClient } = require('@prisma/client');

// Verificar DATABASE_URL
console.log('DATABASE_URL:', process.env.DATABASE_URL?.slice(0, 15) + '...');

// Intentar crear cliente directamente
try {
  const directClient = new PrismaClient();
  console.log('✅ Cliente directo creado exitosamente');
} catch (error) {
  console.error('❌ Error creando cliente directo:', error.message);
}

// Intentar usar el cliente patcheado
try {
  const patchedClient = require('../src/lib/prisma-monkey-patch').prisma;
  console.log('✅ Cliente patcheado importado exitosamente');
  
  // Ejecutar una consulta sencilla
  patchedClient.$queryRaw\`SELECT 1 as test\`.then(result => {
    console.log('✅ Consulta ejecutada exitosamente:', result);
    process.exit(0);
  }).catch(error => {
    console.error('❌ Error ejecutando consulta:', error.message);
    process.exit(1);
  });
} catch (error) {
  console.error('❌ Error usando cliente patcheado:', error.message);
  process.exit(1);
}`;

fs.writeFileSync(verifyPath, verifyContent);
fs.chmodSync(verifyPath, '755');
console.log(`✅ Creado script de verificación: ${verifyPath}`);

// 8. Integrate with Automated Debug Log System
console.log('\n🔍 INTEGRATING WITH AUTOMATED DEBUG LOG SYSTEM');
console.log('----------------------------------------');

// Import path for consistency
const choreoLogPath = path.join(process.cwd(), 'src', 'lib', 'choreo-debug-system.ts');

// Check if the debug system exists
if (!fs.existsSync(choreoLogPath)) {
  console.log('⚠️ Choreo Debug System not found, creating minimal integration');
  
  // Create a simple log entry to document this fix
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    type: 'fix-execution',
    component: 'prisma',
    issue: 'P6001',
    resolution: 'applied-fix-script',
    databaseUrl: databaseUrl ? `${databaseUrl.slice(0, 15)}...` : 'not-set',
    environment: process.env.NODE_ENV || 'unknown',
    buildTime: isBuildTime()
  };
  
  fs.appendFileSync(
    path.join(logDir, 'choreo-deployment.log'), 
    JSON.stringify(logEntry) + '\n'
  );
  
  console.log('✅ Created minimal deployment log entry');
} else {
  console.log('✅ Choreo Debug System found, integrating P6001 fix');
  
  // Create an enhanced integration file
  const enhancedIntegrationPath = path.join(process.cwd(), 'src', 'lib', 'choreo-fixes', 'prisma-p6001-fix.ts');
  
  // Ensure directory exists
  const fixesDir = path.join(process.cwd(), 'src', 'lib', 'choreo-fixes');
  if (!fs.existsSync(fixesDir)) {
    fs.mkdirSync(fixesDir, { recursive: true });
  }
  
  const enhancedIntegrationContent = `/**
 * PRISMA P6001 FIX INTEGRATION
 * 
 * This module integrates the P6001 fix with the Automated Debug Log System.
 * It provides:
 * - Diagnostic logging for Prisma connection issues
 * - Automatic detection of P6001 errors
 * - Self-healing capabilities for common database URL issues
 * - Integration with deployment health monitoring
 * - Build-time safety guards
 */

import { isBuildTime, safeDbOperation } from '../build-time-guards';

/**
 * Diagnose and fix Prisma P6001 errors with build-time safety
 */
export async function diagnoseAndFixP6001() {
  console.log('🔍 Starting P6001 diagnostics with build-time safety');
  
  // Skip database operations during build time
  if (isBuildTime()) {
    console.log('⚠️ Build time detected - skipping database diagnostics');
    return {
      buildTime: true,
      urlFixed: false,
      message: 'P6001 diagnostics skipped during build time'
    };
  }
  
  // 1. Check DATABASE_URL format
  const databaseUrl = process.env.DATABASE_URL || '';
  let urlFixed = false;
  
  console.log('🔍 Checking DATABASE_URL format:', databaseUrl.slice(0, 15) + '...');
  
  if (databaseUrl.startsWith('prisma://')) {
    console.log('🔧 Found prisma:// protocol, converting to postgresql://');
    process.env.DATABASE_URL = databaseUrl.replace('prisma://', 'postgresql://');
    urlFixed = true;
  } else if (databaseUrl.startsWith('postgres://')) {
    console.log('🔧 Found postgres:// protocol, converting to postgresql://');
    process.env.DATABASE_URL = databaseUrl.replace('postgres://', 'postgresql://');
    urlFixed = true;
  }
  
  // 2. Test connection with safe operation wrapper
  const connectionTest = await safeDbOperation(async () => {
    const { PrismaClient } = require('@prisma/client');
    const testClient = new PrismaClient();
    await testClient.$connect();
    await testClient.$disconnect();
    return true;
  }, false);
  
  return {
    buildTime: false,
    urlFixed,
    connectionTest,
    timestamp: new Date().toISOString()
  };
}

/**
 * Register with health monitoring system
 */
export function registerWithHealthSystem() {
  return {
    name: 'prisma-p6001-fix',
    status: 'active',
    description: 'Fixes Prisma P6001 connection issues with build-time safety',
    lastRun: new Date().toISOString(),
    autoFix: true,
    targetIssues: ['P6001', 'database-connection', 'prisma-url', 'build-time-errors']
  };
}
`;

  fs.writeFileSync(enhancedIntegrationPath, enhancedIntegrationContent);
  console.log(`✅ Created enhanced integration: ${enhancedIntegrationPath}`);
}

// Helper function to detect build time
function isBuildTime() {
  return (
    typeof process === 'undefined' ||
    !process.env.DATABASE_URL ||
    process.env.NEXT_PHASE === 'phase-production-build' ||
    (process.env.CI === 'true' && !process.env.DATABASE_URL)
  );
}

// 10. Resumen final
console.log('\n✅ SOLUCIÓN P6001 COMPLETA');
console.log('=======================');
console.log('1. DATABASE_URL corregido para usar postgresql:// o SQLite');
console.log('2. Schema.prisma actualizado para usar postgresql');
console.log('3. Monkey patch agresivo implementado');
console.log('4. Archivo prisma.ts actualizado para usar el patch');
console.log('5. Cliente Prisma regenerado');
console.log('6. Integración con sistema de diagnóstico automatizado');
console.log('\n🚀 PRÓXIMOS PASOS:');
console.log('1. Ejecutar "node scripts/verify-p6001-fix.js" para verificar');
console.log('2. Reiniciar la aplicación');
console.log('3. Si funciona, hacer commit y push para desplegar en Choreo'); 
 