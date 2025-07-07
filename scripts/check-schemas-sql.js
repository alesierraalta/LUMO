const { createClient } = require('@supabase/supabase-js');

async function checkSchemas() {
  console.log('🔍 Checking Database Schemas with SQL\n');

  const supabase = createClient(
    'https://ubjujxtvlubxowsphvuk.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4'
  );

  try {
    // Check all tables in the public schema
    console.log('1. Checking all tables in public schema...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('sql', {
        query: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name;
        `
      });

    if (tablesError) {
      console.log('❌ Error getting tables:', tablesError.message);
      
      // Try alternative approach - just try to query each table
      console.log('\\n2. Trying direct table queries...');
      
      const tablesToCheck = ['users', 'roles', 'categories', 'locations', 'inventory_items'];
      
      for (const tableName of tablesToCheck) {
        console.log(`\\n   Checking ${tableName} table...`);
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

          if (error) {
            console.log(`   ❌ ${tableName}: ${error.message}`);
          } else {
            console.log(`   ✅ ${tableName}: Table exists`);
            if (data && data.length > 0) {
              console.log(`   📋 Sample columns:`, Object.keys(data[0]).join(', '));
            } else {
              console.log(`   📋 Table is empty, checking structure...`);
              
              // Try to insert and catch the error to see what columns are expected
              try {
                await supabase
                  .from(tableName)
                  .insert({});
              } catch (insertError) {
                console.log(`   📋 Insert error (shows required columns):`, insertError.message);
              }
            }
          }
        } catch (tableError) {
          console.log(`   ❌ ${tableName}: ${tableError.message}`);
        }
      }
    } else {
      console.log('✅ Tables found:', tables);
    }

    // Try to get column information for specific tables
    console.log('\\n3. Checking specific table structures...');
    
    // Check locations table specifically
    console.log('\\n   Locations table:');
    try {
      const { data: locationSample, error: locationError } = await supabase
        .from('locations')
        .select('*')
        .limit(1);

      if (locationError) {
        console.log(`   ❌ Error: ${locationError.message}`);
      } else {
        if (locationSample && locationSample.length > 0) {
          console.log(`   ✅ Columns:`, Object.keys(locationSample[0]).join(', '));
        } else {
          console.log(`   📋 Table exists but is empty`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error accessing locations: ${error.message}`);
    }

    // Check users table specifically
    console.log('\\n   Users table:');
    try {
      const { data: userSample, error: userError } = await supabase
        .from('users')
        .select('*')
        .limit(1);

      if (userError) {
        console.log(`   ❌ Error: ${userError.message}`);
      } else {
        if (userSample && userSample.length > 0) {
          console.log(`   ✅ Columns:`, Object.keys(userSample[0]).join(', '));
        } else {
          console.log(`   📋 Table exists but is empty`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error accessing users: ${error.message}`);
    }

  } catch (error) {
    console.log('❌ Schema check failed:', error.message);
  }
}

checkSchemas(); 