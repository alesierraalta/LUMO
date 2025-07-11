import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkAndSeedRoles() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables!');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
    console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
    process.exit(1);
  }
  console.log('🔍 Checking and seeding roles...');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Check if roles exist
  const { data: existingRoles, error: checkError } = await supabase
    .from('roles')
    .select('*');
    
  if (checkError) {
    console.error('❌ Error checking roles:', checkError);
    return;
  }
  
  console.log('📊 Existing roles:', existingRoles);
  
  // Define default roles
  const defaultRoles = [
    { name: 'ADMIN', description: 'Administrator with full access', is_system: true, is_active: true },
    { name: 'MANAGER', description: 'Manager with inventory management access', is_system: true, is_active: true },
    { name: 'USER', description: 'Regular user with basic access', is_system: true, is_active: true }
  ];
  
  // Insert missing roles
  for (const role of defaultRoles) {
    const exists = existingRoles?.find(r => r.name === role.name);
    if (!exists) {
      console.log(`➕ Creating role: ${role.name}`);
      const { error: insertError } = await supabase
        .from('roles')
        .insert(role);
        
      if (insertError) {
        console.error(`❌ Error creating role ${role.name}:`, insertError);
      } else {
        console.log(`✅ Role ${role.name} created successfully`);
      }
    } else {
      console.log(`✓ Role ${role.name} already exists`);
    }
  }
  
  // Show final roles
  const { data: finalRoles } = await supabase
    .from('roles')
    .select('*')
    .order('name');
    
  console.log('📋 Final roles in database:', finalRoles);
}

// Run the script
checkAndSeedRoles().catch(console.error);