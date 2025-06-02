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
    return prisma.createImportSession(data);
  },
  
  async findImportSession(id: string): Promise<ImportSession | null> {
    return prisma.findImportSession(id);
  },
  
  async listImportSessions(): Promise<ImportSession[]> {
    return prisma.listImportSessions();
  },
  
  async updateImportSession(id: string, data: {
    status?: string;
    totalItems?: number;
    successItems?: number;
    warningItems?: number;
    errorItems?: number;
    completedAt?: Date;
  }): Promise<ImportSession | null> {
    return prisma.updateImportSession(id, data);
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
    return prisma.createImportSessionDetail(data);
  },
  
  async listImportSessionDetails(sessionId: string): Promise<ImportSessionDetail[]> {
    return prisma.findImportSessionDetails(sessionId);
  },
  
  // Get import session with user details
  async getImportSessionWithCreator(id: string): Promise<ImportSession | null> {
    const session = await this.findImportSession(id);
    
    if (!session) {
      return null;
    }
    
    // Get user information
    const user = await prisma.prisma.user.findUnique({
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
    return prisma.listImportSessions({ include: { createdBy: true }});
  }
}; 