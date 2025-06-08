/**
 * AGGRESSIVE PRISMA MONKEY PATCH - P6001 FIX
 * This file completely replaces the standard Prisma behavior
 * with a version that correctly handles direct connections and Prisma Accelerate
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Configuration paths
const CONFIG_PATH = path.join(process.cwd(), 'prisma-config.json');

// Load configuration from prisma-config.json
let config = {
  connectionType: 'prisma-accelerate', // Default to prisma-accelerate for Choreo
  databaseUrl: process.env.DATABASE_URL || '',
  fix: 'prisma-p6001-fix-enhanced',
  timestamp: new Date().toISOString(),
  version: '2.0.0'
};

const configPath = path.join(process.cwd(), 'prisma-config.json');

// Try to load config from file if it exists
try {
  if (fs.existsSync(configPath)) {
    const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config = { ...config, ...fileConfig };
  }
} catch (error) {
  console.error('❌ Error loading prisma-config.json:', error.message);
  // Create a default config file if it doesn't exist
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (writeError) {
    console.error('❌ Error creating prisma-config.json:', writeError.message);
  }
}

// Ensure connectionType is set to prisma-accelerate for Choreo
if (process.env.CHOREO_DEPLOYMENT === 'true') {
  config.connectionType = 'prisma-accelerate';
}

// Function to save config back to file
function saveConfig() {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error saving prisma-config.json:', error.message);
    return false;
  }
}

// Function to detect connection type based on DATABASE_URL
function detectConnectionType(url) {
  if (!url) return 'direct';
  
  if (url.startsWith('prisma://') || url.startsWith('prisma+postgres://')) {
    return 'prisma-accelerate';
  }
  
  if (url.startsWith('postgresql://') || url.startsWith('postgres://')) {
    return 'direct';
  }
  
  return 'direct';
}

// Function to fix DATABASE_URL based on connection type
function fixDatabaseUrl(url, targetType) {
  if (!url) {
    console.error('❌ DATABASE_URL is not set');
    return url;
  }
  
  const currentType = detectConnectionType(url);
  
  // If already the correct type, return as is
  if (currentType === targetType) {
    return url;
  }
  
  // Convert between types
  if (targetType === 'prisma-accelerate') {
    // Convert to Prisma Accelerate format
    if (url.startsWith('postgresql://')) {
      return url.replace('postgresql://', 'prisma+postgres://');
    }
    if (url.startsWith('postgres://')) {
      return url.replace('postgres://', 'prisma+postgres://');
    }
    // If we can't convert, return original
    return url;
  } else {
    // Convert to direct format
    if (url.startsWith('prisma+postgres://')) {
      return url.replace('prisma+postgres://', 'postgresql://');
    }
    if (url.startsWith('prisma://')) {
      return url.replace('prisma://', 'postgresql://');
    }
    // If we can't convert, return original
    return url;
  }
}

// Get the fixed URL based on config
const fixedUrl = fixDatabaseUrl(process.env.DATABASE_URL, config.connectionType);

// Log the configuration
console.log('🔧 Prisma Client Configuration:');
console.log('- Mode: ' + (process.env.NODE_ENV || 'development'));
console.log('- Connection Type: ' + config.connectionType);
console.log('- Original URL: ' + (process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'undefined'));
console.log('- Fixed URL: ' + (fixedUrl ? fixedUrl.substring(0, 20) + '...' : 'undefined'));

// Set the DATABASE_URL environment variable for Prisma
process.env.DATABASE_URL = fixedUrl;

// Create a new PrismaClient instance with the fixed URL
let prisma;

// Function to create PrismaClient with error handling
async function createPrismaClient() {
  try {
    if (!fixedUrl) {
      throw new Error('DATABASE_URL is not set or invalid');
    }
    
    // Create Prisma client with environment variable directly
    const client = new PrismaClient({
      // @ts-ignore - Ignore TypeScript errors for Prisma client options
      datasources: {
        db: {
          url: fixedUrl
        }
      },
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error', 'warn']
    });
    
    // Apply the fixed URL to the client's internal configuration
    // @ts-ignore - Access internal Prisma client properties
    if (client._engine && client._engine.datasourceUrl) {
      // @ts-ignore - Access internal Prisma client properties
      client._engine.datasourceUrl = fixedUrl;
    }
    
    // Add query logging in development
    if (process.env.NODE_ENV === 'development') {
      client.$on('query', (e) => {
        console.log(`Query: ${e.query}`);
        console.log(`Duration: ${e.duration}ms`);
      });
    }
    
    // Add a middleware to log queries in development
    if (process.env.NODE_ENV === 'development') {
      client.$use(async (params, next) => {
        const before = Date.now();
        const result = await next(params);
        const after = Date.now();
        if (params && params.model && params.action) {
          console.log(`Query ${params.model}.${params.action} took ${after - before}ms`);
        } else {
          console.log(`Query took ${after - before}ms`);
        }
        return result;
      });
    }
    
    // Test the connection
    await client.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');
    
    return client;
  } catch (error) {
    console.error('❌ Error creating PrismaClient:', error.message);
    
    // Try to recover from P6001 error
    if (error.code === 'P6001') {
      console.log('🔄 Attempting to fix P6001 error...');
      
      // If we're in prisma-accelerate mode but got P6001, try direct connection
      if (config.connectionType === 'prisma-accelerate') {
        console.log('🔄 Falling back to direct connection...');
        
        try {
          const directUrl = fixDatabaseUrl(process.env.DATABASE_URL, 'direct');
          const directPrisma = new PrismaClient({
            datasources: {
              db: { url: directUrl }
            },
            log: ['error', 'warn']
          });
          
          // Test the connection
          await directPrisma.$queryRaw`SELECT 1`;
          
          // Update config
          config.connectionType = 'direct';
          saveConfig();
          
          console.log('✅ Successfully switched to direct connection');
          return directPrisma;
        } catch (directError) {
          console.error('❌ Failed to establish direct connection:', directError.message);
        }
      }
    }
    
    // If we get here, we couldn't recover, so rethrow the error
    throw error;
  }
}

// Create and initialize the Prisma client
(async () => {
  try {
    prisma = await createPrismaClient();
    
    // Add health check endpoint in production
    if (process.env.NODE_ENV === 'production') {
      prisma.healthCheck = async () => {
        try {
          await prisma.$queryRaw`SELECT 1`;
          return { 
            status: 'healthy', 
            connection: config.connectionType 
          };
        } catch (error) {
          return { 
            status: 'unhealthy', 
            error: error.message,
            connection: config.connectionType
          };
        }
      };
      
      console.log('✅ Prisma client initialized with health check endpoint');
    }
  } catch (error) {
    console.error('❌ Fatal: Could not initialize Prisma Client:', error.message);
    
    // If we're in a container environment or production, exit with error code
    if (process.env.CONTAINER_ENV === 'true' || process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    
    // In development, we can continue with a mock client
    console.warn('⚠️  Falling back to mock Prisma client in development mode');
    prisma = {
      $queryRaw: () => Promise.resolve([]),
      $disconnect: () => Promise.resolve(),
      // Add other Prisma methods as needed
    };
  }
  
  // Export the Prisma client
  module.exports = prisma;
})();