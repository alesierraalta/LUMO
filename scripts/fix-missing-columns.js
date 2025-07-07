const { createClient } = require('@supabase/supabase-js');

async function fixMissingColumns() {
  console.log('🔧 Fixing Missing Columns in Database\n');

  const supabase = createClient(
    'https://ubjujxtvlubxowsphvuk.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4'
  );

  try {
    // First, get a valid user ID for the default value
    console.log('1. Getting admin user ID for default value...');
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'alesierraalta@gmail.com')
      .single();

    if (adminError || !adminUser) {
      console.log('❌ Could not find admin user:', adminError?.message);
      return;
    }

    console.log('✅ Admin user ID:', adminUser.id);
    const defaultUserId = adminUser.id;

    // Step 2: Add created_by_id column to locations table
    console.log('\\n2. Adding created_by_id column to locations table...');
    
    try {
      // First check if column already exists
      const { data: locationsData, error: locationsCheckError } = await supabase
        .from('locations')
        .select('created_by_id')
        .limit(1);

      if (locationsCheckError && locationsCheckError.message.includes('created_by_id')) {
        console.log('   Adding created_by_id column to locations...');
        
        // Add the column using SQL (this requires service role key or proper permissions)
        const { error: alterError } = await supabase.rpc('exec_sql', {
          sql: `
            ALTER TABLE locations 
            ADD COLUMN created_by_id UUID REFERENCES users(id);
            
            UPDATE locations 
            SET created_by_id = '${defaultUserId}' 
            WHERE created_by_id IS NULL;
          `
        });

        if (alterError) {
          console.log('   ❌ Error adding column to locations:', alterError.message);
          console.log('   ℹ️  Note: This requires database admin permissions');
        } else {
          console.log('   ✅ Successfully added created_by_id to locations');
        }
      } else {
        console.log('   ✅ created_by_id column already exists in locations');
      }
    } catch (error) {
      console.log('   ❌ Error with locations column:', error.message);
    }

    // Step 3: Add created_by_id column to users table
    console.log('\\n3. Adding created_by_id column to users table...');
    
    try {
      // First check if column already exists
      const { data: usersData, error: usersCheckError } = await supabase
        .from('users')
        .select('created_by_id')
        .limit(1);

      if (usersCheckError && usersCheckError.message.includes('created_by_id')) {
        console.log('   Adding created_by_id column to users...');
        
        const { error: alterError } = await supabase.rpc('exec_sql', {
          sql: `
            ALTER TABLE users 
            ADD COLUMN created_by_id UUID REFERENCES users(id);
            
            UPDATE users 
            SET created_by_id = '${defaultUserId}' 
            WHERE created_by_id IS NULL;
          `
        });

        if (alterError) {
          console.log('   ❌ Error adding column to users:', alterError.message);
          console.log('   ℹ️  Note: This requires database admin permissions');
        } else {
          console.log('   ✅ Successfully added created_by_id to users');
        }
      } else {
        console.log('   ✅ created_by_id column already exists in users');
      }
    } catch (error) {
      console.log('   ❌ Error with users column:', error.message);
    }

    // Step 4: Alternative approach - Update the API to not require created_by_id
    console.log('\\n4. Alternative Solution - Update API endpoints...');
    console.log('   Since we may not have database admin permissions,');
    console.log('   we can modify the API endpoints to not require created_by_id');
    console.log('   for locations and users tables.');

    // Step 5: Verify current table structures
    console.log('\\n5. Verifying current table structures...');
    
    const tables = ['locations', 'users'];
    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`   ❌ ${tableName}: ${error.message}`);
        } else {
          const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
          const hasCreatedBy = columns.includes('created_by_id');
          console.log(`   ${hasCreatedBy ? '✅' : '❌'} ${tableName}: created_by_id ${hasCreatedBy ? 'present' : 'missing'}`);
          console.log(`     Columns: ${columns.join(', ')}`);
        }
      } catch (error) {
        console.log(`   ❌ ${tableName}: ${error.message}`);
      }
    }

  } catch (error) {
    console.log('❌ Fix failed:', error.message);
  }
}

fixMissingColumns(); 