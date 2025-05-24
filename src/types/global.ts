import { PrismaClient } from '../generated/prisma';

export interface CustomNodeJsGlobal {
  prisma: PrismaClient;
} 