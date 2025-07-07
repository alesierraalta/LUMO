require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Initialize Supabase client with production database
const supabase = createClient(
  'https://ubjujxtvlubxowsphvuk.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4'
);

async function setupTestData() {
  console.log('🔧 Setting up test data...');
  
  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return;
    }
    console.log('✅ Database connection successful');

    // Check if admin user exists
    console.log('👤 Checking for admin user...');
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@example.com')
      .single();

    if (adminError && adminError.code !== 'PGRST116') {
      console.error('❌ Error checking admin user:', adminError.message);
      return;
    }

    if (!adminUser) {
      console.log('🔨 Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const { data: newAdmin, error: createError } = await supabase
        .from('users')
        .insert([
          {
            email: 'admin@example.com',
            password_hash: hashedPassword,
            role: 'admin',
            first_name: 'Admin',
            last_name: 'User',
            is_active: true
          }
        ])
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating admin user:', createError.message);
        return;
      }
      console.log('✅ Admin user created:', newAdmin.email);
    } else {
      console.log('✅ Admin user already exists:', adminUser.email);
    }

    // Create test categories
    console.log('📂 Setting up test categories...');
    const testCategories = [
      { name: 'Electronics', description: 'Electronic devices and components' },
      { name: 'Office Supplies', description: 'Office and administrative supplies' },
      { name: 'Tools', description: 'Hand tools and equipment' }
    ];

    for (const category of testCategories) {
      const { data: existingCategory } = await supabase
        .from('categories')
        .select('*')
        .eq('name', category.name)
        .single();

      if (!existingCategory) {
        const { error: categoryError } = await supabase
          .from('categories')
          .insert([category]);
        
        if (categoryError) {
          console.error(`❌ Error creating category ${category.name}:`, categoryError.message);
        } else {
          console.log(`✅ Category created: ${category.name}`);
        }
      } else {
        console.log(`✅ Category already exists: ${category.name}`);
      }
    }

    // Create test locations
    console.log('📍 Setting up test locations...');
    const testLocations = [
      { name: 'Main Warehouse', address: '123 Main St', city: 'Anytown', state: 'ST', zip_code: '12345' },
      { name: 'Office Storage', address: '456 Office Blvd', city: 'Business City', state: 'BC', zip_code: '67890' }
    ];

    for (const location of testLocations) {
      const { data: existingLocation } = await supabase
        .from('locations')
        .select('*')
        .eq('name', location.name)
        .single();

      if (!existingLocation) {
        const { error: locationError } = await supabase
          .from('locations')
          .insert([location]);
        
        if (locationError) {
          console.error(`❌ Error creating location ${location.name}:`, locationError.message);
        } else {
          console.log(`✅ Location created: ${location.name}`);
        }
      } else {
        console.log(`✅ Location already exists: ${location.name}`);
      }
    }

    console.log('🎉 Test data setup complete!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

// Run the setup
setupTestData().then(() => {
  console.log('✅ Setup script completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Setup script failed:', error);
  process.exit(1);
}); 