const { createClient } = require('@supabase/supabase-js');

async function checkTableSchemas() {
  console.log('🔍 Checking Table Schemas\n');

  const supabase = createClient(
    'https://ubjujxtvlubxowsphvuk.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4'
  );

  try {
    // Check locations table structure
    console.log('1. Checking locations table structure...');
    const { data: locationsColumns, error: locationsError } = await supabase
      .rpc('get_table_columns', { table_name: 'locations' });

    if (locationsError) {
      console.log('❌ Error getting locations columns:', locationsError.message);
      
      // Try alternative method
      console.log('   Trying alternative method...');
      const { data: locationsData, error: altError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'locations')
        .eq('table_schema', 'public');

      if (altError) {
        console.log('   ❌ Alternative method failed:', altError.message);
      } else {
        console.log('   ✅ Locations columns:');
        locationsData.forEach(col => {
          console.log(`     - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
        });
      }
    } else {
      console.log('✅ Locations columns:', locationsColumns);
    }

    // Check users table structure  
    console.log('\\n2. Checking users table structure...');
    const { data: usersData, error: usersError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'users')
      .eq('table_schema', 'public');

    if (usersError) {
      console.log('❌ Error getting users columns:', usersError.message);
    } else {
      console.log('✅ Users columns:');
      usersData.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
      });
    }

    // Check categories table structure
    console.log('\\n3. Checking categories table structure...');
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'categories')
      .eq('table_schema', 'public');

    if (categoriesError) {
      console.log('❌ Error getting categories columns:', categoriesError.message);
    } else {
      console.log('✅ Categories columns:');
      categoriesData.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
      });
    }

    // Check inventory_items table structure
    console.log('\\n4. Checking inventory_items table structure...');
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'inventory_items')
      .eq('table_schema', 'public');

    if (inventoryError) {
      console.log('❌ Error getting inventory_items columns:', inventoryError.message);
    } else {
      console.log('✅ Inventory Items columns:');
      inventoryData.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
      });
    }

    // Check what columns are expected vs actual
    console.log('\\n5. Expected vs Actual Columns Analysis:');
    
    const expectedColumns = {
      locations: ['id', 'name', 'description', 'created_by_id', 'created_at', 'updated_at'],
      users: ['id', 'name', 'email', 'password', 'role_id', 'is_active', 'created_by_id', 'created_at', 'updated_at'],
      categories: ['id', 'name', 'description', 'created_by_id', 'created_at', 'updated_at'],
      inventory_items: ['id', 'name', 'description', 'sku', 'quantity', 'min_stock_level', 'category_id', 'location_id', 'created_by_id', 'created_at', 'updated_at']
    };

    console.log('\\n   Expected columns for locations:', expectedColumns.locations.join(', '));
    console.log('   Expected columns for users:', expectedColumns.users.join(', '));
    console.log('   Expected columns for categories:', expectedColumns.categories.join(', '));
    console.log('   Expected columns for inventory_items:', expectedColumns.inventory_items.join(', '));

  } catch (error) {
    console.log('❌ Schema check failed:', error.message);
  }
}

checkTableSchemas(); 