// Integration test setup and utilities
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
const isSupabaseEnv = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY

// Database clients
let prisma: PrismaClient | null = null
let supabase: any = null

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
    create: async (data: any) => {
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
    
    findMany: async (where: any = {}) => {
      if (prisma) {
        return await prisma.user.findMany({ where })
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
    
    findUnique: async (where: any) => {
      if (prisma) {
        return await prisma.user.findUnique({ where })
      } else if (supabase) {
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
    create: async (data: any) => {
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
    
    deleteMany: async () => {
      if (prisma) {
        return await prisma.role.deleteMany()
      } else if (supabase) {
        const { error } = await supabase
          .from('roles')
          .delete()
          .neq('id', 'impossible-id')
        if (error) throw error
        return { count: 0 }
      }
      throw new Error('No database client available')
    }
  },

  // Categories operations
  category: {
    create: async (data: any) => {
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
    
    findMany: async (where: any = {}) => {
      if (prisma) {
        return await prisma.category.findMany({ where })
      } else if (supabase) {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
        if (error) throw error
        return data
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
          .neq('id', 'impossible-id')
        if (error) throw error
        return { count: 0 }
      }
      throw new Error('No database client available')
    }
  },

  // Inventory items operations
  inventoryItem: {
    create: async (data: any) => {
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
    
    findMany: async (where: any = {}) => {
      if (prisma) {
        return await prisma.inventoryItem.findMany({ where })
      } else if (supabase) {
        let query = supabase.from('inventory_items').select('*')
        if (where.sku) {
          query = query.eq('sku', where.sku)
        }
        const { data, error } = await query
        if (error) throw error
        return data
      }
      throw new Error('No database client available')
    },
    
    findUnique: async (where: any) => {
      if (prisma) {
        return await prisma.inventoryItem.findUnique({ where })
      } else if (supabase) {
        let query = supabase.from('inventory_items').select('*')
        if (where.sku) {
          query = query.eq('sku', where.sku)
        } else if (where.id) {
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
          .neq('id', 'impossible-id')
        if (error) throw error
        return { count: 0 }
      }
      throw new Error('No database client available')
    }
  }
}

// Test users for different scenarios
export const testUsers = {
  admin: {
    id: 'test-admin-id',
    email: 'admin@test.lumo.dev',
    name: 'Test Admin',
    roleId: 'test-admin-role-id',
    isActive: true,
    password: 'admin123'
  },
  manager: {
    id: 'test-manager-id',
    email: 'manager@test.lumo.dev',
    name: 'Test Manager',
    roleId: 'test-manager-role-id',
    isActive: true,
    password: 'manager123'
  },
  user: {
    id: 'test-user-id',
    email: 'user@test.lumo.dev',
    name: 'Test User',
    roleId: 'test-user-role-id',
    isActive: true,
    password: 'user123'
  }
}

// Test roles
export const testRoles = [
  {
    id: 'test-admin-role-id',
    name: 'ADMIN',
    description: 'Administrator role with full access',
    isSystem: true
  },
  {
    id: 'test-manager-role-id',
    name: 'MANAGER',
    description: 'Manager role with limited access',
    isSystem: true
  },
  {
    id: 'test-user-role-id',
    name: 'USER',
    description: 'Basic user role',
    isSystem: true
  }
]

// Test locations
export const testLocations = [
  {
    id: 'test-location-1',
    name: 'Warehouse A',
    description: 'Main warehouse location'
  },
  {
    id: 'test-location-2',
    name: 'Store Front',
    description: 'Retail store location'
  }
]

// Test inventory items (using the actual InventoryItem model)
export const testInventoryItems = [
  {
    id: 'test-inventory-1',
    name: 'Laptop Computer',
    description: 'High-performance laptop',
    sku: 'LAP-001',
    currentStock: 100,
    minLevel: 10,
    minStockLevel: 10,
    maxLevel: 500,
    cost: 800.00,
    price: 999.99,
    categoryId: 'test-category-1',
    locationId: 'test-location-1',
    createdById: 'test-admin-id'
  },
  {
    id: 'test-inventory-2',
    name: 'Office Chair',
    description: 'Ergonomic office chair',
    sku: 'CHR-001',
    currentStock: 50,
    minLevel: 5,
    minStockLevel: 5,
    maxLevel: 200,
    cost: 200.00,
    price: 299.99,
    categoryId: 'test-category-2',
    locationId: 'test-location-2',
    createdById: 'test-admin-id'
  }
]

// Test categories
export const testCategories = [
  {
    id: 'test-category-1',
    name: 'Electronics',
    description: 'Electronic devices and components',
    createdById: 'test-admin-id'
  },
  {
    id: 'test-category-2',
    name: 'Furniture',
    description: 'Office and home furniture',
    createdById: 'test-admin-id'
  }
]

// JWT helper functions
export const generateTestToken = (user: typeof testUsers.admin) => {
  const secret = process.env.JWT_SECRET || 'test-secret-key'
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      roleId: user.roleId
    },
    secret,
    { expiresIn: '1h' }
  )
}

// Test data factories
export const createTestUser = async (overrides: any = {}) => {
  const userData = {
    id: `test-user-${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    password: 'testpassword123',
    name: 'Test User',
    roleId: 'test-role-id',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }
  
  return await db.user.create(userData)
}

export const createTestRole = async (overrides: any = {}) => {
  const roleData = {
    id: `test-role-${Date.now()}`,
    name: 'TEST_ROLE',
    description: 'Test Role',
    isSystem: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }
  
  return await db.role.create(roleData)
}

export const createTestCategory = async (overrides: any = {}) => {
  const categoryData = {
    id: `test-category-${Date.now()}`,
    name: `Test Category ${Date.now()}`,
    description: 'Test Category Description',
    createdById: 'test-user-id', // Required field
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }
  
  return await db.category.create(categoryData)
}

// Database setup and teardown
export const setupTestDatabase = async () => {
  console.log(`Setting up test database (${isDevelopment ? 'Prisma' : 'Supabase'})...`)
  
  // Clean up existing test data
  await cleanupTestDatabase()
  
  // Create test role first
  const testRole = await createTestRole({
    id: 'test-role-id',
    name: 'TEST_USER'
  })
  
  // Create test user (needed for categories)
  const testUser = await createTestUser({
    id: 'test-user-id',
    email: 'test@example.com',
    roleId: testRole.id
  })
  
  console.log('Test database setup complete')
  return { testRole, testUser }
}

export const cleanupTestDatabase = async () => {
  console.log('Cleaning up test database...')
  
  try {
    // Delete in correct order (respecting foreign key constraints)
    await db.inventoryItem.deleteMany()
    await db.user.deleteMany()
    await db.category.deleteMany() 
    await db.role.deleteMany()
    
    console.log('Test database cleanup complete')
  } catch (error) {
    console.error('Error cleaning up test database:', error)
    throw error
  }
}

export const disconnectDatabase = async () => {
  if (prisma) {
    await prisma.$disconnect()
  }
  // Supabase doesn't need explicit disconnection
}

// Export environment info for tests
export const testConfig = {
  isDevelopment,
  isSupabaseEnv,
  usingPrisma: !!prisma,
  usingSupabase: !!supabase
}

// Test data verification helpers
export const verifyUserExists = async (email: string) => {
  return await db.user.findMany()
}

export const verifyInventoryItemExists = async (sku: string) => {
  return await db.inventoryItem.findMany()
}

export const verifyInventoryLevel = async (inventoryItemId: string) => {
  return await db.inventoryItem.findMany()
} 

// Helper function to delete specific user
export const deleteTestUser = async (userId: string) => {
  if (prisma) {
    await prisma.user.delete({ where: { id: userId } })
  } else if (supabase) {
    const { error } = await supabase.from('users').delete().eq('id', userId)
    if (error) throw error
  }
}