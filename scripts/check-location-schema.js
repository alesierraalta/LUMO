require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLocationSchema() {
  console.log('🔍 Verificando esquema de la tabla inventory_items...\n');

  try {
    // Obtener información de las columnas de la tabla
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'inventory_items')
      .eq('table_schema', 'public');

    if (error) {
      console.error('❌ Error obteniendo esquema:', error);
      return;
    }

    console.log('📋 Columnas de la tabla inventory_items:');
    data.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // También obtener un item de ejemplo para ver los datos reales
    console.log('\n📊 Ejemplo de item de inventario:');
    const { data: sampleItem, error: sampleError } = await supabase
      .from('inventory_items')
      .select('*')
      .limit(1)
      .single();

    if (sampleError) {
      console.error('❌ Error obteniendo item de ejemplo:', sampleError);
      return;
    }

    console.log('Campos disponibles:', Object.keys(sampleItem));
    console.log('Datos de ejemplo:', JSON.stringify(sampleItem, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkLocationSchema();