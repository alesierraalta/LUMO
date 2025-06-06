import { PrismaClient, Prisma } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import { v4 as uuidv4 } from 'uuid';
import NodeCache from 'node-cache';
import { initializeDatabaseUrl } from './database-url-fix';
import { getDynamicPrismaClient, resetDynamicPrismaClient, testDatabaseConnection } from '../../lib/dynamic-prisma-client';
import 'server-only';

// Initialize database URL configuration before creating Prisma client
initializeDatabaseUrl();

declare global {
  var prisma: any | undefined;
  var prismaConnected: boolean | undefined;
  var queryCache: NodeCache | undefined;
  var lastP6001Error: Date | undefined;
  var fallbackClientActive: boolean | undefined;
}

const globalForPrisma = global as unknown as {
  prisma: any | undefined;
  prismaConnected: boolean | undefined;
  queryCache: NodeCache | undefined;
  lastP6001Error: Date | undefined;
  fallbackClientActive: boolean | undefined;
};

// Cache configuration
const CACHE_TTL = 60;
const CACHE_CHECK_PERIOD = 120;

// Initialize cache if it doesn't exist
if (!globalForPrisma.queryCache) {
  globalForPrisma.queryCache = new NodeCache({
    stdTTL: CACHE_TTL,
    checkperiod: CACHE_CHECK_PERIOD,
    useClones: false
  });
}

/**
 * Enhanced Database URL Analysis with P6001 Detection
 */
const getDatabaseInfo = () => {
  const databaseUrl = process.env.DATABASE_URL || '';
  const isSQLite = databaseUrl.startsWith('file:');
  const isPostgreSQL = databaseUrl.startsWith('postgres') || databaseUrl.startsWith('postgresql:');
  const isAccelerate = databaseUrl.startsWith('prisma://');
  
  return {
    url: databaseUrl,
    isSQLite,
    isPostgreSQL,
    isAccelerate,
    type: isSQLite ? 'sqlite' : isPostgreSQL ? 'postgresql' : isAccelerate ? 'accelerate' : 'unknown'
  };
};

/**
 * Detect P6001 errors in error messages
 */
function isP6001Error(error: any): boolean {
  const errorMessage = error?.message || '';
  return errorMessage.includes('P6001') || 
         errorMessage.includes('URL must start with the protocol `prisma://`') ||
         errorMessage.includes('protocol `prisma://`');
}

/**
 * Create Prisma Client with P6001 fallback support
 */
const createPrismaClientWithFallback = () => {
  try {
    console.log('🔧 Creating Enhanced Prisma Client with P6001 fallback...');
    
    const dbInfo = getDatabaseInfo();
    console.log(`🔗 Database type: ${dbInfo.type}...`);
    
    // First, try the standard approach
    let client: PrismaClient;
    
    if (dbInfo.isSQLite) {
      console.log('🔧 Creating SQLite client (standard)...');
      client = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        errorFormat: 'minimal',
      });
      console.log('✅ SQLite client created successfully');
    } 
    else if (dbInfo.isPostgreSQL) {
      console.log('🔧 Creating PostgreSQL client (direct connection)...');
      client = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        errorFormat: 'minimal',
      });
      console.log('✅ PostgreSQL client created successfully');
    }
         else if (dbInfo.isAccelerate) {
       console.log('🔧 Creating Accelerate client...');
       client = new PrismaClient({
         log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
         errorFormat: 'minimal',
       }).$extends(withAccelerate()) as any;
       console.log('✅ Accelerate client created successfully');
     }
    else {
      console.log('⚠️ Unknown database type, using standard client...');
      client = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        errorFormat: 'minimal',
      });
    }
    
    return client;
    
  } catch (error) {
    console.error('❌ Error creating standard Prisma client:', error);
    
    if (isP6001Error(error)) {
      console.log('🚨 P6001 Error detected - activating dynamic client fallback...');
      globalForPrisma.lastP6001Error = new Date();
      globalForPrisma.fallbackClientActive = true;
      
      try {
        const dynamicClient = getDynamicPrismaClient();
        console.log('✅ Dynamic client fallback activated successfully');
        return dynamicClient;
      } catch (fallbackError) {
        console.error('💥 Dynamic client fallback also failed:', fallbackError);
        throw new Error(`Both standard and dynamic Prisma clients failed: ${error.message}`);
      }
    }
    
    throw error;
  }
};

/**
 * Enhanced connection with P6001 error handling
 */
export async function connectSafelyWithFallback() {
  try {
    // Try standard connection first
    let client = globalForPrisma.prisma;
    
    if (!client) {
      client = createPrismaClientWithFallback();
      globalForPrisma.prisma = client;
    }
    
    if (!globalForPrisma.prismaConnected) {
      try {
        await client.$connect();
        globalForPrisma.prismaConnected = true;
        console.log('📚 Database connected successfully');
        
        // Test the connection with a simple query
        await client.$queryRaw`SELECT 1`;
        console.log('✅ Connection test passed');
        
        // If we were using fallback and standard client works now, reset
        if (globalForPrisma.fallbackClientActive) {
          console.log('✅ Standard client working again - fallback no longer needed');
          globalForPrisma.fallbackClientActive = false;
        }
        
      } catch (connectionError) {
        console.error('❌ Database connection failed:', connectionError);
        
        if (isP6001Error(connectionError)) {
          console.log('🚨 P6001 Error during connection - trying dynamic client...');
          globalForPrisma.lastP6001Error = new Date();
          
          // Reset and try dynamic client
          globalForPrisma.prisma = null;
          globalForPrisma.prismaConnected = false;
          resetDynamicPrismaClient();
          
          const dynamicClient = getDynamicPrismaClient();
          await dynamicClient.$connect();
          
          globalForPrisma.prisma = dynamicClient;
          globalForPrisma.prismaConnected = true;
          globalForPrisma.fallbackClientActive = true;
          
          console.log('✅ Dynamic client connection successful');
          client = dynamicClient;
        } else {
          throw connectionError;
        }
      }
    }
    
    return client;
    
  } catch (error) {
    console.error('💥 All connection methods failed:', error);
    throw error;
  }
}

/**
 * Execute query with P6001 error handling and automatic fallback
 */
export async function executeWithFallback<T>(
  operation: (client: any) => Promise<T>,
  operationName: string = 'Database Operation'
): Promise<T> {
  try {
    const client = await connectSafelyWithFallback();
    return await operation(client);
    
  } catch (error) {
    if (isP6001Error(error)) {
      console.log(`🚨 P6001 Error in ${operationName} - attempting fallback...`);
      globalForPrisma.lastP6001Error = new Date();
      
      try {
        // Reset everything and try with dynamic client
        globalForPrisma.prisma = null;
        globalForPrisma.prismaConnected = false;
        resetDynamicPrismaClient();
        
        const dynamicClient = getDynamicPrismaClient();
        await dynamicClient.$connect();
        
        globalForPrisma.prisma = dynamicClient;
        globalForPrisma.prismaConnected = true;
        globalForPrisma.fallbackClientActive = true;
        
        console.log(`✅ Fallback successful for ${operationName}`);
        return await operation(dynamicClient);
        
      } catch (fallbackError) {
        console.error(`💥 Fallback also failed for ${operationName}:`, fallbackError);
        throw new Error(`Both standard and fallback execution failed: ${error.message}`);
      }
    }
    
    throw error;
  }
}

/**
 * Get enhanced client status information
 */
export function getClientStatus() {
  return {
    connected: globalForPrisma.prismaConnected || false,
    fallbackActive: globalForPrisma.fallbackClientActive || false,
    lastP6001Error: globalForPrisma.lastP6001Error,
    clientType: globalForPrisma.fallbackClientActive ? 'dynamic' : 'standard'
  };
}

/**
 * Test all available connection methods
 */
export async function testAllConnectionMethods() {
  const results = {
    standard: false,
    dynamic: false,
    error: null as string | null
  };
  
  console.log('🧪 Testing all connection methods...');
  
  // Test standard client
  try {
    const standardClient = createPrismaClientWithFallback();
    await standardClient.$connect();
    await standardClient.$queryRaw`SELECT 1`;
    await standardClient.$disconnect();
    results.standard = true;
    console.log('✅ Standard client: WORKING');
  } catch (error) {
    console.log('❌ Standard client: FAILED');
    results.error = (error as Error).message;
  }
  
  // Test dynamic client
  try {
    resetDynamicPrismaClient();
    const success = await testDatabaseConnection();
    results.dynamic = success;
    console.log(`${success ? '✅' : '❌'} Dynamic client: ${success ? 'WORKING' : 'FAILED'}`);
  } catch (error) {
    console.log('❌ Dynamic client: FAILED');
    if (!results.error) {
      results.error = (error as Error).message;
    }
  }
  
  return results;
}

// Export enhanced connection function as default
export { connectSafelyWithFallback as connectSafely };

// Export dynamic client functions
export {
  getDynamicPrismaClient,
  resetDynamicPrismaClient,
  testDatabaseConnection
};

// Create enhanced client instance
const basePrisma = globalForPrisma.prisma || createPrismaClientWithFallback();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = basePrisma;

export default basePrisma; 