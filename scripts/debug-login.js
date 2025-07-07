require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Initialize Supabase client with production database
const supabase = createClient(
  'https://ubjujxtvlubxowsphvuk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4'
);

async function debugLogin() {
  console.log('🔍 Debugging login functionality...');
  
  try {
    // Check specific admin user
    console.log('👑 Looking for admin user...');
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@example.com')
      .single();
    
    if (adminError) {
      console.error('❌ Error fetching admin user:', adminError);
      return;
    }
    
    console.log('👑 Admin user found:', adminUser);
    
    // Test password matching logic
    const testPassword = 'admin123';
    console.log(`🔐 Testing password "${testPassword}" against "${adminUser.password}"`);
    
    let passwordMatch = false;
    if (adminUser.password.startsWith('$2b$') || adminUser.password.startsWith('$2a$')) {
      console.log('🔑 Using bcrypt comparison');
      passwordMatch = await bcrypt.compare(testPassword, adminUser.password);
    } else {
      console.log('🔑 Using plain text comparison');
      passwordMatch = adminUser.password === testPassword;
    }
    
    console.log(`Password match result: ${passwordMatch}`);
    
    // Check role
    if (adminUser.role_id) {
      console.log('🎭 Checking role...');
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('*')
        .eq('id', adminUser.role_id)
        .single();
      
      if (roleError) {
        console.error('❌ Role error:', roleError);
      } else {
        console.log('🎭 Role found:', roleData);
      }
    } else {
      console.log('🎭 No role_id set for admin user');
    }
    
    // Test the actual login API
    console.log('🌐 Testing login API...');
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });
    
    console.log('📡 API Response status:', response.status);
    const responseData = await response.json();
    console.log('📡 API Response data:', responseData);
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugLogin().then(() => {
  console.log('✅ Debug completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
}); 