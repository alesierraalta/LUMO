const { createClient } = require('@supabase/supabase-js');

async function debugFailingTests() {
  console.log('🔍 Debugging Failing Tests\n');

  const supabase = createClient(
    'https://ubjujxtvlubxowsphvuk.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4'
  );

  try {
    // Step 1: Login to get token
    console.log('1. Getting authentication token...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'alesierraalta@gmail.com',
      password: 'admin123'
    });

    if (authError) {
      console.log('❌ Login failed:', authError.message);
      return;
    }

    console.log('✅ Login successful');
    const token = authData.session.access_token;

    // Step 2: Create test data for debugging
    console.log('\\n2. Creating test data...');
    
    // Create a test location first
    const { data: locationData, error: locationError } = await supabase
      .from('locations')
      .insert({
        name: `Test Location ${Date.now()}`,
        description: 'Test location for debugging',
        created_by_id: authData.user.id
      })
      .select()
      .single();

    if (locationError) {
      console.log('❌ Location creation failed:', locationError.message);
      return;
    }

    console.log('✅ Test location created:', locationData.id);

    // Create a test user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        name: `Test User ${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'testpass123',
        role_id: '7240b17e-bcc0-4a04-9a5e-62ca637003d2', // Use existing role ID
        is_active: true,
        created_by_id: authData.user.id
      })
      .select()
      .single();

    if (userError) {
      console.log('❌ User creation failed:', userError.message);
      return;
    }

    console.log('✅ Test user created:', userData.id);

    // Step 3: Test Location Delete
    console.log('\\n3. Testing Location Delete...');
    try {
      const response = await fetch(`http://localhost:3000/api/locations/${locationData.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('   Status:', response.status);
      const responseText = await response.text();
      console.log('   Response:', responseText);

      if (response.ok) {
        console.log('✅ Location delete successful');
      } else {
        console.log('❌ Location delete failed');
      }
    } catch (error) {
      console.log('❌ Location delete error:', error.message);
    }

    // Step 4: Test User Update
    console.log('\\n4. Testing User Update...');
    try {
      const updateData = {
        name: `Updated User ${Date.now()}`
      };

      const response = await fetch(`http://localhost:3000/api/users/${userData.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      console.log('   Status:', response.status);
      const responseText = await response.text();
      console.log('   Response:', responseText);

      if (response.ok) {
        console.log('✅ User update successful');
      } else {
        console.log('❌ User update failed');
      }
    } catch (error) {
      console.log('❌ User update error:', error.message);
    }

    // Step 5: Test Unauthorized Access
    console.log('\\n5. Testing Unauthorized Access...');
    try {
      const response = await fetch('http://localhost:3000/api/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
          // No Authorization header
        }
      });

      console.log('   Status:', response.status);
      const responseText = await response.text();
      console.log('   Response:', responseText);

      if (response.status === 401) {
        console.log('✅ Unauthorized access properly rejected');
      } else {
        console.log('❌ Unauthorized access not properly handled');
      }
    } catch (error) {
      console.log('❌ Unauthorized access test error:', error.message);
    }

    // Step 6: Test Invalid Data
    console.log('\\n6. Testing Invalid Data...');
    try {
      const invalidData = {
        // Missing required fields
      };

      const response = await fetch('http://localhost:3000/api/categories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidData)
      });

      console.log('   Status:', response.status);
      const responseText = await response.text();
      console.log('   Response:', responseText);

      if (response.status === 400) {
        console.log('✅ Invalid data properly rejected');
      } else {
        console.log('❌ Invalid data not properly handled');
      }
    } catch (error) {
      console.log('❌ Invalid data test error:', error.message);
    }

    // Cleanup: Delete test user
    console.log('\\n7. Cleaning up test data...');
    try {
      await supabase
        .from('users')
        .delete()
        .eq('id', userData.id);
      console.log('✅ Test user cleaned up');
    } catch (error) {
      console.log('⚠️ Cleanup warning:', error.message);
    }

  } catch (error) {
    console.log('❌ Debug failed:', error.message);
  }
}

debugFailingTests(); 