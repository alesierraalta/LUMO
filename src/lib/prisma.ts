import { PrismaClient } from '../generated/prisma';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more:
// https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Database URL configuration
const databaseUrl = process.env.DATABASE_URL || "file:../prisma/dev.db";

// Log para depuración
if (process.env.NODE_ENV === 'development') {
  console.log(`[Prisma] Usando base de datos SQLite para desarrollo local`);
} else {
  console.log(`[Prisma] Usando base de datos de producción: ${databaseUrl ? 'Configurada' : 'NO CONFIGURADA'}`);
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma; 