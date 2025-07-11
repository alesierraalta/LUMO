#!/usr/bin/env node

/**
 * Script to ensure basic roles exist in the database
 * This script creates the required USER, MANAGER, and ADMIN roles
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('  - SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey);

const basicRoles = [
  {
    name: 'USER',
    description: 'Basic user with standard access',
    is_system: true,
    is_active: true
  },
  {
    name: 'MANAGER',
    description: 'Manager with elevated permissions',
    is_system: true,
    is_active: true
  },
  {
    name: 'ADMIN',
    description: 'Administrator with full access',
    is_system: true,
    is_active: true
  }
];

async function ensureBasicRoles() {
  console.log('🔄 Ensuring basic roles exist...');
  
  try {
    // First, check if the roles table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'roles');

    if (tablesError) {
      console.error('❌ Error checking if roles table exists:', tablesError);
      return;
    }

    if (!tables || tables.length === 0) {
      console.log('⚠️ Roles table does not exist. Creating it...');
      
      // Create roles table
      const { error: createTableError } = await supabase.rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.roles (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(50) UNIQUE NOT NULL,
            description TEXT,
            is_system BOOLEAN DEFAULT false,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          
          -- Create index on name for performance
          CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles (name);
          
          -- Create index on is_active for performance
          CREATE INDEX IF NOT EXISTS idx_roles_is_active ON public.roles (is_active);
          
          -- Enable RLS
          ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
          
          -- Create policy for authenticated users to read roles
          CREATE POLICY "Users can read active roles" ON public.roles
            FOR SELECT USING (is_active = true);
          
          -- Create policy for admins to manage roles
          CREATE POLICY "Admins can manage roles" ON public.roles
            FOR ALL USING (
              EXISTS (
                SELECT 1 FROM public.users 
                WHERE users.id = auth.uid() 
                AND users.role_id IN (
                  SELECT id FROM public.roles WHERE name = 'ADMIN'
                )
              )
            );
        `
      });

      if (createTableError) {
        console.error('❌ Error creating roles table:', createTableError);
        return;
      }

      console.log('✅ Roles table created successfully');
    }

    // Check existing roles
    const { data: existingRoles, error: fetchError } = await supabase
      .from('roles')
      .select('name, id')
      .in('name', basicRoles.map(r => r.name));

    if (fetchError) {
      console.error('❌ Error fetching existing roles:', fetchError);
      return;
    }

    const existingRoleNames = existingRoles?.map(r => r.name) || [];
    console.log('📋 Existing roles:', existingRoleNames);

    const results = [];

    // Create missing roles
    for (const role of basicRoles) {
      if (!existingRoleNames.includes(role.name)) {
        console.log(`🔄 Creating role: ${role.name}`);
        
        const { data, error } = await supabase
          .from('roles')
          .insert(role)
          .select()
          .single();

        if (error) {
          console.error(`❌ Error creating role ${role.name}:`, error);
          results.push({ role: role.name, success: false, error: error.message });
        } else {
          console.log(`✅ Created role: ${role.name}`);
          results.push({ role: role.name, success: true, data });
        }
      } else {
        console.log(`✅ Role ${role.name} already exists`);
        
        // Update existing role to ensure it's active
        const { error: updateError } = await supabase
          .from('roles')
          .update({ is_active: true })
          .eq('name', role.name);

        if (updateError) {
          console.error(`⚠️ Error updating role ${role.name}:`, updateError);
        }
        
        results.push({ role: role.name, success: true, action: 'exists' });
      }
    }

    // Final verification
    const { data: finalRoles, error: finalError } = await supabase
      .from('roles')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (finalError) {
      console.error('❌ Error verifying roles:', finalError);
      return;
    }

    console.log('\n📊 Final roles in database:');
    console.table(finalRoles);

    console.log('\n✅ Basic roles setup complete!');
    console.log('\nResults:');
    console.table(results);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
ensureBasicRoles().then(() => {
  console.log('\n🎉 Script completed');
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});