/**
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
  forcedUrl = `file:${devDbPath}`;
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
