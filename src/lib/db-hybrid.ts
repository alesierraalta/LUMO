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
          
          // Convert Supabase response to Prisma-like format
          const result: any = {
            id: data.id,
            email: data.email,
            name: data.name,
            password: data.password,
            roleId: data.role_id, // Include the foreign key
            isActive: data.is_active,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };

          // Handle role inclusion based on include parameter
          if (params.include && params.include.role) {
            // Return full role object when include.role is true
            if (data.role && data.role.id) {
              result.role = {
                id: data.role.id,
                name: data.role.name,
                description: data.role.description,
                isSystem: data.role.is_system,
                isActive: data.role.is_active,
                createdAt: new Date(data.role.created_at),
                updatedAt: new Date(data.role.updated_at)
              };
            } else if (data.role_id) {
              // Fallback: fetch role separately if join didn't work
              console.log('🔄 Fetching role separately for role_id:', data.role_id);
              const { data: roleData } = await supabase
                .from('roles')
                .select('*')
                .eq('id', data.role_id)
                .single();
              
              if (roleData) {
                result.role = {
                  id: roleData.id,
                  name: roleData.name,
                  description: roleData.description,
                  isSystem: roleData.is_system,
                  isActive: roleData.is_active,
                  createdAt: new Date(roleData.created_at),
                  updatedAt: new Date(roleData.updated_at)
                };
              } else {
                console.warn('⚠️ Role not found for role_id:', data.role_id);
                result.role = null;
              }
            } else {
              result.role = null;
            }
          } else {
            // When include.role is not specified, just include role name for backward compatibility
            let roleName = 'USER';
            if (data.role && data.role.name) {
              roleName = data.role.name;
            } else if (data.role_id) {
              // Fallback: fetch role name separately
              const { data: roleData } = await supabase
                .from('roles')
                .select('name')
                .eq('id', data.role_id)
                .single();
              roleName = roleData?.name || 'USER';
            }
            result.role = roleName;
          }
          
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
        
        findFirst: async (params: any) => {
          let query = supabase.from('users').select(`
            *,
            role:roles(*)
          `);

          if (params.where) {
            if (params.where.email) {
              query = query.eq('email', params.where.email);
            }
            if (params.where.id) {
              query = query.eq('id', params.where.id);
            }
            if (params.where.role) {
              query = query.eq('role', params.where.role);
            }
            if (params.where.isActive !== undefined) {
              query = query.eq('is_active', params.where.isActive);
            }
          }

          const { data, error } = await query.limit(1);
          if (error || !data || data.length === 0) return null;
          
          const user = data[0];
          let roleName = 'USER';
          if (user.role && user.role.name) {
            roleName = user.role.name;
          } else if (user.role_id) {
            // Fallback: fetch role separately if join didn't work
            const { data: roleData } = await supabase
              .from('roles')
              .select('name')
              .eq('id', user.role_id)
              .single();
            roleName = roleData?.name || 'USER';
          }
          
          // Convert Supabase response to Prisma-like format
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            password: user.password,
            role: roleName,
            isActive: user.is_active,
            createdAt: new Date(user.created_at),
            updatedAt: new Date(user.updated_at)
          };
        },
        
        create: async (params: any) => {
          const userData = {
            email: params.data.email,
            password: params.data.password,
            name: params.data.name,
            role_id: params.data.roleId,
            is_active: params.data.isActive ?? true
          };

          const { data, error } = await supabase
            .from('users')
            .insert([userData])
            .select()
            .single();

          if (error) throw error;
          
          let result: any = {
            id: data.id,
            email: data.email,
            name: data.name,
            roleId: data.role_id,
            isActive: data.is_active,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };
          
          // If include.role is requested, fetch the role data
          if (params.include && params.include.role) {
            const { data: roleData } = await supabase
              .from('roles')
              .select('*')
              .eq('id', data.role_id)
              .single();
              
            if (roleData) {
              result.role = {
                id: roleData.id,
                name: roleData.name,
                description: roleData.description,
                permissions: roleData.permissions,
                isSystem: roleData.is_system,
                isActive: roleData.is_active,
                createdAt: new Date(roleData.created_at),
                updatedAt: new Date(roleData.updated_at)
              };
            }
          }
          
          return result;
        },
        
        update: async (params: any) => {
          const updateData: any = {};
          if (params.data.name) updateData.name = params.data.name;
          if (params.data.email) updateData.email = params.data.email;
          if (params.data.password) updateData.password = params.data.password;
          if (params.data.roleId) updateData.role_id = params.data.roleId;
          if (params.data.isActive !== undefined) updateData.is_active = params.data.isActive;

          const { data, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', params.where.id)
            .select()
            .single();

          if (error) throw error;
          
          const result: any = {
            id: data.id,
            email: data.email,
            name: data.name,
            roleId: data.role_id,
            isActive: data.is_active,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };

          // Handle role inclusion based on include parameter
          if (params.include && params.include.role) {
            // Fetch the role data
            const { data: roleData } = await supabase
              .from('roles')
              .select('*')
              .eq('id', data.role_id)
              .single();
              
            if (roleData) {
              result.role = {
                id: roleData.id,
                name: roleData.name,
                description: roleData.description,
                isSystem: roleData.is_system,
                isActive: roleData.is_active,
                createdAt: new Date(roleData.created_at),
                updatedAt: new Date(roleData.updated_at)
              };
            } else {
              result.role = null;
            }
          }
          
          return result;
        },

        delete: async (params: any) => {
          let query = supabase.from('users').delete().select();

          if (params.where.id) {
            query = query.eq('id', params.where.id);
          }
          if (params.where.email) {
            query = query.eq('email', params.where.email);
          }

          const { data, error } = await query.single();
          if (error) throw error;
          
          // Convert back to camelCase for consistency
          return {
            id: data.id,
            email: data.email,
            name: data.name,
            roleId: data.role_id,
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
          
          // Convert to match Prisma format
          return {
            id: data.id,
            name: data.name,
            description: data.description,
            permissions: data.permissions,
            isSystem: data.is_system,
            isActive: data.is_active,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };
        },
        
        findFirst: async (params: any) => {
          let query = supabase.from('roles').select('*');

          if (params.where) {
            if (params.where.id) {
              query = query.eq('id', params.where.id);
            }
            if (params.where.name) {
              query = query.eq('name', params.where.name);
            }
            if (params.where.isActive !== undefined) {
              query = query.eq('is_active', params.where.isActive);
            }
          }

          const { data, error } = await query.limit(1);
          if (error || !data || data.length === 0) return null;
          
          // Convert to match Prisma format
          const role = data[0];
          return {
            id: role.id,
            name: role.name,
            description: role.description,
            permissions: role.permissions,
            isSystem: role.is_system,
            isActive: role.is_active,
            createdAt: new Date(role.created_at),
            updatedAt: new Date(role.updated_at)
          };
        },
        
        findMany: async (params: any = {}) => {
          let query = supabase.from('roles').select('*');
          
          if (params.orderBy) {
            if (params.orderBy.name) {
              query = query.order('name', { 
                ascending: params.orderBy.name === 'asc' 
              });
            }
          } else {
            query = query.order('name');
          }

          if (params.where) {
            if (params.where.isActive !== undefined) {
              query = query.eq('is_active', params.where.isActive);
            }
          }

          const { data, error } = await query;
          if (error) throw error;
          
          // Convert to match Prisma format
          return data.map((role: any) => ({
            id: role.id,
            name: role.name,
            description: role.description,
            permissions: role.permissions,
            isSystem: role.is_system,
            isActive: role.is_active,
            createdAt: new Date(role.created_at),
            updatedAt: new Date(role.updated_at)
          }));
        },

        create: async (params: any) => {
          const insertData = {
            name: params.data.name,
            description: params.data.description,
            permissions: params.data.permissions,
            is_system: params.data.isSystem || false,
            is_active: params.data.isActive !== undefined ? params.data.isActive : true
          };

          const { data, error } = await supabase
            .from('roles')
            .insert([insertData])
            .select()
            .single();

          if (error) throw error;
          
          // Convert to match Prisma format
          return {
            id: data.id,
            name: data.name,
            description: data.description,
            permissions: data.permissions,
            isSystem: data.is_system,
            isActive: data.is_active,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };
        },

        update: async (params: any) => {
          const updateData: any = {};
          
          if (params.data.name !== undefined) updateData.name = params.data.name;
          if (params.data.description !== undefined) updateData.description = params.data.description;
          if (params.data.permissions !== undefined) updateData.permissions = params.data.permissions;
          if (params.data.isActive !== undefined) updateData.is_active = params.data.isActive;

          const { data, error } = await supabase
            .from('roles')
            .update(updateData)
            .eq('id', params.where.id)
            .select()
            .single();

          if (error) throw error;
          
          // Convert to match Prisma format
          return {
            id: data.id,
            name: data.name,
            description: data.description,
            permissions: data.permissions,
            isSystem: data.is_system,
            isActive: data.is_active,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };
        },

        delete: async (params: any) => {
          // Check if role is system role (cannot be deleted)
          const role = await supabase
            .from('roles')
            .select('is_system')
            .eq('id', params.where.id)
            .single();

          if (role.data?.is_system) {
            throw new Error('Cannot delete system roles');
          }

          const { data, error } = await supabase
            .from('roles')
            .delete()
            .eq('id', params.where.id)
            .select()
            .single();

          if (error) throw error;
          
          // Convert to match Prisma format
          return {
            id: data.id,
            name: data.name,
            description: data.description,
            permissions: data.permissions,
            isSystem: data.is_system,
            isActive: data.is_active,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };
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
                  .from('inventory_items')
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
          
          // Convert snake_case to camelCase for consistency
          return data.map((category: any) => ({
            id: category.id,
            name: category.name,
            description: category.description,
            createdById: category.created_by_id,
            createdAt: new Date(category.created_at),
            updatedAt: new Date(category.updated_at)
          }));
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
          
          // Convert snake_case to camelCase for consistency
          return {
            id: data.id,
            name: data.name,
            description: data.description,
            createdById: data.created_by_id,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };
        },

        create: async (params: any) => {
          // Map camelCase to snake_case for Supabase
          const supabaseData = {
            name: params.data.name,
            description: params.data.description,
            created_by_id: params.data.createdById
          };

          const { data, error } = await supabase
            .from('categories')
            .insert([supabaseData])
            .select()
            .single();

          if (error) throw error;
          
          // Convert back to camelCase for consistency
          return {
            id: data.id,
            name: data.name,
            description: data.description,
            createdById: data.created_by_id,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };
        },

        update: async (params: any) => {
          // Map camelCase to snake_case for Supabase
          const supabaseData: any = {};
          if (params.data.name !== undefined) supabaseData.name = params.data.name;
          if (params.data.description !== undefined) supabaseData.description = params.data.description;
          if (params.data.createdById !== undefined) supabaseData.created_by_id = params.data.createdById;
          
          // Add updated_at timestamp
          supabaseData.updated_at = new Date().toISOString();

          let query = supabase.from('categories').update(supabaseData).select();

          if (params.where.id) {
            query = query.eq('id', params.where.id);
          }

          const { data, error } = await query.single();
          if (error) throw error;
          
          // Convert back to camelCase for consistency
          return {
            id: data.id,
            name: data.name,
            description: data.description,
            createdById: data.created_by_id,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };
        },

        delete: async (params: any) => {
          let query = supabase.from('categories').delete().select();

          if (params.where.id) {
            query = query.eq('id', params.where.id);
          }

          const { data, error } = await query.single();
          if (error) throw error;
          
          // Convert back to camelCase for consistency
          return {
            id: data.id,
            name: data.name,
            description: data.description,
            createdById: data.created_by_id,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };
        }
      },

      inventoryItem: {
        findMany: async (params: any = {}) => {
          let query = supabase.from('inventory_items').select(`
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
            price: item.price ? Number(item.price) : null,
            cost: item.cost ? Number(item.cost) : null,
            margin: item.margin ? Number(item.margin) : null,
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
          let query = supabase.from('inventory_items').select(`
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
            price: data.price ? Number(data.price) : null,
            cost: data.cost ? Number(data.cost) : null,
            margin: data.margin ? Number(data.margin) : null,
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
          let query = supabase.from('inventory_items').select('id', { count: 'exact' });
          
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
          // Map camelCase to snake_case for Supabase
          const insertData = {
            name: params.data.name,
            description: params.data.description,
            sku: params.data.sku,
            price: params.data.price,
            cost: params.data.cost,
            margin: params.data.margin,
            quantity: params.data.currentStock || params.data.quantity || 0,
            min_stock_level: params.data.minLevel || params.data.minStockLevel,
            max_level: params.data.maxLevel,
            category_id: params.data.categoryId,
            location_id: params.data.locationId,
            created_by_id: params.data.createdById,
            barcode: params.data.barcode,
            image_url: params.data.imageUrl,
            is_active: params.data.isActive ?? true
          };

          const { data, error } = await supabase
            .from('inventory_items')
            .insert([insertData])
            .select()
            .single();

          if (error) throw error;
          
          // Convert back to camelCase for consistency
          return {
            id: data.id,
            name: data.name,
            description: data.description,
            sku: data.sku,
            quantity: data.quantity,
            currentStock: data.quantity,
            price: data.price ? Number(data.price) : null,
            cost: data.cost ? Number(data.cost) : null,
            margin: data.margin ? Number(data.margin) : null,
            minStockLevel: data.min_stock_level,
            maxLevel: data.max_level,
            categoryId: data.category_id,
            locationId: data.location_id,
            createdById: data.created_by_id,
            barcode: data.barcode,
            imageUrl: data.image_url,
            isActive: data.is_active,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };
        },

        update: async (params: any) => {
          // Map camelCase to snake_case for Supabase
          const supabaseData: any = {};
          if (params.data.name !== undefined) supabaseData.name = params.data.name;
          if (params.data.description !== undefined) supabaseData.description = params.data.description;
          if (params.data.sku !== undefined) supabaseData.sku = params.data.sku;
          if (params.data.price !== undefined) supabaseData.price = params.data.price;
          if (params.data.cost !== undefined) supabaseData.cost = params.data.cost;
          if (params.data.margin !== undefined) supabaseData.margin = params.data.margin;
          if (params.data.currentStock !== undefined) supabaseData.quantity = params.data.currentStock;
          if (params.data.quantity !== undefined) supabaseData.quantity = params.data.quantity;
          if (params.data.minStockLevel !== undefined) supabaseData.min_stock_level = params.data.minStockLevel;
          if (params.data.minLevel !== undefined) supabaseData.min_stock_level = params.data.minLevel;
          if (params.data.maxLevel !== undefined) supabaseData.max_level = params.data.maxLevel;
          if (params.data.categoryId !== undefined) supabaseData.category_id = params.data.categoryId;
          if (params.data.locationId !== undefined) supabaseData.location_id = params.data.locationId;
          if (params.data.createdById !== undefined) supabaseData.created_by_id = params.data.createdById;
          if (params.data.barcode !== undefined) supabaseData.barcode = params.data.barcode;
          if (params.data.imageUrl !== undefined) supabaseData.image_url = params.data.imageUrl;
          if (params.data.isActive !== undefined) supabaseData.is_active = params.data.isActive;
          
          // Add updated_at timestamp
          supabaseData.updated_at = new Date().toISOString();

          let query = supabase.from('inventory_items').update(supabaseData).select();

          if (params.where.id) {
            query = query.eq('id', params.where.id);
          }
          if (params.where.sku) {
            query = query.eq('sku', params.where.sku);
          }

          const { data, error } = await query.single();
          if (error) throw error;
          
          // Convert back to camelCase for consistency
          return {
            id: data.id,
            name: data.name,
            description: data.description,
            sku: data.sku,
            quantity: data.quantity,
            currentStock: data.quantity,
            price: data.price ? Number(data.price) : null,
            cost: data.cost ? Number(data.cost) : null,
            margin: data.margin ? Number(data.margin) : null,
            minStockLevel: data.min_stock_level,
            maxLevel: data.max_level,
            categoryId: data.category_id,
            locationId: data.location_id,
            createdById: data.created_by_id,
            barcode: data.barcode,
            imageUrl: data.image_url,
            isActive: data.is_active,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };
        },

        delete: async (params: any) => {
          let query = supabase.from('inventory_items').delete().select();

          if (params.where.id) {
            query = query.eq('id', params.where.id);
          }
          if (params.where.sku) {
            query = query.eq('sku', params.where.sku);
          }

          const { data, error } = await query.single();
          if (error) throw error;
          
          // Convert back to camelCase for consistency
          return {
            id: data.id,
            name: data.name,
            description: data.description,
            sku: data.sku,
            quantity: data.quantity,
            currentStock: data.quantity,
            price: data.price ? Number(data.price) : null,
            cost: data.cost ? Number(data.cost) : null,
            margin: data.margin ? Number(data.margin) : null,
            minStockLevel: data.min_stock_level,
            maxLevel: data.max_level,
            categoryId: data.category_id,
            locationId: data.location_id,
            createdById: data.created_by_id,
            barcode: data.barcode,
            imageUrl: data.image_url,
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

          const { data, error } = await query;
          if (error) throw error;
          
          // If _count is requested, we need to get counts for each location
          if (params.include && params.include._count) {
            const locationsWithCount = await Promise.all(
              data.map(async (location: any) => {
                const { count } = await supabase
                  .from('inventory_items')
                  .select('id', { count: 'exact' })
                  .eq('location_id', location.id);
                
                return {
                  id: location.id,
                  name: location.name,
                  description: location.description,
                  isActive: location.is_active,
                  createdAt: new Date(location.created_at),
                  updatedAt: new Date(location.updated_at),
                  _count: { inventoryItems: count || 0 }
                };
              })
            );
            return locationsWithCount;
          }
          
          // Convert snake_case to camelCase to match Prisma format
          return data.map((location: any) => ({
            id: location.id,
            name: location.name,
            description: location.description,
            isActive: location.is_active,
            createdAt: new Date(location.created_at),
            updatedAt: new Date(location.updated_at)
          }));
        },
        
        findFirst: async (params: any) => {
          let query = supabase.from('locations').select('*');

          if (params.where) {
            if (params.where.id) {
              query = query.eq('id', params.where.id);
            }
            if (params.where.name) {
              query = query.eq('name', params.where.name);
            }
            if (params.where.isActive !== undefined) {
              query = query.eq('is_active', params.where.isActive);
            }
          }

          const { data, error } = await query.limit(1);
          if (error || !data || data.length === 0) return null;
          
          const location = data[0];
          return {
            id: location.id,
            name: location.name,
            description: location.description,
            isActive: location.is_active,
            createdAt: new Date(location.created_at),
            updatedAt: new Date(location.updated_at)
          };
        },

        findUnique: async (params: any) => {
          let query = supabase.from('locations').select('*');

          if (params.where.id) {
            query = query.eq('id', params.where.id);
          }

          const { data, error } = await query.single();
          if (error) return null;
          
          return {
            id: data.id,
            name: data.name,
            description: data.description,
            isActive: data.is_active,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };
        },

        create: async (params: any) => {
          // Map camelCase to snake_case for Supabase
          const supabaseData = {
            name: params.data.name,
            description: params.data.description,
            is_active: params.data.isActive ?? true
          };

          const { data, error } = await supabase
            .from('locations')
            .insert([supabaseData])
            .select()
            .single();

          if (error) throw error;
          
          // Convert back to camelCase for consistency
          return {
            id: data.id,
            name: data.name,
            description: data.description,
            isActive: data.is_active,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };
        },

        update: async (params: any) => {
          // Map camelCase to snake_case for Supabase
          const supabaseData: any = {};
          if (params.data.name !== undefined) supabaseData.name = params.data.name;
          if (params.data.description !== undefined) supabaseData.description = params.data.description;
          if (params.data.isActive !== undefined) supabaseData.is_active = params.data.isActive;
          
          // Add updated_at timestamp
          supabaseData.updated_at = new Date().toISOString();

          let query = supabase.from('locations').update(supabaseData).select();

          if (params.where.id) {
            query = query.eq('id', params.where.id);
          }

          const { data, error } = await query.single();
          if (error) throw error;
          
          // Convert back to camelCase for consistency
          return {
            id: data.id,
            name: data.name,
            description: data.description,
            isActive: data.is_active,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };
        },

        delete: async (params: any) => {
          let query = supabase.from('locations').delete().select();

          if (params.where.id) {
            query = query.eq('id', params.where.id);
          }

          const { data, error } = await query.single();
          if (error) throw error;
          
          // Convert back to camelCase for consistency
          return {
            id: data.id,
            name: data.name,
            description: data.description,
            isActive: data.is_active,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };
        }
      },

      permission: {
        findMany: async (params: any = {}) => {
          let query = supabase.from('permissions').select('*');
          
          if (params.where) {
            if (params.where.resource) {
              query = query.eq('resource', params.where.resource);
            }
            if (params.where.action) {
              query = query.eq('action', params.where.action);
            }
            if (params.where.category) {
              query = query.eq('category', params.where.category);
            }
          }

          if (params.orderBy) {
            if (params.orderBy.name) {
              query = query.order('name', { 
                ascending: params.orderBy.name === 'asc' 
              });
            }
          }

          const { data, error } = await query;
          if (error) throw error;
          
          return data.map((permission: any) => ({
            id: permission.id,
            name: permission.name,
            description: permission.description,
            resource: permission.resource,
            action: permission.action,
            category: permission.category,
            isSystem: permission.is_system,
            createdAt: new Date(permission.created_at),
            updatedAt: new Date(permission.updated_at)
          }));
        },

        findUnique: async (params: any) => {
          let query = supabase.from('permissions').select('*');

          if (params.where.id) {
            query = query.eq('id', params.where.id);
          }
          if (params.where.name) {
            query = query.eq('name', params.where.name);
          }

          const { data, error } = await query.single();
          if (error) return null;
          
          return {
            id: data.id,
            name: data.name,
            description: data.description,
            resource: data.resource,
            action: data.action,
            category: data.category,
            isSystem: data.is_system,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };
        },

        create: async (params: any) => {
          const supabaseData = {
            name: params.data.name,
            description: params.data.description,
            resource: params.data.resource,
            action: params.data.action,
            category: params.data.category,
            is_system: params.data.isSystem ?? false
          };

          const { data, error } = await supabase
            .from('permissions')
            .insert([supabaseData])
            .select()
            .single();

          if (error) throw error;
          
          return {
            id: data.id,
            name: data.name,
            description: data.description,
            resource: data.resource,
            action: data.action,
            category: data.category,
            isSystem: data.is_system,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };
        },

        update: async (params: any) => {
          const supabaseData: any = {};
          if (params.data.name !== undefined) supabaseData.name = params.data.name;
          if (params.data.description !== undefined) supabaseData.description = params.data.description;
          if (params.data.resource !== undefined) supabaseData.resource = params.data.resource;
          if (params.data.action !== undefined) supabaseData.action = params.data.action;
          if (params.data.category !== undefined) supabaseData.category = params.data.category;
          if (params.data.isSystem !== undefined) supabaseData.is_system = params.data.isSystem;
          
          supabaseData.updated_at = new Date().toISOString();

          let query = supabase.from('permissions').update(supabaseData).select();

          if (params.where.id) {
            query = query.eq('id', params.where.id);
          }

          const { data, error } = await query.single();
          if (error) throw error;
          
          return {
            id: data.id,
            name: data.name,
            description: data.description,
            resource: data.resource,
            action: data.action,
            category: data.category,
            isSystem: data.is_system,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };
        },

        delete: async (params: any) => {
          // Check if permission is system permission (cannot be deleted)
          const permission = await supabase
            .from('permissions')
            .select('is_system')
            .eq('id', params.where.id)
            .single();

          if (permission.data?.is_system) {
            throw new Error('Cannot delete system permissions');
          }

          const { data, error } = await supabase
            .from('permissions')
            .delete()
            .eq('id', params.where.id)
            .select()
            .single();

          if (error) throw error;
          
          return {
            id: data.id,
            name: data.name,
            description: data.description,
            resource: data.resource,
            action: data.action,
            category: data.category,
            isSystem: data.is_system,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };
        }
      },

      rolePermission: {
        findMany: async (params: any = {}) => {
          let query = supabase.from('role_permissions').select(`
            *,
            role:roles(*),
            permission:permissions(*)
          `);
          
          if (params.where) {
            if (params.where.roleId) {
              query = query.eq('role_id', params.where.roleId);
            }
            if (params.where.permissionId) {
              query = query.eq('permission_id', params.where.permissionId);
            }
          }

          const { data, error } = await query;
          if (error) throw error;
          
          return data.map((rp: any) => ({
            id: rp.id,
            roleId: rp.role_id,
            permissionId: rp.permission_id,
            createdAt: new Date(rp.created_at),
            role: rp.role ? {
              id: rp.role.id,
              name: rp.role.name,
              description: rp.role.description,
              isSystem: rp.role.is_system,
              isActive: rp.role.is_active,
              createdAt: new Date(rp.role.created_at),
              updatedAt: new Date(rp.role.updated_at)
            } : null,
            permission: rp.permission ? {
              id: rp.permission.id,
              name: rp.permission.name,
              description: rp.permission.description,
              resource: rp.permission.resource,
              action: rp.permission.action,
              category: rp.permission.category,
              isSystem: rp.permission.is_system,
              createdAt: new Date(rp.permission.created_at),
              updatedAt: new Date(rp.permission.updated_at)
            } : null
          }));
        },

        create: async (params: any) => {
          const supabaseData = {
            role_id: params.data.roleId,
            permission_id: params.data.permissionId
          };

          const { data, error } = await supabase
            .from('role_permissions')
            .insert([supabaseData])
            .select()
            .single();

          if (error) throw error;
          
          return {
            id: data.id,
            roleId: data.role_id,
            permissionId: data.permission_id,
            createdAt: new Date(data.created_at)
          };
        },

        delete: async (params: any) => {
          let query = supabase.from('role_permissions').delete().select();

          if (params.where.id) {
            query = query.eq('id', params.where.id);
          }
          if (params.where.roleId && params.where.permissionId) {
            query = query.eq('role_id', params.where.roleId).eq('permission_id', params.where.permissionId);
          }

          const { data, error } = await query.single();
          if (error) throw error;
          
          return {
            id: data.id,
            roleId: data.role_id,
            permissionId: data.permission_id,
            createdAt: new Date(data.created_at)
          };
        }
      },

      stockMovement: {
        findMany: async (params: any = {}) => {
          let query = supabase.from('stock_movements').select(`
            *,
            inventory_item:inventory_items(*),
            location:locations(*),
            created_by:users(*)
          `);
          
          if (params.where) {
            if (params.where.inventoryItemId) {
              query = query.eq('inventory_item_id', params.where.inventoryItemId);
            }
            if (params.where.type) {
              query = query.eq('type', params.where.type);
            }
            if (params.where.createdById) {
              query = query.eq('created_by_id', params.where.createdById);
            }
          }

          if (params.orderBy) {
            if (params.orderBy.createdAt) {
              query = query.order('created_at', { 
                ascending: params.orderBy.createdAt === 'asc' 
              });
            }
          }

          if (params.take) {
            query = query.limit(params.take);
          }

          const { data, error } = await query;
          if (error) throw error;
          
          return data.map((movement: any) => ({
            id: movement.id,
            type: movement.type,
            quantity: movement.quantity,
            previousStock: movement.previous_stock,
            newStock: movement.new_stock,
            cost: movement.cost ? Number(movement.cost) : null,
            price: movement.price ? Number(movement.price) : null,
            reason: movement.reason,
            notes: movement.notes,
            inventoryItemId: movement.inventory_item_id,
            locationId: movement.location_id,
            createdById: movement.created_by_id,
            createdAt: new Date(movement.created_at),
            inventoryItem: movement.inventory_item,
            location: movement.location,
            createdBy: movement.created_by
          }));
        },

        create: async (params: any) => {
          const supabaseData = {
            type: params.data.type,
            quantity: params.data.quantity,
            previous_stock: params.data.previousStock,
            new_stock: params.data.newStock,
            cost: params.data.cost,
            price: params.data.price,
            reason: params.data.reason,
            notes: params.data.notes,
            inventory_item_id: params.data.inventoryItemId,
            location_id: params.data.locationId,
            created_by_id: params.data.createdById
          };

          const { data, error } = await supabase
            .from('stock_movements')
            .insert([supabaseData])
            .select()
            .single();

          if (error) throw error;
          
          return {
            id: data.id,
            type: data.type,
            quantity: data.quantity,
            previousStock: data.previous_stock,
            newStock: data.new_stock,
            cost: data.cost ? Number(data.cost) : null,
            price: data.price ? Number(data.price) : null,
            reason: data.reason,
            notes: data.notes,
            inventoryItemId: data.inventory_item_id,
            locationId: data.location_id,
            createdById: data.created_by_id,
            createdAt: new Date(data.created_at)
          };
        }
      },

      sale: {
        findMany: async (params: any = {}) => {
          let query = supabase.from('sales').select(`
            *,
            created_by:users(*),
            items:sale_items(*)
          `);
          
          if (params.where) {
            if (params.where.status) {
              query = query.eq('status', params.where.status);
            }
            if (params.where.createdById) {
              query = query.eq('created_by_id', params.where.createdById);
            }
          }

          if (params.orderBy) {
            if (params.orderBy.createdAt) {
              query = query.order('created_at', { 
                ascending: params.orderBy.createdAt === 'asc' 
              });
            }
          }

          if (params.take) {
            query = query.limit(params.take);
          }

          const { data, error } = await query;
          if (error) throw error;
          
          return data.map((sale: any) => ({
            id: sale.id,
            total: Number(sale.total),
            tax: Number(sale.tax || 0),
            discount: Number(sale.discount || 0),
            status: sale.status,
            notes: sale.notes,
            createdById: sale.created_by_id,
            createdAt: new Date(sale.created_at),
            updatedAt: new Date(sale.updated_at),
            createdBy: sale.created_by,
            items: sale.items
          }));
        },

        create: async (params: any) => {
          const supabaseData = {
            total: params.data.total,
            tax: params.data.tax || 0,
            discount: params.data.discount || 0,
            status: params.data.status || 'COMPLETED',
            notes: params.data.notes,
            created_by_id: params.data.createdById
          };

          const { data, error } = await supabase
            .from('sales')
            .insert([supabaseData])
            .select()
            .single();

          if (error) throw error;
          
          return {
            id: data.id,
            total: Number(data.total),
            tax: Number(data.tax || 0),
            discount: Number(data.discount || 0),
            status: data.status,
            notes: data.notes,
            createdById: data.created_by_id,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };
        }
      },

      saleItem: {
        findMany: async (params: any = {}) => {
          let query = supabase.from('sale_items').select(`
            *,
            sale:sales(*),
            inventory_item:inventory_items(*)
          `);
          
          if (params.where) {
            if (params.where.saleId) {
              query = query.eq('sale_id', params.where.saleId);
            }
            if (params.where.inventoryItemId) {
              query = query.eq('inventory_item_id', params.where.inventoryItemId);
            }
          }

          const { data, error } = await query;
          if (error) throw error;
          
          return data.map((item: any) => ({
            id: item.id,
            quantity: item.quantity,
            price: Number(item.price),
            total: Number(item.total),
            saleId: item.sale_id,
            inventoryItemId: item.inventory_item_id,
            sale: item.sale,
            inventoryItem: item.inventory_item
          }));
        },

        create: async (params: any) => {
          const supabaseData = {
            quantity: params.data.quantity,
            price: params.data.price,
            total: params.data.total,
            sale_id: params.data.saleId,
            inventory_item_id: params.data.inventoryItemId
          };

          const { data, error } = await supabase
            .from('sale_items')
            .insert([supabaseData])
            .select()
            .single();

          if (error) throw error;
          
          return {
            id: data.id,
            quantity: data.quantity,
            price: Number(data.price),
            total: Number(data.total),
            saleId: data.sale_id,
            inventoryItemId: data.inventory_item_id
          };
        }
      },

      importSession: {
        findMany: async (params: any = {}) => {
          let query = supabase.from('import_sessions').select(`
            *,
            created_by:users(*),
            details:import_session_details(*)
          `);
          
          if (params.where) {
            if (params.where.status) {
              query = query.eq('status', params.where.status);
            }
            if (params.where.createdById) {
              query = query.eq('created_by_id', params.where.createdById);
            }
          }

          if (params.orderBy) {
            if (params.orderBy.createdAt) {
              query = query.order('created_at', { 
                ascending: params.orderBy.createdAt === 'asc' 
              });
            }
          }

          if (params.take) {
            query = query.limit(params.take);
          }

          const { data, error } = await query;
          if (error) throw error;
          
          return data.map((session: any) => ({
            id: session.id,
            filePath: session.file_path,
            status: session.status,
            notes: session.notes,
            totalItems: session.total_items,
            successItems: session.success_items,
            warningItems: session.warning_items,
            errorItems: session.error_items,
            createdById: session.created_by_id,
            createdAt: new Date(session.created_at),
            completedAt: session.completed_at ? new Date(session.completed_at) : null,
            createdBy: session.created_by,
            details: session.details
          }));
        },

        findUnique: async (params: any) => {
          let query = supabase.from('import_sessions').select(`
            *,
            created_by:users(*),
            details:import_session_details(*)
          `);

          if (params.where.id) {
            query = query.eq('id', params.where.id);
          }

          const { data, error } = await query.single();
          if (error) return null;
          
          return {
            id: data.id,
            filePath: data.file_path,
            status: data.status,
            notes: data.notes,
            totalItems: data.total_items,
            successItems: data.success_items,
            warningItems: data.warning_items,
            errorItems: data.error_items,
            createdById: data.created_by_id,
            createdAt: new Date(data.created_at),
            completedAt: data.completed_at ? new Date(data.completed_at) : null,
            createdBy: data.created_by,
            details: data.details
          };
        },

        create: async (params: any) => {
          const supabaseData = {
            file_path: params.data.filePath,
            status: params.data.status || 'processing',
            notes: params.data.notes,
            total_items: params.data.totalItems || 0,
            success_items: params.data.successItems || 0,
            warning_items: params.data.warningItems || 0,
            error_items: params.data.errorItems || 0,
            created_by_id: params.data.createdById
          };

          const { data, error } = await supabase
            .from('import_sessions')
            .insert([supabaseData])
            .select()
            .single();

          if (error) throw error;
          
          return {
            id: data.id,
            filePath: data.file_path,
            status: data.status,
            notes: data.notes,
            totalItems: data.total_items,
            successItems: data.success_items,
            warningItems: data.warning_items,
            errorItems: data.error_items,
            createdById: data.created_by_id,
            createdAt: new Date(data.created_at),
            completedAt: data.completed_at ? new Date(data.completed_at) : null
          };
        },

        update: async (params: any) => {
          const supabaseData: any = {};
          if (params.data.status !== undefined) supabaseData.status = params.data.status;
          if (params.data.notes !== undefined) supabaseData.notes = params.data.notes;
          if (params.data.totalItems !== undefined) supabaseData.total_items = params.data.totalItems;
          if (params.data.successItems !== undefined) supabaseData.success_items = params.data.successItems;
          if (params.data.warningItems !== undefined) supabaseData.warning_items = params.data.warningItems;
          if (params.data.errorItems !== undefined) supabaseData.error_items = params.data.errorItems;
          if (params.data.completedAt !== undefined) supabaseData.completed_at = params.data.completedAt;
          
          supabaseData.updated_at = new Date().toISOString();

          let query = supabase.from('import_sessions').update(supabaseData).select();

          if (params.where.id) {
            query = query.eq('id', params.where.id);
          }

          const { data, error } = await query.single();
          if (error) throw error;
          
          return {
            id: data.id,
            filePath: data.file_path,
            status: data.status,
            notes: data.notes,
            totalItems: data.total_items,
            successItems: data.success_items,
            warningItems: data.warning_items,
            errorItems: data.error_items,
            createdById: data.created_by_id,
            createdAt: new Date(data.created_at),
            completedAt: data.completed_at ? new Date(data.completed_at) : null
          };
        }
      },

      importSessionDetail: {
        findMany: async (params: any = {}) => {
          let query = supabase.from('import_session_details').select(`
            *,
            import_session:import_sessions(*)
          `);
          
          if (params.where) {
            if (params.where.importSessionId) {
              query = query.eq('import_session_id', params.where.importSessionId);
            }
            if (params.where.status) {
              query = query.eq('status', params.where.status);
            }
          }

          if (params.orderBy) {
            if (params.orderBy.rowIndex) {
              query = query.order('row_index', { 
                ascending: params.orderBy.rowIndex === 'asc' 
              });
            }
          }

          const { data, error } = await query;
          if (error) throw error;
          
          return data.map((detail: any) => ({
            id: detail.id,
            rowIndex: detail.row_index,
            status: detail.status,
            message: detail.message,
            data: detail.data,
            importSessionId: detail.import_session_id,
            createdAt: new Date(detail.created_at),
            importSession: detail.import_session
          }));
        },

        create: async (params: any) => {
          const supabaseData = {
            row_index: params.data.rowIndex,
            status: params.data.status,
            message: params.data.message,
            data: params.data.data,
            import_session_id: params.data.importSessionId
          };

          const { data, error } = await supabase
            .from('import_session_details')
            .insert([supabaseData])
            .select()
            .single();

          if (error) throw error;
          
          return {
            id: data.id,
            rowIndex: data.row_index,
            status: data.status,
            message: data.message,
            data: data.data,
            importSessionId: data.import_session_id,
            createdAt: new Date(data.created_at)
          };
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