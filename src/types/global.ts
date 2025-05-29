import { PrismaClient } from '@prisma/client';

export interface CustomNodeJsGlobal {
  prisma: PrismaClient;
} 