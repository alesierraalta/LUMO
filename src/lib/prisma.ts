import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import NodeCache from 'node-cache';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more:
// https://pris.ly/d/help/next-js-best-practices

declare global {
  var prisma: PrismaClient | undefined;
  var prismaConnected: boolean | undefined;
  var queryCache: NodeCache | undefined;
}

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
  prismaConnected: boolean | undefined;
  queryCache: NodeCache | undefined;
};

// Cache configuration
const CACHE_TTL = 60; // Cache time-to-live in seconds
const CACHE_CHECK_PERIOD = 120; // Check for expired entries every 2 minutes

// Initialize cache if it doesn't exist
if (!globalForPrisma.queryCache) {
  globalForPrisma.queryCache = new NodeCache({
    stdTTL: CACHE_TTL,
    checkperiod: CACHE_CHECK_PERIOD,
    useClones: false
  });
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

// Create PrismaClient instance (lazy)
const basePrisma = globalForPrisma.prisma || createPrismaClient();

// Fix for type safety
const safeBasePrisma = basePrisma as PrismaClient;

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = basePrisma;
}

// Función helper para conexión segura
export async function connectSafely() {
  if (!basePrisma) {
    throw new Error('Prisma client not available');
  }
  
  if (!globalForPrisma.prismaConnected) {
    try {
      await basePrisma.$connect();
      globalForPrisma.prismaConnected = true;
      console.log('📚 Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }
  
  return basePrisma;
}

// Función helper para desconexión segura
export async function disconnectSafely() {
  if (basePrisma && globalForPrisma.prismaConnected) {
    try {
      await basePrisma.$disconnect();
      globalForPrisma.prismaConnected = false;
      console.log('📚 Database disconnected successfully');
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
  private readonly cache: NodeCache;
  private queryTimings: Map<string, { count: number, totalTime: number, avgTime: number }> = new Map();

  constructor(client: PrismaClient) {
    this.client = client;
    this.cache = globalForPrisma.queryCache!;
    
    // Create proxies for common database operations
    return new Proxy(this, {
      get: (target, prop) => {
        // Handle custom methods
        if (prop in target) {
          return (target as any)[prop];
        }
        
        // Handle special methods for monitoring
        if (prop === 'getQueryStats') {
          return () => this.getQueryStatistics();
        }
        
        // Lazy connect if needed
        if (!globalForPrisma.prismaConnected && prop !== 'connect' && prop !== 'disconnect') {
          connectSafely().catch(e => console.error('Failed to connect lazily:', e));
        }
        
        // Forward model access to the Prisma client
        if (prop in this.client) {
          const original = this.client[prop as keyof PrismaClient];
          
          // If the property is a model (object with findMany, findUnique, etc.)
          if (typeof original === 'object' && original !== null) {
            return new Proxy(original, {
              get: (modelTarget, modelProp) => {
                const modelMethod = modelTarget[modelProp as keyof typeof modelTarget];
                
                // If it's a query method, wrap it with caching and monitoring
                if (typeof modelMethod === 'function' && 
                   (modelProp === 'findMany' || 
                    modelProp === 'findUnique' || 
                    modelProp === 'findFirst' ||
                    modelProp === 'count')) {
                  
                  return async (...args: any[]) => {
                    // Create a cache key based on the model, method, and args
                    const cacheKey = `${String(prop)}.${String(modelProp)}.${JSON.stringify(args)}`;
                    
                    // Check cache first for read operations
                    const cachedResult = this.cache.get(cacheKey);
                    if (cachedResult !== undefined) {
                      return cachedResult;
                    }
                    
                    // Record execution time
                    const startTime = performance.now();
                    
                    try {
                      // Ensure we're connected before executing query
                      if (!globalForPrisma.prismaConnected) {
                        await connectSafely();
                      }
                      
                      // Execute the original method
                      const result = await (modelMethod as Function).apply(modelTarget, args);
                      
                      // Cache the result for read operations
                      this.cache.set(cacheKey, result);
                      
                      return result;
                    } finally {
                      // Track query timing for monitoring
                      const endTime = performance.now();
                      const executionTime = endTime - startTime;
                      this.recordQueryTiming(`${String(prop)}.${String(modelProp)}`, executionTime);
                    }
                  };
                }
                
                // For write operations, we need to invalidate cache
                if (typeof modelMethod === 'function' && 
                   (modelProp === 'create' || 
                    modelProp === 'update' || 
                    modelProp === 'delete' || 
                    modelProp === 'upsert' || 
                    modelProp === 'createMany' || 
                    modelProp === 'updateMany' || 
                    modelProp === 'deleteMany')) {
                  
                  return async (...args: any[]) => {
                    // Record execution time
                    const startTime = performance.now();
                    
                    try {
                      // Ensure we're connected before executing query
                      if (!globalForPrisma.prismaConnected) {
                        await connectSafely();
                      }
                      
                      // Execute the original method
                      const result = await (modelMethod as Function).apply(modelTarget, args);
                      
                      // Invalidate cache for this model
                      this.invalidateModelCache(String(prop));
                      
                      return result;
                    } finally {
                      // Track query timing for monitoring
                      const endTime = performance.now();
                      const executionTime = endTime - startTime;
                      this.recordQueryTiming(`${String(prop)}.${String(modelProp)}`, executionTime);
                    }
                  };
                }
                
                return modelMethod;
              }
            });
          }
          
          return original;
        }
        
        return undefined;
      }
    });
  }
  
  // Helper to invalidate cache for a specific model
  private invalidateModelCache(modelName: string) {
    const keys = this.cache.keys();
    const modelKeys = keys.filter(key => key.startsWith(`${modelName}.`));
    
    if (modelKeys.length > 0) {
      this.cache.del(modelKeys);
      console.log(`🧹 Invalidated ${modelKeys.length} cache entries for ${modelName}`);
    }
  }
  
  // Record query timing for monitoring
  private recordQueryTiming(queryName: string, executionTime: number) {
    const stats = this.queryTimings.get(queryName) || { count: 0, totalTime: 0, avgTime: 0 };
    stats.count += 1;
    stats.totalTime += executionTime;
    stats.avgTime = stats.totalTime / stats.count;
    this.queryTimings.set(queryName, stats);
  }
  
  // Get query statistics for monitoring
  public getQueryStatistics() {
    return Array.from(this.queryTimings.entries()).map(([query, stats]) => ({
      query,
      count: stats.count,
      totalTimeMs: Math.round(stats.totalTime),
      avgTimeMs: Math.round(stats.avgTime)
    }));
  }

  // Import Session methods
  async findImportSession(id: string): Promise<ImportSessionModel | null> {
    // Generate cache key
    const cacheKey = `importSession.${id}`;
    
    // Check cache first
    const cachedResult = this.cache.get<ImportSessionModel>(cacheKey);
    if (cachedResult) return cachedResult;
    
    const startTime = performance.now();
    
    try {
      const result = await this.client.$queryRaw`
        SELECT * FROM "ImportSession" WHERE id = ${id} LIMIT 1
      `;
      
      const processed = Array.isArray(result) && result.length > 0 
        ? result[0] as ImportSessionModel 
        : null;
      
      // Cache the result
      if (processed) {
        this.cache.set(cacheKey, processed);
      }
      
      return processed;
    } finally {
      const endTime = performance.now();
      this.recordQueryTiming('importSession.findById', endTime - startTime);
    }
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
export const prisma = new CustomPrismaClient(safeBasePrisma);

export default prisma; 