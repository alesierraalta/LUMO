import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient

// Simple P6001 error handling - conditional client creation
function createSafePrismaClient(): PrismaClient {
  try {
    // Try standard client first
    return new PrismaClient()
  } catch (error: any) {
    console.log('🔧 Prisma client creation error, attempting fallback...', error.message)
    
    if (error.message?.includes('prisma://') || error.code === 'P6001') {
      console.log('🔄 P6001 detected - creating fallback client with protocol fix')
      
      // Fallback: Create client with protocol conversion
      const fallbackUrl = process.env.DATABASE_URL?.replace('prisma://', 'postgresql://') || 
                          process.env.DATABASE_URL?.replace('postgres://', 'postgresql://') ||
                          process.env.DATABASE_URL
      
      return new PrismaClient({
        datasources: {
          db: {
            url: fallbackUrl
          }
        }
      })
    }
    
    // Re-throw if not P6001 related
    throw error
  }
}

// Initialize client with error handling
if (process.env.NODE_ENV === 'production') {
  console.log('🔧 Initializing production Prisma client with P6001 protection...')
  prisma = createSafePrismaClient()
} else {
  prisma = new PrismaClient()
}

export default prisma 