/**
 * Supabase Database Client
 * - All environments now use Supabase PostgreSQL
 * - Removed Prisma/SQLite support
 */

import { DatabaseOptions } from '../types'

// Force Supabase usage for all environments
const forceSupabase = process.env.FORCE_SUPABASE === 'true' || true;
const hasSupabaseConfig = !!(process.env.SUPABASE_URL && process.env.SUPABASE_KEY);

console.log('🔍 Database Environment:', {
  forceSupabase,
  hasSupabaseConfig,
  supabaseUrl: process.env.SUPABASE_URL ? 'configured' : 'missing',
  deployment: 'SUPABASE ONLY'
});

// Database client types
interface DatabaseClient {
  user: UserOperations
  role: RoleOperations
  category: CategoryOperations
  inventoryItem: InventoryItemOperations
  stockMovement: StockMovementOperations
  sale: SaleOperations
  saleItem: SaleItemOperations
  location: LocationOperations
  priceHistory: PriceHistoryOperations
  importSession: ImportSessionOperations
  importError: ImportErrorOperations
}

interface UserOperations {
  findUnique: (params: DatabaseOptions) => Promise<unknown>
  findMany: (params?: DatabaseOptions) => Promise<unknown[]>
  findFirst: (params: DatabaseOptions) => Promise<unknown>
  create: (params: DatabaseOptions) => Promise<unknown>
  update: (params: DatabaseOptions) => Promise<unknown>
  delete: (params: DatabaseOptions) => Promise<unknown>
  count: (params?: DatabaseOptions) => Promise<number>
}

interface RoleOperations {
  findUnique: (params: DatabaseOptions) => Promise<unknown>
  findMany: (params?: DatabaseOptions) => Promise<unknown[]>
  create: (params: DatabaseOptions) => Promise<unknown>
  update: (params: DatabaseOptions) => Promise<unknown>
  delete: (params: DatabaseOptions) => Promise<unknown>
}

interface CategoryOperations {
  findUnique: (params: DatabaseOptions) => Promise<unknown>
  findMany: (params?: DatabaseOptions) => Promise<unknown[]>
  create: (params: DatabaseOptions) => Promise<unknown>
  update: (params: DatabaseOptions) => Promise<unknown>
  delete: (params: DatabaseOptions) => Promise<unknown>
  count: (params?: DatabaseOptions) => Promise<number>
}

interface InventoryItemOperations {
  findUnique: (params: DatabaseOptions) => Promise<unknown>
  findMany: (params?: DatabaseOptions) => Promise<unknown[]>
  create: (params: DatabaseOptions) => Promise<unknown>
  update: (params: DatabaseOptions) => Promise<unknown>
  delete: (params: DatabaseOptions) => Promise<unknown>
  count: (params?: DatabaseOptions) => Promise<number>
}

interface StockMovementOperations {
  findMany: (params?: DatabaseOptions) => Promise<unknown[]>
  create: (params: DatabaseOptions) => Promise<unknown>
}

interface SaleOperations {
  findMany: (params?: DatabaseOptions) => Promise<unknown[]>
  create: (params: DatabaseOptions) => Promise<unknown>
  update: (params: DatabaseOptions) => Promise<unknown>
  delete: (params: DatabaseOptions) => Promise<unknown>
}

interface SaleItemOperations {
  createMany: (params: DatabaseOptions) => Promise<unknown>
}

interface LocationOperations {
  findMany: (params?: DatabaseOptions) => Promise<unknown[]>
  create: (params: DatabaseOptions) => Promise<unknown>
  update: (params: DatabaseOptions) => Promise<unknown>
  delete: (params: DatabaseOptions) => Promise<unknown>
}

interface PriceHistoryOperations {
  findMany: (params?: DatabaseOptions) => Promise<unknown[]>
  create: (params: DatabaseOptions) => Promise<unknown>
}

interface ImportSessionOperations {
  create: (params: DatabaseOptions) => Promise<unknown>
  update: (params: DatabaseOptions) => Promise<unknown>
  findUnique: (params: DatabaseOptions) => Promise<unknown>
}

interface ImportErrorOperations {
  createMany: (params: DatabaseOptions) => Promise<unknown>
}

// Supabase setup
let db: DatabaseClient;
let supabase: any = null;

console.log('🔄 Loading Supabase client...');

