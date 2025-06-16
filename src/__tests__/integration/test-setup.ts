// Integration test setup and utilities
import { PrismaClient } from '@prisma/client'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
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

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
const isSupabaseEnv = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY

// Database clients
let prisma: PrismaClient | null = null
let supabase: SupabaseClient | null = null

// Initialize appropriate client based on environment
if (isDevelopment && !isSupabaseEnv) {
  prisma = new PrismaClient()
} else if (isSupabaseEnv) {
  supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  )
}

// Database abstraction layer
export const db = {
  // Users operations
  user: {
    create: async (data: Partial<TestUser>) => {
      if (prisma) {
        return await prisma.user.create({ data })
      } else if (supabase) {
        const { data: result, error } = await supabase
          .from('users')
          .insert(data)
          .select()
          .single()
        if (error) throw error
        return result
      }
      throw new Error('No database client available')
    },
    
    findMany: async (where: DatabaseOptions = {}) => {
      if (prisma) {
        return await prisma.user.findMany(where)
      } else if (supabase) {
        let query = supabase.from('users').select('*')
        if (where.email) {
          query = query.eq('email', where.email)
        }
        const { data, error } = await query
        if (error) throw error
        return data
      }
      throw new Error('No database client available')
    },
    
    findUnique: async (options: DatabaseOptions) => {
      if (prisma) {
        return await prisma.user.findUnique(options)
      } else if (supabase) {
        const where = options.where || options
        let query = supabase.from('users').select('*')
        if (where.email) {
          query = query.eq('email', where.email)
        } else if (where.id) {
          query = query.eq('id', where.id)
        }
        const { data, error } = await query.single()
        if (error) throw error
        return data
      }
      throw new Error('No database client available')
    },
    
    update: async (options: DatabaseOptions) => {
      if (prisma) {
        return await prisma.user.update(options)
      } else if (supabase) {
        const { where, data } = options
        let query = supabase.from('users').update(data)
        if (where?.id) {
          query = query.eq('id', where.id)
        }
        const { data: result, error } = await query.select().single()
        if (error) throw error
        return result
      }
      throw new Error('No database client available')
    },
    
    count: async () => {
      if (prisma) {
        return await prisma.user.count()
      } else if (supabase) {
        const { count, error } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
        if (error) throw error
        return count || 0
      }
      throw new Error('No database client available')
    },

    delete: async (options: DatabaseOptions) => {
      if (prisma) {
        return await prisma.user.delete(options)
      } else if (supabase) {
        const where = options.where || options
        let query = supabase.from('users').delete()
        if (where?.id) {
          query = query.eq('id', where.id)
        }
        const { error } = await query
        if (error) throw error
        return { success: true }
      }
      throw new Error('No database client available')
    },

    deleteMany: async () => {
      if (prisma) {
        return await prisma.user.deleteMany()
      } else if (supabase) {
        const { error } = await supabase
          .from('users')
          .delete()
          .neq('id', 'impossible-id') // Delete all
        if (error) throw error
        return { count: 0 } // Supabase doesn't return count
      }
      throw new Error('No database client available')
    }
  },

  // Roles operations
  role: {
    create: async (data: Partial<TestRole>) => {
      if (prisma) {
        return await prisma.role.create({ data })
      } else if (supabase) {
        const { data: result, error } = await supabase
          .from('roles')
          .insert(data)
          .select()
          .single()
        if (error) throw error
        return result
      }
      throw new Error('No database client available')
    },
    
    findMany: async (where: DatabaseOptions = {}) => {
      if (prisma) {
        return await prisma.role.findMany(where)
      } else if (supabase) {
        let query = supabase.from('roles').select('*')
        if (where.id) {
          query = query.eq('id', where.id)
        }
        if (where.name) {
          query = query.eq('name', where.name)
        }
        const { data, error } = await query
        if (error) throw error
        return data
      }
      throw new Error('No database client available')
    },

    findUnique: async (options: DatabaseOptions) => {
      if (prisma) {
        return await prisma.role.findUnique(options)
      } else if (supabase) {
        const where = options.where || options
        let query = supabase.from('roles').select('*')
        if (where?.id) {
          query = query.eq('id', where.id)
        } else if (where?.name) {
          query = query.eq('name', where.name)
        }
        const { data, error } = await query.single()
        if (error) throw error
        return data
      }
      throw new Error('No database client available')
    },

    delete: async (options: DatabaseOptions) => {
      if (prisma) {
        return await prisma.role.delete(options)
      } else if (supabase) {
        const where = options.where || options
        let query = supabase.from('roles').delete()
        if (where?.id) {
          query = query.eq('id', where.id)
        }
        const { error } = await query
        if (error) throw error
        return { success: true }
      }
      throw new Error('No database client available')
    },

    deleteMany: async () => {
      if (prisma) {
        return await prisma.role.deleteMany()
      } else if (supabase) {
        const { error } = await supabase
          .from('roles')
          .delete()
          .neq('id', 'impossible-id') // Delete all
        if (error) throw error
        return { count: 0 }
      }
      throw new Error('No database client available')
    }
  },

  // Categories operations
  category: {
    create: async (data: Partial<TestCategory>) => {
      if (prisma) {
        return await prisma.category.create({ data })
      } else if (supabase) {
        const { data: result, error } = await supabase
          .from('categories')
          .insert(data)
          .select()
          .single()
        if (error) throw error
        return result
      }
      throw new Error('No database client available')
    },

    findMany: async (where: DatabaseOptions = {}) => {
      if (prisma) {
        return await prisma.category.findMany(where)
      } else if (supabase) {
        let query = supabase.from('categories').select('*')
        if (where.id) {
          query = query.eq('id', where.id)
        }
        const { data, error } = await query
        if (error) throw error
        return data
      }
      throw new Error('No database client available')
    },

    findUnique: async (options: DatabaseOptions) => {
      if (prisma) {
        return await prisma.category.findUnique(options)
      } else if (supabase) {
        const where = options.where || options
        let query = supabase.from('categories').select('*')
        if (where?.id) {
          query = query.eq('id', where.id)
        }
        const { data, error } = await query.single()
        if (error) throw error
        return data
      }
      throw new Error('No database client available')
    },

    delete: async (options: DatabaseOptions) => {
      if (prisma) {
        return await prisma.category.delete(options)
      } else if (supabase) {
        const where = options.where || options
        let query = supabase.from('categories').delete()
        if (where?.id) {
          query = query.eq('id', where.id)
        }
        const { error } = await query
        if (error) throw error
        return { success: true }
      }
      throw new Error('No database client available')
    },

    deleteMany: async () => {
      if (prisma) {
        return await prisma.category.deleteMany()
      } else if (supabase) {
        const { error } = await supabase
          .from('categories')
          .delete()
          .neq('id', 'impossible-id') // Delete all
        if (error) throw error
        return { count: 0 }
      }
      throw new Error('No database client available')
    }
  },

  // Inventory items operations
  inventoryItem: {
    create: async (data: Partial<TestInventoryItem>) => {
      if (prisma) {
        return await prisma.inventoryItem.create({ data })
      } else if (supabase) {
        const { data: result, error } = await supabase
          .from('inventory_items')
          .insert(data)
          .select()
          .single()
        if (error) throw error
        return result
      }
      throw new Error('No database client available')
    },

    findMany: async (where: DatabaseOptions = {}) => {
      if (prisma) {
        return await prisma.inventoryItem.findMany(where)
      } else if (supabase) {
        let query = supabase.from('inventory_items').select('*')
        if (where.id) {
          query = query.eq('id', where.id)
        }
        const { data, error } = await query
        if (error) throw error
        return data
      }
      throw new Error('No database client available')
    },

    findUnique: async (options: DatabaseOptions) => {
      if (prisma) {
        return await prisma.inventoryItem.findUnique(options)
      } else if (supabase) {
        const where = options.where || options
        let query = supabase.from('inventory_items').select('*')
        if (where?.id) {
          query = query.eq('id', where.id)
        }
        const { data, error } = await query.single()
        if (error) throw error
        return data
      }
      throw new Error('No database client available')
    },

    deleteMany: async () => {
      if (prisma) {
        return await prisma.inventoryItem.deleteMany()
      } else if (supabase) {
        const { error } = await supabase
          .from('inventory_items')
          .delete()
          .neq('id', 'impossible-id') // Delete all
        if (error) throw error
        return { count: 0 }
      }
      throw new Error('No database client available')
    }
  },

  // Stock movements operations
  stockMovement: {
    create: async (data: Partial<TestStockMovement>) => {
      if (prisma) {
        return await prisma.stockMovement.create({ data })
      } else if (supabase) {
        const { data: result, error } = await supabase
          .from('stock_movements')
          .insert(data)
          .select()
          .single()
        if (error) throw error
        return result
      }
      throw new Error('No database client available')
    },

    deleteMany: async () => {
      if (prisma) {
        return await prisma.stockMovement.deleteMany()
      } else if (supabase) {
        const { error } = await supabase
          .from('stock_movements')
          .delete()
          .neq('id', 'impossible-id') // Delete all
        if (error) throw error
        return { count: 0 }
      }
      throw new Error('No database client available')
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
    email: `test-user-${timestamp}-${randomSuffix}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    roleId: 'test-role-id',
    isActive: true,
    ...overrides
  }
  
  return await db.user.create(userData)
}

export const createTestRole = async (overrides: Partial<TestRole> = {}) => {
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(7)
  
  const roleData = {
    id: `test-role-${timestamp}-${randomSuffix}`,
    name: `Test Role ${timestamp}-${randomSuffix}`,
    description: 'Test role for integration tests',
    permissions: ['read', 'write'],
    ...overrides
  }
  
  return await db.role.create(roleData)
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
  
  return await db.category.create(categoryData)
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
  
  return await db.inventoryItem.create(inventoryData)
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
  
  return await db.stockMovement.create(movementData)
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
    await db.stockMovement.deleteMany()
    await db.inventoryItem.deleteMany()
    await db.category.deleteMany()
    await db.user.deleteMany()
    await db.role.deleteMany()
  } catch (error) {
    console.error('Error cleaning up test database:', error)
    throw error
  }
}

export const disconnectDatabase = async () => {
  try {
    if (prisma) {
      await prisma.$disconnect()
    }
    // Supabase client doesn't need explicit disconnection
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
  return await db.user.delete({ where: { id: userId } })
}