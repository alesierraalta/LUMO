const { createClient } = require('@supabase/supabase-js');

async function testDirectSupabase() {
  console.log('🔍 Testing Direct Supabase Operations...\n');

  try {
    // Initialize Supabase client directly
    const supabase = createClient(
      'https://ubjujxtvlubxowsphvuk.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4'
    );

    console.log('✅ Supabase client created');

    // Test 1: Simple select query
    console.log('\n📝 Test 1: Simple categories select');
    const { data: categories, error: selectError } = await supabase
      .from('categories')
      .select('*')
      .limit(1);

    if (selectError) {
      console.log('❌ Select failed:', selectError);
    } else {
      console.log('✅ Select successful, found', categories?.length || 0, 'categories');
    }

    // Test 2: Simple insert
    console.log('\n📝 Test 2: Direct category insert');
    const testCategory = {
      name: 'Direct Test Category ' + Date.now(),
      description: 'Test description'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('categories')
      .insert(testCategory)
      .select('*')
      .single();

    if (insertError) {
      console.log('❌ Insert failed:', insertError);
      console.log('Error details:', JSON.stringify(insertError, null, 2));
    } else {
      console.log('✅ Insert successful:', JSON.stringify(insertData, null, 2));
      
      // Clean up - delete the test category
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', insertData.id);
      
      if (deleteError) {
        console.log('⚠️ Cleanup failed:', deleteError);
      } else {
        console.log('✅ Cleanup successful');
      }
    }

    // Test 3: Insert with user ID
    console.log('\n📝 Test 3: Insert with user ID');
    const testCategoryWithUser = {
      name: 'Direct Test Category with User ' + Date.now(),
      description: 'Test description',
      created_by_id: 'dd97c238-6649-4e31-979b-c9ef12959998'
    };

    const { data: insertWithUserData, error: insertWithUserError } = await supabase
      .from('categories')
      .insert(testCategoryWithUser)
      .select('*')
      .single();

    if (insertWithUserError) {
      console.log('❌ Insert with user failed:', insertWithUserError);
      console.log('Error details:', JSON.stringify(insertWithUserError, null, 2));
    } else {
      console.log('✅ Insert with user successful:', JSON.stringify(insertWithUserData, null, 2));
      
      // Clean up
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', insertWithUserData.id);
      
      if (deleteError) {
        console.log('⚠️ Cleanup failed:', deleteError);
      } else {
        console.log('✅ Cleanup successful');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDirectSupabase(); 