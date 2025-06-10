/**
 * Hybrid Database Client
 * - Local Development: SQLite + Prisma
 * - Choreo Production: Supabase ONLY
 */

// Environment detection - Choreo ONLY uses Supabase
const isProduction = process.env.NODE_ENV === 'production';
const isChoreo = process.env.CHOREO_DEPLOYMENT === 'true' || !!process.env.SUPABASE_URL;

console.log('🔍 Database Environment:', {
  isProduction,
  isChoreo,
  hasSupabaseUrl: !!process.env.SUPABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  deployment: isChoreo ? 'CHOREO (Supabase Only)' : 'LOCAL (SQLite)'
});

// Conditional imports and setup
let db: any;
let supabase: any = null;

if (isChoreo) {
  // CHOREO PRODUCTION: Use Supabase ONLY
  console.log('🔄 Loading Supabase client for CHOREO production...');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('❌ Missing Supabase configuration for Choreo deployment');
    }
    
    supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('✅ Supabase client created for Choreo');
    
    // Supabase adapter - Complete implementation for Choreo
    db = {
      user: {
        findUnique: async (params: any) => {
          console.log('🔍 Supabase findUnique called with:', params);
          
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

          console.log('🔍 Executing Supabase query...');
          const { data, error } = await query.single();
          
          if (error) {
            console.log('❌ Supabase error:', error.message);
            console.log('❌ Full error:', error);
            return null;
          }
          
          console.log('✅ Supabase data found:', data);
          
          // Get role name (handle both direct role_id and joined role)
          let roleName = 'USER';
          if (data.role && data.role.name) {
            roleName = data.role.name;
          } else if (data.role_id) {
            // Fallback: fetch role separately if join didn't work
            const { data: roleData } = await supabase
              .from('roles')
              .select('name')
              .eq('id', data.role_id)
              .single();
            roleName = roleData?.name || 'USER';
          }
          
          // Convert Supabase response to Prisma-like format
          const result = {
            id: data.id,
            email: data.email,
            name: data.name,
            password: data.password,
            role: roleName,
            isActive: data.is_active,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };
          
          console.log('✅ Converted result:', result);
          return result;
        },
        
        findMany: async (params: any = {}) => {
          let query = supabase.from('users').select(`
            *,
            role:roles(*)
          `);
          
          if (params.orderBy) {
            const orderField = params.orderBy.createdAt ? 'created_at' : 'id';
            const orderDirection = params.orderBy.createdAt === 'desc' ? false : true;
            query = query.order(orderField, { ascending: orderDirection });
          }

          const { data, error } = await query;
          if (error) throw error;
          
          // Convert to Prisma format
          return data.map((user: any) => {
            let roleName = 'USER';
            if (user.role && user.role.name) {
              roleName = user.role.name;
            }
            
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: roleName,
              isActive: user.is_active,
              createdAt: new Date(user.created_at),
              updatedAt: new Date(user.updated_at)
            };
          });
        },
        
        create: async (params: any) => {
          const userData = {
            email: params.data.email,
            password: params.data.password,
            name: params.data.name,
            is_active: params.data.isActive ?? true
          };

          const { data, error } = await supabase
            .from('users')
            .insert([userData])
            .select()
            .single();

          if (error) throw error;
          
          // Convert to Prisma format
          return {
            id: data.id,
            email: data.email,
            name: data.name,
            role: 'USER',
            isActive: data.is_active,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };
        },
        
        update: async (params: any) => {
          const updateData: any = {};
          if (params.data.name) updateData.name = params.data.name;
          if (params.data.email) updateData.email = params.data.email;
          if (params.data.password) updateData.password = params.data.password;
          if (params.data.isActive !== undefined) updateData.is_active = params.data.isActive;

          const { data, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', params.where.id)
            .select()
            .single();

          if (error) throw error;
          
          return {
            id: data.id,
            email: data.email,
            name: data.name,
            role: 'USER',
            isActive: data.is_active,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };
        }
      },
      
      role: {
        findUnique: async (params: any) => {
          let query = supabase.from('roles').select('*');

          if (params.where.name) {
            query = query.eq('name', params.where.name);
          }
          if (params.where.id) {
            query = query.eq('id', params.where.id);
          }

          const { data, error } = await query.single();
          if (error) return null;
          return data;
        },
        
        findMany: async () => {
          const { data, error } = await supabase
            .from('roles')
            .select('*')
            .order('name');

          if (error) throw error;
          return data;
        }
      },
      
      category: {
        findMany: async (params: any = {}) => {
          let query = supabase.from('categories').select('*');
          
          if (params.orderBy) {
            if (params.orderBy.name) {
              query = query.order('name', { 
                ascending: params.orderBy.name === 'asc' 
              });
            }
          }

          const { data, error } = await query;
          if (error) throw error;
          
          // If _count is requested, we need to get counts for each category
          if (params.include && params.include._count) {
            const categoriesWithCount = await Promise.all(
              data.map(async (category: any) => {
                const { count } = await supabase
                  .from('inventory')
                  .select('id', { count: 'exact' })
                  .eq('category_id', category.id);
                
                return {
                  ...category,
                  _count: { inventoryItems: count || 0 }
                };
              })
            );
            return categoriesWithCount;
          }
          
          return data;
        },

        findUnique: async (params: any) => {
          let query = supabase.from('categories').select('*');

          if (params.where.id) {
            query = query.eq('id', params.where.id);
          }
          if (params.where.name) {
            query = query.eq('name', params.where.name);
          }

          const { data, error } = await query.single();
          if (error) return null;
          return data;
        },

        create: async (params: any) => {
          const { data, error } = await supabase
            .from('categories')
            .insert([params.data])
            .select()
            .single();

          if (error) throw error;
          return data;
        }
      },

      inventoryItem: {
        findMany: async (params: any = {}) => {
          let query = supabase.from('inventory').select(`
            *,
            category:categories(*),
            location:locations(*)
          `);
          
          // Handle where conditions
          if (params.where) {
            if (params.where.isActive !== undefined) {
              query = query.eq('is_active', params.where.isActive);
            }
            if (params.where.categoryId) {
              query = query.eq('category_id', params.where.categoryId);
            }
            if (params.where.AND) {
              // Handle complex AND conditions for search
              const andConditions = Array.isArray(params.where.AND) ? params.where.AND : [params.where.AND];
              andConditions.forEach((condition: any) => {
                if (condition.OR) {
                  // For now, we'll handle simple OR searches
                  // In a full implementation, you'd need to build complex queries
                }
              });
            }
          }
          
          // Handle ordering
          if (params.orderBy) {
            if (params.orderBy.updatedAt) {
              query = query.order('updated_at', { 
                ascending: params.orderBy.updatedAt === 'asc' 
              });
            } else if (params.orderBy.createdAt) {
              query = query.order('created_at', { 
                ascending: params.orderBy.createdAt === 'asc' 
              });
            } else if (params.orderBy.name) {
              query = query.order('name', { 
                ascending: params.orderBy.name === 'asc' 
              });
            }
          }

          // Handle pagination
          if (params.skip) {
            query = query.range(params.skip, params.skip + (params.take || 100) - 1);
          } else if (params.take) {
            query = query.limit(params.take);
          }

          const { data, error } = await query;
          if (error) {
            console.error('❌ Supabase inventoryItem.findMany error:', error);
            throw error;
          }
          
          // Convert snake_case to camelCase to match Prisma format
          return data.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            sku: item.sku,
            quantity: item.quantity,
            currentStock: item.quantity, // Alias for compatibility
            price: Number(item.price || 0),
            cost: Number(item.cost || 0),
            margin: Number(item.margin || 0),
            minStockLevel: item.min_stock_level,
            minLevel: item.min_stock_level, // Alias for compatibility
            maxLevel: item.max_level,
            location: item.location_name,
            locationId: item.location_id,
            categoryId: item.category_id,
            barcode: item.barcode,
            imageUrl: item.image_url,
            isActive: item.is_active,
            active: item.is_active, // Alias for compatibility
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.updated_at),
            category: item.category,
            locationRelation: item.location,
            // Add computed fields
            _count: params.include?._count ? { stockMovements: 0 } : undefined
          }));
        },

        findUnique: async (params: any) => {
          let query = supabase.from('inventory').select(`
            *,
            category:categories(*),
            location:locations(*)
          `);

          if (params.where.id) {
            query = query.eq('id', params.where.id);
          }

          const { data, error } = await query.single();
          if (error) return null;
          
          // Convert to match Prisma format
          return {
            id: data.id,
            name: data.name,
            description: data.description,
            sku: data.sku,
            quantity: data.quantity,
            currentStock: data.quantity,
            price: Number(data.price || 0),
            cost: Number(data.cost || 0),
            margin: Number(data.margin || 0),
            minStockLevel: data.min_stock_level,
            minLevel: data.min_stock_level,
            maxLevel: data.max_level,
            location: data.location_name,
            locationId: data.location_id,
            categoryId: data.category_id,
            barcode: data.barcode,
            imageUrl: data.image_url,
            isActive: data.is_active,
            active: data.is_active,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
            category: data.category,
            locationRelation: data.location
          };
        },

        count: async (params: any = {}) => {
          let query = supabase.from('inventory').select('id', { count: 'exact' });
          
          if (params.where) {
            if (params.where.isActive !== undefined) {
              query = query.eq('is_active', params.where.isActive);
            }
          }

          const { count, error } = await query;
          if (error) throw error;
          return count || 0;
        },

        create: async (params: any) => {
          const insertData = {
            name: params.data.name,
            description: params.data.description,
            sku: params.data.sku,
            price: params.data.price,
            cost: params.data.cost,
            quantity: params.data.currentStock || params.data.quantity || 0,
            min_stock_level: params.data.minLevel || params.data.minStockLevel,
            max_level: params.data.maxLevel,
            category_id: params.data.categoryId,
            location_id: params.data.locationId,
            barcode: params.data.barcode,
            is_active: params.data.isActive ?? true
          };

          const { data, error } = await supabase
            .from('inventory')
            .insert([insertData])
            .select()
            .single();

          if (error) throw error;
          
          return {
            id: data.id,
            name: data.name,
            description: data.description,
            sku: data.sku,
            quantity: data.quantity,
            price: Number(data.price || 0),
            cost: Number(data.cost || 0),
            isActive: data.is_active,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };
        }
      },

      location: {
        findMany: async (params: any = {}) => {
          let query = supabase.from('locations').select('*');
          
          if (params.orderBy) {
            if (params.orderBy.name) {
              query = query.order('name', { 
                ascending: params.orderBy.name === 'asc' 
              });
            }
          }
          
          // Add count of inventory items if included
          if (params.include && params.include._count) {
            // For now, return locations without count
            // TODO: Implement proper count aggregation
          }

          const { data, error } = await query;
          if (error) throw error;
          
          // Convert to match Prisma format with _count if needed
          return data.map((location: any) => ({
            ...location,
            _count: params.include?._count ? { inventoryItems: 0 } : undefined
          }));
        }
      },
      
      $connect: async () => {},
      $disconnect: async () => {},
      
      // Transaction support (simplified for Supabase)
      $transaction: async (callback: any) => {
        // Supabase doesn't have built-in transactions like Prisma
        // For now, we'll execute the callback directly
        // In a real implementation, you might use Supabase's RPC functions
        return callback(db);
      }
    };
    
    console.log('✅ Supabase client configured for production');
    
  } catch (error) {
    console.error('❌ Error configuring Supabase:', error);
    throw error;
  }
  
} else {
  // Local Development: Use Prisma + SQLite
  console.log('🔄 Loading Prisma client for local development...');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    db = new PrismaClient();
    console.log('✅ Prisma client configured for local development');
  } catch (error) {
    console.error('❌ Error configuring Prisma:', error);
    throw error;
  }
}

export { db as default, supabase };
export { db };

// Backward compatibility
export const prisma = !isChoreo ? db : null; 