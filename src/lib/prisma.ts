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

// Create PrismaClient instance
const basePrisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = basePrisma;
}

// Función helper para conexión segura
export async function connectSafely() {
  if (!basePrisma) {
    throw new Error('Prisma client not available');
  }
  
  try {
    await basePrisma.$connect();
    return basePrisma;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

// Función helper para desconexión segura
export async function disconnectSafely() {
  if (basePrisma) {
    try {
      await basePrisma.$disconnect();
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

// Create custom functions for import sessions
class CustomPrismaClient {
  // Base Prisma client
  private readonly client: PrismaClient;

  constructor(client: PrismaClient) {
    this.client = client;
    
    // Create proxies for common database operations
    return new Proxy(this, {
      get: (target, prop) => {
        // Handle custom methods
        if (prop in target) {
          return (target as any)[prop];
        }
        
        // Forward model access to the Prisma client
        if (prop in this.client) {
          return this.client[prop as keyof PrismaClient];
        }
        
        return undefined;
      }
    });
  }

  // Import Session methods
  async findImportSession(id: string): Promise<ImportSessionModel | null> {
    const result = await this.client.$queryRaw`
      SELECT * FROM "ImportSession" WHERE id = ${id} LIMIT 1
    `;
    return Array.isArray(result) && result.length > 0 ? result[0] as ImportSessionModel : null;
  }

  async listImportSessions(options?: { include?: { createdBy?: boolean } }): Promise<ImportSessionModel[]> {
    const results = await this.client.$queryRaw`
      SELECT * FROM "ImportSession" ORDER BY "createdAt" DESC
    `;
    
    if (options?.include?.createdBy && Array.isArray(results)) {
      // Get user data for each session
      for (const session of results as any[]) {
        const userData = await this.client.user.findUnique({
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
    
    return Array.isArray(results) ? results as ImportSessionModel[] : [];
  }

  async createImportSession(data: {
    id?: string;
    fileName: string;
    filePath: string;
    status?: string;
    notes?: string;
    createdById: string;
  }): Promise<ImportSessionModel> {
    const id = data.id || uuidv4();
    const fileName = data.fileName;
    const filePath = data.filePath;
    const status = data.status || 'processing';
    const notes = data.notes;
    const createdById = data.createdById;
    
    await this.client.$executeRaw`
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
  }

  async updateImportSession(id: string, data: {
    status?: string;
    totalItems?: number;
    successItems?: number;
    warningItems?: number;
    errorItems?: number;
    completedAt?: Date;
  }): Promise<ImportSessionModel | null> {
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        updateFields.push(`"${key}" = ?`);
        updateValues.push(value);
      }
    }
    
    if (updateFields.length === 0) {
      return this.findImportSession(id);
    }
    
    const updateQuery = `
      UPDATE "ImportSession" 
      SET ${updateFields.join(', ')}
      WHERE "id" = ?
    `;
    
    await this.client.$executeRawUnsafe(
      updateQuery,
      ...updateValues,
      id
    );
    
    return this.findImportSession(id);
  }

  // Import Session Detail methods
  async findImportSessionDetails(sessionId: string): Promise<ImportSessionDetailModel[]> {
    const results = await this.client.$queryRaw`
      SELECT * FROM "ImportSessionDetail" 
      WHERE "sessionId" = ${sessionId}
      ORDER BY "createdAt" ASC
    `;
    
    return Array.isArray(results) ? results as ImportSessionDetailModel[] : [];
  }

  async createImportSessionDetail(data: {
    id?: string;
    sessionId: string;
    name: string;
    sku: string;
    status: string;
    message?: string;
    originalData: any;
    importedData?: any;
  }): Promise<ImportSessionDetailModel> {
    const id = data.id || uuidv4();
    const sessionId = data.sessionId;
    const name = data.name;
    const sku = data.sku;
    const status = data.status;
    const message = data.message || null;
    const originalData = typeof data.originalData === 'string'
      ? data.originalData
      : JSON.stringify(data.originalData);
    const importedData = data.importedData
      ? (typeof data.importedData === 'string'
        ? data.importedData
        : JSON.stringify(data.importedData))
      : null;
    
    await this.client.$executeRaw`
      INSERT INTO "ImportSessionDetail" (
        "id", "sessionId", "name", "sku", "status", "message", "originalData", "importedData", "createdAt"
      ) VALUES (
        ${id}, ${sessionId}, ${name}, ${sku}, ${status}, ${message}, ${originalData}, ${importedData}, datetime('now')
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

  // Access to the original Prisma client
  get prisma(): PrismaClient {
    return this.client;
  }
}

// Create the extended Prisma client
export const prisma = new CustomPrismaClient(basePrisma);

export default prisma; 