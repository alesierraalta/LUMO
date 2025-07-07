require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Ensuring admin user exists...');

// Supabase configuration (development)
const supabaseUrl = 'https://ndprriqyhddjoixrlqnz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcHJyaXF5aGRkam9peHJscW56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDEwODQwMCwiZXhwIjoyMDY1Njg0NDAwfQ.Nqs_Lm2qdqcbgNV0r9BsxmkJPCEgPiZeKUOz0eJWXKI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Admin user configuration
const ADMIN_USER_ID = '1026df90-b8ef-4307-a9c7-67133057faa2';
const ADMIN_EMAIL = 'alesierraalta@gmail.com';

async function ensureAdminUser() {
  try {
    console.log('🔍 Checking if admin user exists...');
    
    // Check if admin user exists in auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(ADMIN_USER_ID);
    
    if (authError) {
      console.log('⚠️ Admin user not found in auth, creating...');
      
      // Create user in auth
      const { data: newAuthUser, error: createAuthError } = await supabase.auth.admin.createUser({
        id: ADMIN_USER_ID,
        email: ADMIN_EMAIL,
        password: 'TempPassword123!',
        email_confirm: true,
        user_metadata: {
          name: 'Admin User'
        }
      });
      
      if (createAuthError) {
        console.error('❌ Error creating auth user:', createAuthError);
        return false;
      }
      
      console.log('✅ Auth user created successfully');
    } else {
      console.log('✅ Admin user exists in auth');
    }
    
    // Get ADMIN role ID
    console.log('🔍 Getting ADMIN role...');
    const { data: roles, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'ADMIN')
      .single();
      
    if (roleError) {
      console.error('❌ Error getting ADMIN role:', roleError);
      return false;
    }
    
    console.log('✅ ADMIN role found:', roles.id);
    
    // Check if user exists in public.users table
    console.log('🔍 Checking public.users table...');
    const { data: publicUser, error: publicUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', ADMIN_USER_ID)
      .single();
      
    if (publicUserError && publicUserError.code === 'PGRST116') {
      console.log('⚠️ Admin user not found in public.users, creating...');
      
      // Create user in public.users table
      const { data: newPublicUser, error: createPublicError } = await supabase
        .from('users')
        .insert({
          id: ADMIN_USER_ID,
          email: ADMIN_EMAIL,
          name: 'Admin User',
          role_id: roles.id,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (createPublicError) {
        console.error('❌ Error creating public user:', createPublicError);
        return false;
      }
      
      console.log('✅ Public user created successfully');
    } else if (publicUserError) {
      console.error('❌ Error checking public user:', publicUserError);
      return false;
    } else {
      console.log('✅ Admin user exists in public.users');
    }
    
    console.log('🎉 Admin user ensured successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to ensure admin user:', error);
    return false;
  }
}

// Execute the function
ensureAdminUser()
  .then((success) => {
    if (success) {
      console.log('✅ Admin user setup completed successfully');
      process.exit(0);
    } else {
      console.log('❌ Admin user setup failed');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  }); 