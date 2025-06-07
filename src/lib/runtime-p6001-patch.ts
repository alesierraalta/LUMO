// Runtime P6001 Error Patch
// This patches Prisma client calls at runtime to handle protocol mismatches

import { PrismaClient } from '@prisma/client'

let fallbackClient: PrismaClient | null = null

// Create fallback client with correct protocol
function createFallbackClient(): PrismaClient {
  if (fallbackClient) {
    return fallbackClient
  }

  console.log('🔄 Creating P6001 fallback client...')
  
  const currentUrl = process.env.DATABASE_URL || ''
  const fixedUrl = currentUrl
    .replace('prisma://', 'postgresql://')
    .replace('postgres://', 'postgresql://')

  fallbackClient = new PrismaClient({
    datasources: {
      db: {
        url: fixedUrl
      }
    }
  })

  console.log('✅ P6001 fallback client created')
  return fallbackClient
}

// Patch Prisma client methods to handle P6001 errors
export function patchPrismaClient(prisma: any) {
  if (!prisma || typeof prisma !== 'object') {
    return prisma
  }

  // Create a proxy that intercepts all property access
  return new Proxy(prisma, {
    get(target, prop) {
      const original = target[prop]

      // If accessing a model (like 'user', 'product', etc.)
      if (typeof original === 'object' && original !== null) {
        return new Proxy(original, {
          get(modelTarget, modelProp) {
            const modelMethod = modelTarget[modelProp]

            // If accessing a query method
            if (typeof modelMethod === 'function') {
              return async function(...args: any[]) {
                try {
                  // Try the original method first
                  return await modelMethod.apply(modelTarget, args)
                } catch (error: any) {
                  // If P6001 error, use fallback client
                  if (error.code === 'P6001' || error.message?.includes('prisma://')) {
                    console.log(`🔄 P6001 detected in ${String(prop)}.${String(modelProp)}, using fallback client`)
                    
                    const fallback = createFallbackClient()
                    const fallbackModel = (fallback as any)[prop]
                    const fallbackMethod = fallbackModel[modelProp]
                    
                    return await fallbackMethod.apply(fallbackModel, args)
                  }
                  
                  // Re-throw other errors
                  throw error
                }
              }
            }

            return modelMethod
          }
        })
      }

      return original
    }
  })
}

// Global error handler for unpatched P6001 errors
if (typeof global !== 'undefined') {
  const originalConsoleError = console.error
  console.error = function(...args: any[]) {
    const message = args.join(' ')
    
    if (message.includes('P6001') || message.includes('prisma://')) {
      console.log('🚨 Detected unpatched P6001 error - consider applying runtime patch')
    }
    
    return originalConsoleError.apply(console, args)
  }
} 
 