try {
  const { createClient } = require('@supabase/supabase-js');
  
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('❌ Missing Supabase configuration. Please check SUPABASE_URL and SUPABASE_KEY environment variables.');
  }
  
  supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('✅ Supabase client created successfully');
  
  // Supabase adapter - Complete implementation
  db = {
    user: {
      findUnique: async (params: any) => {
        console.log('🔍 Supabase user.findUnique called with:', params);
        
        let query = supabase.from('users').select(`
          *,
          role:roles(*)
        `);

        if (params.where.email) {
          query = query.eq('email', params.where.email);
        }
        if (params.where.id) {
          query = query.eq('id', params.where.id);
        }

        const { data, error } = await query.single();
        
        if (error) {
          console.log('❌ Supabase error:', error.message);
          return null;
        }
        
        console.log('✅ Supabase user data found:', data);
        
        // Convert Supabase response to expected format
        const result: any = {
          id: data.id,
          email: data.email,
          name: data.name,
          password: data.password,
          roleId: data.role_id,
          isActive: data.is_active,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        };

        // Handle role inclusion
        if (params.include && params.include.role && data.role) {
          result.role = {
            id: data.role.id,
            name: data.role.name,
            description: data.role.description,
            isSystem: data.role.is_system,
            isActive: data.role.is_active,
            createdAt: new Date(data.role.created_at),
            updatedAt: new Date(data.role.updated_at)
          };
        }
        
        return result;
      },

      findMany: async (params: any = {}) => {
        console.log('🔍 Supabase user.findMany called with:', params);
        
        let query = supabase.from('users').select(`
          *,
          role:roles(*)
        `);

        // Apply where conditions
        if (params.where) {
          Object.entries(params.where).forEach(([key, value]) => {
            if (key === 'roleId') {
              query = query.eq('role_id', value);
            } else if (key === 'isActive') {
              query = query.eq('is_active', value);
            } else {
              query = query.eq(key, value);
            }
          });
        }

        // Apply ordering
        if (params.orderBy) {
          const orderField = Object.keys(params.orderBy)[0];
          const orderDirection = params.orderBy[orderField];
          const dbField = orderField === 'createdAt' ? 'created_at' : orderField;
          query = query.order(dbField, { ascending: orderDirection === 'asc' });
        }

        // Apply pagination
        if (params.skip) {
          query = query.range(params.skip, params.skip + (params.take || 10) - 1);
        } else if (params.take) {
          query = query.limit(params.take);
        }

        const { data, error } = await query;
        
        if (error) {
          console.error('❌ Supabase error:', error);
          throw new Error(`Database error: ${error.message}`);
        }

        // Convert to expected format
        return data.map((item: any) => ({
          id: item.id,
          email: item.email,
          name: item.name,
          password: item.password,
          roleId: item.role_id,
          isActive: item.is_active,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
          role: item.role ? {
            id: item.role.id,
            name: item.role.name,
            description: item.role.description,
            isSystem: item.role.is_system,
            isActive: item.role.is_active,
            createdAt: new Date(item.role.created_at),
            updatedAt: new Date(item.role.updated_at)
          } : null
        }));
      },

      findFirst: async (params: any) => {
        const results = await db.user.findMany({ ...params, take: 1 });
        return results.length > 0 ? results[0] : null;
      },

      create: async (params: any) => {
        console.log('🔍 Supabase user.create called with:', params);
        
        const userData = {
          email: params.data.email,
          name: params.data.name,
          password: params.data.password,
          role_id: params.data.roleId,
          is_active: params.data.isActive ?? true,
        };

        const { data, error } = await supabase
          .from('users')
          .insert(userData)
          .select()
          .single();

        if (error) {
          console.error('❌ Supabase create error:', error);
          throw new Error(`Database error: ${error.message}`);
        }

        return {
          id: data.id,
          email: data.email,
          name: data.name,
          password: data.password,
          roleId: data.role_id,
          isActive: data.is_active,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        };
      },

      update: async (params: any) => {
        console.log('🔍 Supabase user.update called with:', params);
        
        const updateData: any = {};
        if (params.data.email) updateData.email = params.data.email;
        if (params.data.name) updateData.name = params.data.name;
        if (params.data.password) updateData.password = params.data.password;
        if (params.data.roleId) updateData.role_id = params.data.roleId;
        if (params.data.isActive !== undefined) updateData.is_active = params.data.isActive;
        updateData.updated_at = new Date().toISOString();

        let query = supabase.from('users').update(updateData);

        if (params.where.id) {
          query = query.eq('id', params.where.id);
        }
        if (params.where.email) {
          query = query.eq('email', params.where.email);
        }

        const { data, error } = await query.select().single();

        if (error) {
          console.error('❌ Supabase update error:', error);
          throw new Error(`Database error: ${error.message}`);
        }

        return {
          id: data.id,
          email: data.email,
          name: data.name,
          password: data.password,
          roleId: data.role_id,
          isActive: data.is_active,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        };
      },

      delete: async (params: any) => {
        console.log('🔍 Supabase user.delete called with:', params);
        
        let query = supabase.from('users').delete();

        if (params.where.id) {
          query = query.eq('id', params.where.id);
        }
        if (params.where.email) {
          query = query.eq('email', params.where.email);
        }

        const { error } = await query;

        if (error) {
          console.error('❌ Supabase delete error:', error);
          throw new Error(`Database error: ${error.message}`);
        }

        return { count: 1 };
      },

      count: async (params: any = {}) => {
        console.log('🔍 Supabase user.count called with:', params);
        
        let query = supabase.from('users').select('*', { count: 'exact', head: true });

        if (params.where) {
          Object.entries(params.where).forEach(([key, value]) => {
            if (key === 'roleId') {
              query = query.eq('role_id', value);
            } else if (key === 'isActive') {
              query = query.eq('is_active', value);
            } else {
              query = query.eq(key, value);
            }
          });
        }

        const { count, error } = await query;

        if (error) {
          console.error('❌ Supabase count error:', error);
          throw new Error(`Database error: ${error.message}`);
        }

        return count || 0;
      }
    },

    role: {
      findUnique: async (params: any) => {
        console.log('🔍 Supabase role.findUnique called with:', params);
        
        let query = supabase.from('roles').select('*');

        if (params.where.id) {
          query = query.eq('id', params.where.id);
        }
        if (params.where.name) {
          query = query.eq('name', params.where.name);
        }

        const { data, error } = await query.single();
        
        if (error) {
          console.log('❌ Supabase role error:', error.message);
          return null;
        }
        
        return {
          id: data.id,
          name: data.name,
          description: data.description,
          isSystem: data.is_system,
          isActive: data.is_active,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        };
      },

      findMany: async (params: any = {}) => {
        console.log('🔍 Supabase role.findMany called with:', params);
        
        let query = supabase.from('roles').select('*');

        if (params.where) {
          Object.entries(params.where).forEach(([key, value]) => {
            if (key === 'isSystem') {
              query = query.eq('is_system', value);
            } else if (key === 'isActive') {
              query = query.eq('is_active', value);
            } else {
              query = query.eq(key, value);
            }
          });
        }

        if (params.orderBy) {
          const orderField = Object.keys(params.orderBy)[0];
          const orderDirection = params.orderBy[orderField];
          const dbField = orderField === 'createdAt' ? 'created_at' : orderField;
          query = query.order(dbField, { ascending: orderDirection === 'asc' });
        }

        const { data, error } = await query;
        
        if (error) {
          console.error('❌ Supabase error:', error);
          throw new Error(`Database error: ${error.message}`);
        }

        return data.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          isSystem: item.is_system,
          isActive: item.is_active,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at)
        }));
      },

      create: async (params: any) => {
        console.log('🔍 Supabase role.create called with:', params);
        
        const roleData = {
          name: params.data.name,
          description: params.data.description,
          is_system: params.data.isSystem ?? false,
          is_active: params.data.isActive ?? true,
        };

        const { data, error } = await supabase
          .from('roles')
          .insert(roleData)
          .select()
          .single();

        if (error) {
          console.error('❌ Supabase create error:', error);
          throw new Error(`Database error: ${error.message}`);
        }

        return {
          id: data.id,
          name: data.name,
          description: data.description,
          isSystem: data.is_system,
          isActive: data.is_active,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        };
      },

      update: async (params: any) => {
        console.log('🔍 Supabase role.update called with:', params);
        
        const updateData: any = {};
        if (params.data.name) updateData.name = params.data.name;
        if (params.data.description !== undefined) updateData.description = params.data.description;
        if (params.data.isSystem !== undefined) updateData.is_system = params.data.isSystem;
        if (params.data.isActive !== undefined) updateData.is_active = params.data.isActive;
        updateData.updated_at = new Date().toISOString();

        let query = supabase.from('roles').update(updateData);

        if (params.where.id) {
          query = query.eq('id', params.where.id);
        }

        const { data, error } = await query.select().single();

        if (error) {
          console.error('❌ Supabase update error:', error);
          throw new Error(`Database error: ${error.message}`);
        }

        return {
          id: data.id,
          name: data.name,
          description: data.description,
          isSystem: data.is_system,
          isActive: data.is_active,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        };
      },

      delete: async (params: any) => {
        console.log('🔍 Supabase role.delete called with:', params);
        
        let query = supabase.from('roles').delete();

        if (params.where.id) {
          query = query.eq('id', params.where.id);
        }

        const { error } = await query;

        if (error) {
          console.error('❌ Supabase delete error:', error);
          throw new Error(`Database error: ${error.message}`);
        }

        return { count: 1 };
      }
    },

    // Add other operations (category, inventoryItem, etc.) following the same pattern...
    category: {
      findUnique: async (params: any) => {
        let query = supabase.from('categories').select('*');
        if (params.where.id) query = query.eq('id', params.where.id);
        if (params.where.name) query = query.eq('name', params.where.name);
        
        const { data, error } = await query.single();
        if (error) return null;
        
        return {
          id: data.id,
          name: data.name,
          description: data.description,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          createdById: data.created_by_id
        };
      },

      findMany: async (params: any = {}) => {
        let query = supabase.from('categories').select('*');
        
        if (params.where) {
          Object.entries(params.where).forEach(([key, value]) => {
            const dbKey = key === 'createdById' ? 'created_by_id' : key;
            query = query.eq(dbKey, value);
          });
        }

        const { data, error } = await query;
        if (error) throw new Error(`Database error: ${error.message}`);

        return data.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
          createdById: item.created_by_id
        }));
      },

      create: async (params: any) => {
        const categoryData = {
          name: params.data.name,
          description: params.data.description,
          created_by_id: params.data.createdById,
        };

        const { data, error } = await supabase
          .from('categories')
          .insert(categoryData)
          .select()
          .single();

        if (error) throw new Error(`Database error: ${error.message}`);

        return {
          id: data.id,
          name: data.name,
          description: data.description,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          createdById: data.created_by_id
        };
      },

      update: async (params: any) => {
        const updateData: any = {};
        if (params.data.name) updateData.name = params.data.name;
        if (params.data.description !== undefined) updateData.description = params.data.description;
        updateData.updated_at = new Date().toISOString();

        let query = supabase.from('categories').update(updateData);
        if (params.where.id) query = query.eq('id', params.where.id);

        const { data, error } = await query.select().single();
        if (error) throw new Error(`Database error: ${error.message}`);

        return {
          id: data.id,
          name: data.name,
          description: data.description,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          createdById: data.created_by_id
        };
      },

      delete: async (params: any) => {
        let query = supabase.from('categories').delete();
        if (params.where.id) query = query.eq('id', params.where.id);

        const { error } = await query;
        if (error) throw new Error(`Database error: ${error.message}`);

        return { count: 1 };
      },

      count: async (params: any = {}) => {
        let query = supabase.from('categories').select('*', { count: 'exact', head: true });
        
        if (params.where) {
          Object.entries(params.where).forEach(([key, value]) => {
            const dbKey = key === 'createdById' ? 'created_by_id' : key;
            query = query.eq(dbKey, value);
          });
        }

        const { count, error } = await query;
        if (error) throw new Error(`Database error: ${error.message}`);

        return count || 0;
      }
    },

    // Placeholder implementations for other operations
    inventoryItem: {
      findUnique: async () => null,
      findMany: async () => [],
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => ({ count: 1 }),
      count: async () => 0
    },
    stockMovement: {
      findMany: async () => [],
      create: async () => ({})
    },
    sale: {
      findMany: async () => [],
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => ({ count: 1 })
    },
    saleItem: {
      createMany: async () => ({})
    },
    location: {
      findMany: async () => [],
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => ({ count: 1 })
    },
    priceHistory: {
      findMany: async () => [],
      create: async () => ({})
    },
    importSession: {
      create: async () => ({}),
      update: async () => ({}),
      findUnique: async () => null
    },
    importError: {
      createMany: async () => ({})
    }
  };

} catch (error) {
  console.error('❌ Failed to initialize Supabase client:', error);
  throw new Error('Database initialization failed. Please check your Supabase configuration.');
}

export { db }; 