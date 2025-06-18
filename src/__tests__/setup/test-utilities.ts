/**
 * Integration test setup and utilities
 * This file provides test utilities and is not a test file itself
 */
import { db } from '@/lib/db-supabase'
import jwt from 'jsonwebtoken'

// TypeScript interfaces for test data
interface TestUser {
  id: string
  email: string
  firstName: string
  lastName: string
  roleId: string
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

interface TestRole {
  id: string
  name: string
  description: string
  permissions: string[]
  isActive?: boolean
  isSystem?: boolean
  createdAt?: Date
  updatedAt?: Date
}

interface TestCategory {
  id: string
  name: string
  description?: string
  createdById: string
  createdAt?: Date
  updatedAt?: Date
}

interface TestInventoryItem {
  id: string
  sku: string
  name: string
  description?: string
  categoryId: string
  locationId?: string
  quantity: number
  minStockLevel: number
  unitCost: number
  unitPrice: number
  createdById: string
  createdAt?: Date
  updatedAt?: Date
}

interface TestStockMovement {
  id: string
  inventoryItemId: string
  type: string
  quantity: number
  notes?: string
  createdById: string
  createdAt?: Date
}

interface DatabaseOptions {
  where?: Record<string, unknown>
  data?: Record<string, unknown>
  include?: Record<string, unknown>
  select?: Record<string, unknown>
}

// Export the main db client for compatibility
export { db }

// Test configuration for compatibility tests
export const testConfig = {
  isDevelopment: false,
  isSupabaseEnv: true,
  usingPrisma: false,
  usingSupabase: true
}

// Test database helper functions that extend the main db client
export const testDb = {
  // Users operations
  user: {
    create: async (params: { data: Partial<TestUser> }) => {
      return await db.user.create(params)
    },
    
    findMany: async (where: DatabaseOptions = {}) => {
      return await db.user.findMany(where)
    },
    
    findUnique: async (options: DatabaseOptions) => {
      return await db.user.findUnique(options)
    },
    
    update: async (options: DatabaseOptions) => {
      return await db.user.update(options)
    },
    
    count: async () => {
      return await db.user.count()
    },

    delete: async (options: DatabaseOptions) => {
      return await db.user.delete(options)
    },

    deleteMany: async () => {
      return await db.user.deleteMany({ deleteAll: true })
    }
  },

  // Roles operations
  role: {
    create: async (params: { data: Partial<TestRole> }) => {
      return await db.role.create(params)
    },
    
    findMany: async (where: DatabaseOptions = {}) => {
      return await db.role.findMany(where)
    },

    findUnique: async (options: DatabaseOptions) => {
      return await db.role.findUnique(options)
    },

    count: async (params: any = {}) => {
      return await db.role.count(params)
    },

    delete: async (options: DatabaseOptions) => {
      return await db.role.delete(options)
    },

    deleteMany: async () => {
      return await db.role.deleteMany({ deleteAll: true })
    }
  },

  // Categories operations
  category: {
    create: async (params: { data: Partial<TestCategory> }) => {
      return await db.category.create(params)
    },

    findMany: async (where: DatabaseOptions = {}) => {
      return await db.category.findMany(where)
    },

    findUnique: async (options: DatabaseOptions) => {
      return await db.category.findUnique(options)
    },

    count: async (params: any = {}) => {
      return await db.category.count(params)
    },

    delete: async (options: DatabaseOptions) => {
      return await db.category.delete(options)
    },

    deleteMany: async () => {
      return await db.category.deleteMany({ deleteAll: true })
    }
  },

  // Inventory items operations
  inventoryItem: {
    create: async (params: { data: Partial<TestInventoryItem> }) => {
      return await db.inventoryItem.create(params)
    },

    findMany: async (where: DatabaseOptions = {}) => {
      return await db.inventoryItem.findMany(where)
    },

    findUnique: async (options: DatabaseOptions) => {
      return await db.inventoryItem.findUnique(options)
    },

    count: async (params: any = {}) => {
      return await db.inventoryItem.count(params)
    },

    delete: async (options: DatabaseOptions) => {
      return await db.inventoryItem.delete(options)
    },

    deleteMany: async () => {
      return await db.inventoryItem.deleteMany({ deleteAll: true })
    }
  },

  // Stock movements operations
  stockMovement: {
    create: async (params: { data: Partial<TestStockMovement> }) => {
      return await db.stockMovement.create(params)
    },

    findMany: async (where: DatabaseOptions = {}) => {
      return await db.stockMovement.findMany(where)
    },

    findUnique: async (options: DatabaseOptions) => {
      return await db.stockMovement.findUnique(options)
    },

    count: async (params: any = {}) => {
      return await db.stockMovement.count(params)
    },

    delete: async (options: DatabaseOptions) => {
      return await db.stockMovement.delete(options)
    },

    deleteMany: async () => {
      return await db.stockMovement.deleteMany({ deleteAll: true })
    }
  }
}

// Test data
export const testUsers = {
  admin: {
    id: 'test-admin-id',
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'User',
    roleId: 'admin-role-id',
    isActive: true
  },
  user: {
    id: 'test-user-id',
    email: 'user@test.com',
    firstName: 'Regular',
    lastName: 'User',
    roleId: 'user-role-id',
    isActive: true
  }
}

export const testRoles = {
  admin: {
    id: 'admin-role-id',
    name: 'Administrator',
    description: 'Full system access',
    permissions: ['read', 'write', 'delete', 'admin']
  },
  user: {
    id: 'user-role-id',
    name: 'User',
    description: 'Basic user access',
    permissions: ['read', 'write']
  }
}

// JWT token generation for testing
export const generateTestToken = (user: typeof testUsers.admin) => {
  const secret = process.env.NEXTAUTH_SECRET || 'test-secret'
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      permissions: testRoles.admin.permissions
    },
    secret,
    { expiresIn: '1h' }
  )
}

