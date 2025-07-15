require('dotenv').config({ path: '.env.local' });

async function debugLocationUpdate() {
  console.log('🔍 Debugging location update issue...\n');

  try {
    // Test the API endpoint directly
    const itemId = '08db24a5-fd16-4f84-82b8-ef085939f100';
    const locationId = 'db09fccc-48e7-44b4-818e-f24594666fa8';
    
    console.log('📡 Testing API endpoint directly...');
    const response = await fetch(`http://localhost:3000/api/inventory/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        locationId: locationId
      })
    });

    const result = await response.json();
    console.log('📊 API Response Status:', response.status);
    console.log('📊 API Response Body:', JSON.stringify(result, null, 2));

    if (result.success && result.item) {
      console.log('\n🔍 Checking specific fields:');
      console.log('  locationId in response:', result.item.locationId);
      console.log('  locationId type:', typeof result.item.locationId);
      console.log('  Expected locationId:', locationId);
      console.log('  Match:', result.item.locationId === locationId);
    }

    // Now let's check what's actually in the database
    console.log('\n🗄️ Checking database directly...');
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: dbData, error: dbError } = await supabase
      .from('inventory_items')
      .select('id, name, category_id, location_id')
      .eq('id', itemId)
      .single();

    if (dbError) {
      console.error('❌ Database query error:', dbError);
    } else {
      console.log('📊 Database record:', JSON.stringify(dbData, null, 2));
      console.log('  location_id in DB:', dbData.location_id);
      console.log('  location_id type:', typeof dbData.location_id);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugLocationUpdate();