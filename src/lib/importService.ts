import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

// Import Session type definitions
export interface ImportSession {
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
}

export interface ImportSessionDetail {
  id: string;
  sessionId: string;
  name: string;
  sku: string;
  status: string;
  message?: string | null;
  originalData: string;
  importedData?: string | null;
  createdAt: Date;
}

// Service functions for import sessions
export const importService = {
  // Import Session functions
  async createImportSession(data: {
    id?: string;
    fileName: string;
    filePath: string;
    status?: string;
    notes?: string;
    createdById: string;
  }): Promise<ImportSession> {
    const id = data.id || uuidv4();
    const fileName = data.fileName;
    const filePath = data.filePath;
    const status = data.status || 'processing';
    const notes = data.notes;
    const createdById = data.createdById;
    
    await prisma.$executeRaw`
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
  
  async findImportSession(id: string): Promise<ImportSession | null> {
    const result = await prisma.$queryRaw`
      SELECT * FROM "ImportSession" WHERE id = ${id} LIMIT 1
    `;
    
    if (Array.isArray(result) && result.length > 0) {
      return result[0] as ImportSession;
    }
    
    return null;
  },
  
  async listImportSessions(): Promise<ImportSession[]> {
    const result = await prisma.$queryRaw`
      SELECT * FROM "ImportSession" ORDER BY "createdAt" DESC
    `;
    
    return Array.isArray(result) ? result as ImportSession[] : [];
  },
  
  async updateImportSession(id: string, data: {
    status?: string;
    totalItems?: number;
    successItems?: number;
    warningItems?: number;
    errorItems?: number;
    completedAt?: Date;
  }): Promise<ImportSession | null> {
    const updateParts = [];
    const updateValues = [];
    
    if (data.status !== undefined) {
      updateParts.push(`"status" = ?`);
      updateValues.push(data.status);
    }
    
    if (data.totalItems !== undefined) {
      updateParts.push(`"totalItems" = ?`);
      updateValues.push(data.totalItems);
    }
    
    if (data.successItems !== undefined) {
      updateParts.push(`"successItems" = ?`);
      updateValues.push(data.successItems);
    }
    
    if (data.warningItems !== undefined) {
      updateParts.push(`"warningItems" = ?`);
      updateValues.push(data.warningItems);
    }
    
    if (data.errorItems !== undefined) {
      updateParts.push(`"errorItems" = ?`);
      updateValues.push(data.errorItems);
    }
    
    if (data.completedAt !== undefined) {
      updateParts.push(`"completedAt" = ?`);
      updateValues.push(data.completedAt.toISOString());
    }
    
    if (updateParts.length === 0) {
      return this.findImportSession(id);
    }
    
    const updateQuery = `
      UPDATE "ImportSession" 
      SET ${updateParts.join(', ')}
      WHERE "id" = ?
    `;
    
    await prisma.$executeRawUnsafe(
      updateQuery,
      ...updateValues,
      id
    );
    
    return this.findImportSession(id);
  },
  
  // Import Session Detail functions
  async createImportSessionDetail(data: {
    id?: string;
    sessionId: string;
    name: string;
    sku: string;
    status: string;
    message?: string;
    originalData: any;
    importedData?: any;
  }): Promise<ImportSessionDetail> {
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
    
    await prisma.$executeRaw`
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
  },
  
  async listImportSessionDetails(sessionId: string): Promise<ImportSessionDetail[]> {
    const result = await prisma.$queryRaw`
      SELECT * FROM "ImportSessionDetail" 
      WHERE "sessionId" = ${sessionId}
      ORDER BY "createdAt" ASC
    `;
    
    return Array.isArray(result) ? result as ImportSessionDetail[] : [];
  },
  
  // Get import session with user details
  async getImportSessionWithCreator(id: string): Promise<ImportSession | null> {
    const session = await this.findImportSession(id);
    
    if (!session) {
      return null;
    }
    
    // Get user information
    const user = await prisma.user.findUnique({
      where: { id: session.createdById },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });
    
    return {
      ...session,
      createdBy: user
    };
  },
  
  // Get all import sessions with user details
  async listImportSessionsWithCreators(): Promise<ImportSession[]> {
    const sessions = await this.listImportSessions();
    
    // Get user details for each session
    for (const session of sessions) {
      const user = await prisma.user.findUnique({
        where: { id: session.createdById },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      });
      
      session.createdBy = user;
    }
    
    return sessions;
  }
}; 