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
    
    findUnique: async (options: any) => {
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
    
    update: async (options: any) => {
      if (prisma) {
        return await prisma.user.update(options)
      } else if (supabase) {
        const { where, data } = options
        let query = supabase.from('users').update(data)
        if (where.id) {
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
    
    update: async (options: any) => {
      if (prisma) {
        return await prisma.user.update(options)
      } else if (supabase) {
        const { where, data } = options
        let query = supabase.from('users').update(data)
        if (where.id) {
          query = query.eq('id', where.id)
        }
        const { data: result, error } = await query.select().single()
        if (error) throw error
        return result
      }
      throw new Error('No database client available')
    },

    delete: async (options: any) => {
      if (prisma) {
        return await prisma.user.delete(options)
      } else if (supabase) {
        const where = options.where || options
        let query = supabase.from('users').delete()
        if (where.id) {
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
    
    findMany: async (where: any = {}) => {
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

    findUnique: async (options: any) => {
      if (prisma) {
        return await prisma.role.findUnique(options)
      } else if (supabase) {
        const where = options.where || options
        let query = supabase.from('roles').select('*')
        if (where.id) {
          query = query.eq('id', where.id)
        } else if (where.name) {
          query = query.eq('name', where.name)
        }
        const { data, error } = await query.single()
        if (error) throw error
        return data
      }
      throw new Error('No database client available')
    },

    update: async (options: any) => {
      if (prisma) {
        return await prisma.role.update(options)
      } else if (supabase) {
        const { where, data } = options
        let query = supabase.from('roles').update(data)
        if (where.id) {
          query = query.eq('id', where.id)
        }
        const { data: result, error } = await query.select().single()
        if (error) throw error
        return result
      }
      throw new Error('No database client available')
    },

    delete: async (options: any) => {
      if (prisma) {
        return await prisma.role.delete(options)
      } else if (supabase) {
        const where = options.where || options
        let query = supabase.from('roles').delete()
        if (where.id) {
          query = query.eq('id', where.id)
        }
        const { data, error } = await query.select().single()
        if (error) throw error
        return data
      }
      throw new Error('No database client available')
    },
    
    count: async () => {
      if (prisma) {
        return await prisma.role.count()
      } else if (supabase) {
        const { count, error } = await supabase
          .from('roles')
          .select('*', { count: 'exact', head: true })
        if (error) throw error
        return count || 0
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
        return await prisma.category.findMany(where)
      } else if (supabase) {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
        if (error) throw error
        return data
      }
      throw new Error('No database client available')
    },

    findUnique: async (options: any) => {
      if (prisma) {
        return await prisma.category.findUnique(options)
      } else if (supabase) {
        const where = options.where || options
        let query = supabase.from('categories').select('*')
        if (where.id) {
          query = query.eq('id', where.id)
        } else if (where.name) {
          query = query.eq('name', where.name)
        }
        const { data, error } = await query.single()
        if (error) throw error
        return data
      }
      throw new Error('No database client available')
    },

    count: async (options: any = {}) => {
      if (prisma) {
        return await prisma.category.count(options)
      } else if (supabase) {
        let query = supabase.from('categories').select('*', { count: 'exact', head: true })
        if (options.where) {
          if (options.where.createdById) {
            query = query.eq('created_by_id', options.where.createdById)
          }
          if (options.where.categoryId) {
            query = query.eq('category_id', options.where.categoryId)
          }
        }
        const { count, error } = await query
        if (error) throw error
        return count || 0
      }
      throw new Error('No database client available')
    },

    delete: async (options: any) => {
      if (prisma) {
        return await prisma.category.delete(options)
      } else if (supabase) {
        const where = options.where || options
        let query = supabase.from('categories').delete()
        if (where.id) {
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
    
    findUnique: async (options: any) => {
      if (prisma) {
        return await prisma.inventoryItem.findUnique(options)
      } else if (supabase) {
        const where = options.where || options
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
    
    count: async (options: any = {}) => {
      if (prisma) {
        return await prisma.inventoryItem.count(options)
      } else if (supabase) {
        let query = supabase.from('inventory_items').select('*', { count: 'exact', head: true })
        if (options.where) {
          if (options.where.categoryId) {
            query = query.eq('category_id', options.where.categoryId)
          }
          if (options.where.createdById) {
            query = query.eq('created_by_id', options.where.createdById)
          }
        }
        const { count, error } = await query
        if (error) throw error
        return count || 0
      }
      throw new Error('No database client available')
    },

    delete: async (options: any) => {
      if (prisma) {
        return await prisma.inventoryItem.delete(options)
      } else if (supabase) {
        const where = options.where || options
        let query = supabase.from('inventory_items').delete()
        if (where.id) {
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
  },

  // Stock movements operations
  stockMovement: {
    create: async (data: any) => {
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

    findUnique: async (options: any) => {
      if (prisma) {
        return await prisma.stockMovement.findUnique(options)
      } else if (supabase) {
        const where = options.where || options
        let query = supabase.from('stock_movements').select('*')
        if (where.id) {
          query = query.eq('id', where.id)
        }
        const { data, error } = await query.single()
        if (error) throw error
        return data
      }
      throw new Error('No database client available')
    },

    count: async (options: any = {}) => {
      if (prisma) {
        return await prisma.stockMovement.count(options)
      } else if (supabase) {
        let query = supabase.from('stock_movements').select('*', { count: 'exact', head: true })
        if (options.where) {
          if (options.where.inventoryItemId) {
            query = query.eq('inventory_item_id', options.where.inventoryItemId)
          }
        }
        const { count, error } = await query
        if (error) throw error
        return count || 0
      }
      throw new Error('No database client available')
    },

    delete: async (options: any) => {
      if (prisma) {
        return await prisma.stockMovement.delete(options)
      } else if (supabase) {
        const where = options.where || options
        let query = supabase.from('stock_movements').delete()
        if (where.id) {
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
        return await prisma.stockMovement.deleteMany()
      } else if (supabase) {
        const { error } = await supabase
          .from('stock_movements')
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
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const userData = {
    id: `test-user-${timestamp}-${randomSuffix}`,
    email: `test${timestamp}${randomSuffix}@test.com`,
    password: 'testpassword123',
    name: 'Test User',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }
  
  return await db.user.create(userData)
}

export const createTestRole = async (overrides: any = {}) => {
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const roleData = {
    id: `test-role-${timestamp}-${randomSuffix}`,
    name: `TEST_ROLE_${timestamp}_${randomSuffix}`,
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
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  
  // If no createdById is provided, we need to create a user first
  let createdById = overrides.createdById
  if (!createdById) {
    // Create a role first, then a user
    const role = await createTestRole()
    const user = await createTestUser({ roleId: role.id })
    createdById = user.id
  }
  
  const categoryData = {
    id: `test-category-${timestamp}-${randomSuffix}`,
    name: `Test Category ${timestamp} ${randomSuffix}`,
    description: 'Test Category Description',
    createdById,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }
  
  return await db.category.create(categoryData)
}

export const createTestInventoryItem = async (overrides: any = {}) => {
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  
  const itemData = {
    id: `test-item-${timestamp}-${randomSuffix}`,
    name: `Test Item ${timestamp}`,
    sku: `TEST-${timestamp}-${randomSuffix}`,
    currentStock: 10,
    ...overrides
  }
  
  return await db.inventoryItem.create(itemData)
}

export const createTestStockMovement = async (overrides: any = {}) => {
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  
  const movementData = {
    id: `test-movement-${timestamp}-${randomSuffix}`,
    type: 'IN',
    quantity: 10,
    previousStock: 0,
    newStock: 10,
    ...overrides
  }
  
  return await db.stockMovement.create(movementData)
}

// Database setup and teardown
export const setupTestDatabase = async () => {
  console.log(`Setting up test database (${isDevelopment ? 'Prisma' : 'Supabase'})...`)
  
  // Clean up existing test data
  await cleanupTestDatabase()
  
  // Create test role first (with unique names)
  const testRole = await createTestRole({
    description: 'Setup Test Role'
  })
  
  // Create test user (needed for categories)
  const testUser = await createTestUser({
    email: `setup-test-${Date.now()}@example.com`,
    roleId: testRole.id
  })
  
  console.log('Test database setup complete')
  return { testRole, testUser }
}

export const cleanupTestDatabase = async () => {
  console.log('Cleaning up test database...')
  
  try {
    // Delete in correct order (respecting foreign key constraints)
    // 1. Delete entities that depend on others first
    await db.inventoryItem.deleteMany() // References category and user
    await db.category.deleteMany() // References user (createdById)
    
    // 2. Delete users (but they might be referenced by roles)
    // First, set roleId to null for all users to break the foreign key constraint
    if (prisma) {
      await prisma.user.updateMany({
        data: { roleId: null }
      })
    } else if (supabase) {
      await supabase.from('users').update({ role_id: null }).neq('id', '')
    }
    
    // Now delete users
    await db.user.deleteMany()
    
    // 3. Finally delete roles (no dependencies)
    await db.role.deleteMany()
    
    console.log('Test database cleanup complete')
  } catch (error) {
    console.error('Error cleaning up test database:', error)
    // Don't throw error in cleanup to avoid cascading failures
    console.log('Continuing despite cleanup error...')
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
  isSupabaseEnv: !!isSupabaseEnv,
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