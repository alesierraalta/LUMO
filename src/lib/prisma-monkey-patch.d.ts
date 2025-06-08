import { PrismaClient, Prisma } from '@prisma/client';

declare global {
  // Extend the NodeJS namespace with our custom environment variables
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      NODE_ENV?: 'development' | 'production' | 'test';
      CHOREO_DEPLOYMENT?: string;
      CONTAINER_ENV?: string;
    }
  }

  // Extend the PrismaClient type with our custom methods
  interface PrismaClientWithHealthCheck extends PrismaClient {
    healthCheck?(): Promise<{
      status: string;
      connection: string;
      error?: string;
    }>;
  }

  // This makes sure we can use our extended PrismaClient type throughout the app
  // eslint-disable-next-line no-var
  var prisma: PrismaClientWithHealthCheck | undefined;

  // Add type for the Prisma client options
  interface PrismaClientOptions {
    datasources?: {
      db?: {
        url: string;
      };
    };
    log?: Array<string>;
  }
}

// This ensures the file is treated as a module
export {};
