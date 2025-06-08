/**
 * MONKEY PATCH AGRESIVO PARA PRISMA - P6001 FIX
 * Este archivo reemplaza completamente el comportamiento estándar de Prisma
 * con una versión que maneja correctamente conexiones directas y Prisma Accelerate
 */

const { PrismaClient } = require('@prisma/client');
const { join } = require('path');
const fs = require('fs');

// Limpiar los módulos de Prisma que puedan estar en caché
Object.keys(require.cache).forEach(key => {
  if (key.includes('@prisma/client') || key.includes('prisma')) {
    delete require.cache[key];
  }
});

// Leer la configuración para determinar si usamos Data Proxy o conexión directa
let useDataProxy = false;
try {
  // Intentar leer el archivo prisma-config.json
  const configPath = join(process.cwd(), 'prisma-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    useDataProxy = config.connectionType === 'data-proxy' || config.connectionType === 'prisma-accelerate';
    console.log(`🔍 Configuración detectada: ${useDataProxy ? 'Prisma Data Proxy/Accelerate' : 'Conexión PostgreSQL directa'}`);
  }
} catch (error) {
  console.warn('⚠️ No se pudo leer la configuración, usando valores por defecto');
}

// Asegurar que DATABASE_URL esté correctamente configurado
const originalUrl = process.env.DATABASE_URL || '';
let forcedUrl = originalUrl;

// Convertir la URL según sea necesario
if (useDataProxy) {
  // Para Data Proxy/Accelerate, asegurar que la URL comienza con prisma:// o prisma+postgres://
  if (forcedUrl.startsWith('postgresql://')) {
    console.log('🔄 P6001-FIX: Convirtiendo postgresql:// a prisma+postgres:// para Data Proxy');
    forcedUrl = forcedUrl.replace('postgresql://', 'prisma+postgres://');
  } else if (forcedUrl.startsWith('postgres://')) {
    console.log('🔄 P6001-FIX: Convirtiendo postgres:// a prisma+postgres:// para Data Proxy');
    forcedUrl = forcedUrl.replace('postgres://', 'prisma+postgres://');
  }
  // Si ya es prisma:// o prisma+postgres://, mantener como está
} else {
  // Para conexión directa, asegurar que la URL comienza con postgresql://
  if (forcedUrl.startsWith('prisma://') || forcedUrl.startsWith('prisma+postgres://')) {
    console.log('🔄 P6001-FIX: Convirtiendo prisma:// a postgresql:// para conexión directa');
    forcedUrl = forcedUrl.replace(/^prisma(\+postgres)?:\/\//, 'postgresql://');
  } else if (forcedUrl.startsWith('postgres://')) {
    console.log('🔄 P6001-FIX: Convirtiendo postgres:// a postgresql:// para conexión directa');
    forcedUrl = forcedUrl.replace('postgres://', 'postgresql://');
  } else if (!forcedUrl || process.env.NODE_ENV !== 'production') {
    // En desarrollo, usar SQLite por defecto
    const devDbPath = join(process.cwd(), 'prisma', 'dev.db');
    forcedUrl = `file:${devDbPath}`;
    console.log('🔄 P6001-FIX: Usando SQLite local en desarrollo');
  }
}

// Forzar la URL correcta
process.env.DATABASE_URL = forcedUrl;
console.log(`🔗 URL final: ${forcedUrl.substring(0, 20)}...`);

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
  } catch (error) {
    console.error('❌ Error creando PrismaClient:', error.message);
    
    if (error.code === 'P6001') {
      console.log('🔧 P6001 detectado, aplicando fix adaptativo');
      
      // Adaptar URL según el error
      let fixedUrl = forcedUrl;
      
      if (error.message.includes('must start with the protocol `prisma://`')) {
        // Necesitamos formato Data Proxy
        fixedUrl = fixedUrl.replace(/^postgresql:\/\//, 'prisma+postgres://');
        console.log('🔄 Convertido a formato Data Proxy: prisma+postgres://');
      } else if (error.message.includes('must start with the protocol `postgresql://`')) {
        // Necesitamos formato conexión directa
        fixedUrl = fixedUrl.replace(/^prisma(\+postgres)?:\/\//, 'postgresql://');
        console.log('🔄 Convertido a formato conexión directa: postgresql://');
      }
      
      // Actualizar configuración
      try {
        const configPath = join(process.cwd(), 'prisma-config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          config.connectionType = fixedUrl.startsWith('prisma') ? 'data-proxy' : 'direct-postgresql';
          fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
          console.log(`✅ Configuración actualizada a: ${config.connectionType}`);
        }
      } catch (configError) {
        console.warn('⚠️ No se pudo actualizar la configuración:', configError.message);
      }
      
      // Intentar nuevamente con la URL adaptada
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
  static getInstance() {
    if (!PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = createPrismaClient();
    }
    return PrismaClientSingleton.instance;
  }
}

// Exportar la instancia segura
const prisma = PrismaClientSingleton.getInstance();

module.exports = { prisma };
module.exports.default = prisma; 