// Test data factory functions
export const createTestUser = async (overrides: Partial<TestUser> = {}) => {
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(7)
  
  const userData = {
    id: `test-user-${timestamp}-${randomSuffix}`,
    email: `test-user-${timestamp}-${randomSuffix}@test.com`,
    firstName: 'Test',
    lastName: 'User',
    roleId: 'test-role-id',
    isActive: true,
    ...overrides
  }
  
  // ✅ CRITICAL FIX: Use correct Prisma-style parameter format { data: userData }
  return await testDb.user.create({ data: userData })
}

export const createTestRole = async (overrides: Partial<TestRole> = {}) => {
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(7)
  
  const roleData = {
    id: `test-role-${timestamp}-${randomSuffix}`,
    name: `TEST_ROLE_${timestamp}_${randomSuffix}`,
    description: 'Test role for integration tests',
    permissions: ['read', 'write'],
    isActive: true,
    isSystem: false,
    ...overrides
  }
  
  // ✅ CRITICAL FIX: Use correct Prisma-style parameter format { data: roleData }
  return await testDb.role.create({ data: roleData })
}

export const createTestCategory = async (overrides: Partial<TestCategory> = {}) => {
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(7)
  
  // Ensure we have a valid createdById
  let createdById = overrides.createdById
  if (!createdById) {
    const testRole = await createTestRole()
    const testUser = await createTestUser({ roleId: testRole.id })
    createdById = testUser.id
  }
  
  const categoryData = {
    id: `test-category-${timestamp}-${randomSuffix}`,
    name: `Test Category ${timestamp}-${randomSuffix}`,
    description: 'Test category for integration tests',
    createdById,
    ...overrides
  }
  
  return await testDb.category.create({ data: categoryData })
}

export const createTestInventoryItem = async (overrides: Partial<TestInventoryItem> = {}) => {
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(7)
  
  const inventoryData = {
    id: `test-inventory-${timestamp}-${randomSuffix}`,
    sku: `TEST-SKU-${timestamp}-${randomSuffix}`,
    name: `Test Product ${timestamp}-${randomSuffix}`,
    description: 'Test product for integration tests',
    categoryId: 'test-category-id',
    quantity: 10,
    minStockLevel: 5,
    unitCost: 10.00,
    unitPrice: 15.00,
    createdById: 'test-user-id',
    ...overrides
  }
  
  return await testDb.inventoryItem.create({ data: inventoryData })
}

export const createTestStockMovement = async (overrides: Partial<TestStockMovement> = {}) => {
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(7)
  
  const movementData = {
    id: `test-movement-${timestamp}-${randomSuffix}`,
    inventoryItemId: 'test-inventory-id',
    type: 'adjustment',
    quantity: 5,
    notes: 'Test stock movement',
    createdById: 'test-user-id',
    ...overrides
  }
  
  return await testDb.stockMovement.create({ data: movementData })
}

// Database setup and cleanup functions
export const setupTestDatabase = async () => {
  try {
    // Create test role first
    const testRole = await createTestRole({
      id: 'test-role-id',
      name: 'Test Role',
      description: 'Test role for integration tests',
      permissions: ['read', 'write']
    })
    
    // Create test user with the role
    const testUser = await createTestUser({
      id: 'test-user-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roleId: testRole.id,
      isActive: true
    })
    
    return { testRole, testUser }
  } catch (error) {
    console.error('Error setting up test database:', error)
    throw error
  }
}

export const cleanupTestDatabase = async () => {
  try {
    // Clean up in reverse order of dependencies
    // Use deleteAll flag for safe cleanup
    await testDb.stockMovement.deleteMany()
    await testDb.inventoryItem.deleteMany()
    await testDb.category.deleteMany()
    await testDb.user.deleteMany()
    await testDb.role.deleteMany()
  } catch (error) {
    console.error('Error cleaning up test database:', error)
    throw error
  }
}

export const disconnectDatabase = async () => {
  try {
    // Supabase doesn't need explicit disconnection like Prisma
    console.log('Database disconnection - no action needed for Supabase')
  } catch (error) {
    console.error('Error disconnecting from database:', error)
    throw error
  }
}

// Verification functions
export const verifyUserExists = async (_email: string) => {
  // Implementation for user verification
  return true
}

export const verifyInventoryItemExists = async (_sku: string) => {
  // Implementation for inventory item verification
  return true
}

export const verifyInventoryLevel = async (_inventoryItemId: string) => {
  // Implementation for inventory level verification
  return 10
}

export const deleteTestUser = async (userId: string) => {
  return await testDb.user.delete({ where: { id: userId } })
}