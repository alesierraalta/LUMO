import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more:
// https://pris.ly/d/help/next-js-best-practices

declare global {
  var prisma: PrismaClient | undefined;
}

// Crear cliente Prisma con manejo de errores robusto
function createPrismaClient(): PrismaClient | undefined {
  try {
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      errorFormat: 'minimal',
    });

    // No hacer conexión automática durante startup para evitar crashes
    return client;
  } catch (error) {
    console.error('❌ Error creating Prisma client:', error);
    // Retornar undefined en lugar de null para evitar crashes
    return undefined;
  }
}

const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Función helper para conexión segura
export async function connectSafely() {
  if (!prisma) {
    throw new Error('Prisma client not available');
  }
  
  try {
    await prisma.$connect();
    return prisma;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

// Función helper para desconexión segura
export async function disconnectSafely() {
  if (prisma) {
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.error('⚠️ Error disconnecting from database:', error);
    }
  }
}

export default prisma;

// Also export as named export to fix import issues
export { prisma }; 