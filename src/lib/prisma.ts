import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more:
// https://pris.ly/d/help/next-js-best-practices

declare global {
  var prisma: PrismaClient | undefined;
}

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

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

// Add custom models for import sessions
interface ImportSessionModel {
  id: string;
  fileName: string;
  filePath: string;
  status: string;
  notes?: string | null;
  totalItems: number;
  successItems: number;
  warningItems: number;
  errorItems: number;
  createdById: string;
  createdAt: Date;
  completedAt?: Date | null;
  createdBy?: any;
  details?: ImportSessionDetailModel[];
}

interface ImportSessionDetailModel {
  id: string;
  sessionId: string;
  name: string;
  sku: string;
  status: string;
  message?: string | null;
  originalData: string;
  importedData?: string | null;
  createdAt: Date;
  session?: ImportSessionModel;
}

// Create PrismaClient instance
const basePrisma = globalForPrisma.prisma || new PrismaClient();

// Extend PrismaClient with import session models
const prismaClientExtension = {
  $extends: {
    model: {
      // Import Session extension
      importSession: {
        async findUnique({where}: {where: {id: string}}) {
          const result = await basePrisma.$queryRaw`
            SELECT * FROM "ImportSession" WHERE id = ${where.id} LIMIT 1
          `;
          return Array.isArray(result) && result.length > 0 ? result[0] : null;
        },
        async findMany({orderBy, include}: {orderBy?: any, include?: any} = {}) {
          const results = await basePrisma.$queryRaw`
            SELECT * FROM "ImportSession" ORDER BY "createdAt" DESC
          `;
          
          if (include?.createdBy && Array.isArray(results)) {
            // Get user data for each session
            for (const session of results as any[]) {
              const userData = await basePrisma.user.findUnique({
                where: { id: session.createdById },
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true
                }
              });
              session.createdBy = userData;
            }
          }
          
          return Array.isArray(results) ? results : [];
        },
        async create({data}: {data: any}) {
          const id = data.id || uuidv4();
          const fileName = data.fileName;
          const filePath = data.filePath;
          const status = data.status || 'processing';
          const notes = data.notes;
          const createdById = data.createdById;
          
          await basePrisma.$executeRaw`
            INSERT INTO "ImportSession" (
              "id", "fileName", "filePath", "status", "notes", "createdById", "createdAt"
            ) VALUES (
              ${id}, ${fileName}, ${filePath}, ${status}, ${notes}, ${createdById}, datetime('now')
            )
          `;
          
          return {
            id,
            fileName,
            filePath,
            status,
            notes,
            totalItems: 0,
            successItems: 0,
            warningItems: 0,
            errorItems: 0,
            createdById,
            createdAt: new Date()
          };
        },
        async update({where, data}: {where: {id: string}, data: any}) {
          const updateFields: string[] = [];
          const updateValues: any[] = [];
          
          for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
              updateFields.push(`"${key}" = ?`);
              updateValues.push(value);
            }
          }
          
          if (updateFields.length === 0) {
            return this.findUnique({where});
          }
          
          const updateQuery = `
            UPDATE "ImportSession" 
            SET ${updateFields.join(', ')}
            WHERE "id" = ?
          `;
          
          await basePrisma.$executeRaw(
            basePrisma.$string(updateQuery),
            ...updateValues,
            where.id
          );
          
          return this.findUnique({where});
        }
      },
      // Import Session Detail extension
      importSessionDetail: {
        async findMany({where}: {where: {sessionId: string}}) {
          const results = await basePrisma.$queryRaw`
            SELECT * FROM "ImportSessionDetail" 
            WHERE "sessionId" = ${where.sessionId}
            ORDER BY "createdAt" ASC
          `;
          
          return Array.isArray(results) ? results : [];
        },
        async create({data}: {data: any}) {
          const id = data.id || uuidv4();
          const sessionId = data.sessionId;
          const name = data.name;
          const sku = data.sku;
          const status = data.status;
          const message = data.message || null;
          const originalData = data.originalData;
          const importedData = data.importedData || null;
          
          await basePrisma.$executeRaw`
            INSERT INTO "ImportSessionDetail" (
              "id", "sessionId", "name", "sku", "status", "message", "originalData", "importedData", "createdAt"
            ) VALUES (
              ${id}, ${sessionId}, ${name}, ${sku}, ${status}, ${message}, 
              ${typeof originalData === 'string' ? originalData : JSON.stringify(originalData)}, 
              ${importedData ? (typeof importedData === 'string' ? importedData : JSON.stringify(importedData)) : null},
              datetime('now')
            )
          `;
          
          return {
            id,
            sessionId,
            name,
            sku,
            status,
            message,
            originalData,
            importedData,
            createdAt: new Date()
          };
        }
      }
    }
  }
};

// Create extended PrismaClient
export const prisma = basePrisma.$extends(prismaClientExtension);

export default prisma;

// Also export as named export to fix import issues
export { prisma }; 