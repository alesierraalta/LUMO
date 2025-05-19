import { PrismaClient } from '../../generated/prisma';

export interface CustomNodeJsGlobal extends NodeJS.Global {
  prisma: PrismaClient;
} 