/**
 * Hybrid Database Client
 * - Local Development: SQLite + Prisma
 * - Production (Choreo): Supabase
 */

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isChoreo = process.env.CHOREO_DEPLOYMENT === 'true' || process.env.SUPABASE_URL;

console.log('🔍 Database Environment:', {
  isProduction,
  isChoreo,
  hasSupabaseUrl: !!process.env.SUPABASE_URL,
  NODE_ENV: process.env.NODE_ENV
});

// Conditional imports and setup
let db: any;
let supabase: any = null;

if (isChoreo && process.env.SUPABASE_URL) {
  // Production: Use Supabase
  console.log('🔄 Loading Supabase client for production...');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }
    
    supabase = createClient(supabaseUrl, supabaseKey);
    
    // Supabase adapter - matching the actual schema
    db = {
      user: {
        findUnique: async (params: any) => {
          let query = supabase.from('users').select('*');

          if (params.where.email) {
            query = query.eq('email', params.where.email);
          }
          if (params.where.id) {
            query = query.eq('id', params.where.id);
          }

          const { data, error } = await query.single();
          if (error) {
            console.log('User not found:', error.message);
            return null;
          }
          
          // Convert Supabase response to Prisma-like format
          return {
            id: data.id,
            email: data.email,
            name: data.name,
            password: data.password,
            role: 'USER', // Default role for now, can be enhanced
            isActive: data.is_active,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };
        },
        
        findMany: async (params: any = {}) => {
          let query = supabase.from('users').select('*');
          
          if (params.orderBy) {
            const orderField = params.orderBy.createdAt ? 'created_at' : 'id';
            const orderDirection = params.orderBy.createdAt === 'desc' ? false : true;
            query = query.order(orderField, { ascending: orderDirection });
          }

          const { data, error } = await query;
          if (error) throw error;
          
          // Convert to Prisma format
          return data.map((user: any) => ({
            id: user.id,
            email: user.email,
            name: user.name,
            role: 'USER', // Default for now
            isActive: user.is_active,
            createdAt: new Date(user.created_at),
            updatedAt: new Date(user.updated_at)
          }));
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
      
      $connect: async () => {},
      $disconnect: async () => {}
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