'use client';

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
    
    // Supabase adapter
    db = {
      user: {
        findUnique: async (params: any) => {
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
          if (error) return null;
          return data;
        },
        
        findMany: async () => {
          const { data, error } = await supabase
            .from('users')
            .select(`*, role:roles(*)`)
            .order('created_at', { ascending: false });

          if (error) throw error;
          return data;
        },
        
        create: async (params: any) => {
          const { data, error } = await supabase
            .from('users')
            .insert([params.data])
            .select()
            .single();

          if (error) throw error;
          return data;
        },
        
        update: async (params: any) => {
          const { data, error } = await supabase
            .from('users')
            .update(params.data)
            .eq('id', params.where.id)
            .select()
            .single();

          if (error) throw error;
          return data;
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