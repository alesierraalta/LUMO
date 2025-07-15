/**
 * Script para verificar y corregir las columnas de la tabla inventory_items
 * Identifica las columnas reales y actualiza el mapeo en db-supabase.ts
 */

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function fixInventoryColumns() {
  try {
    console.log('🔍 Conectando a Supabase para verificar esquema...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('🔧 Debug de variables de entorno:');
    console.log('SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Present' : 'Missing');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variables de entorno de Supabase no encontradas');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Obtener información del esquema de la tabla inventory_items
    console.log('📋 Obteniendo esquema de la tabla inventory_items...');
    
    // Primero, intentemos obtener un registro para ver la estructura
    const { data: sampleData, error: sampleError } = await supabase
      .from('inventory_items')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('❌ Error al obtener datos de muestra:', sampleError);
      throw sampleError;
    }
    
    if (sampleData && sampleData.length > 0) {
      console.log('📊 Estructura real de la tabla inventory_items:');
      const columns = Object.keys(sampleData[0]);
      columns.forEach(column => {
        console.log(`  - ${column}: ${typeof sampleData[0][column]} = ${sampleData[0][column]}`);
      });
      
      // Buscar columnas relacionadas con precio y costo
      console.log('\n🔍 Análisis de columnas de precio y costo:');
      const priceColumns = columns.filter(col => col.toLowerCase().includes('price'));
      const costColumns = columns.filter(col => col.toLowerCase().includes('cost'));
      
      console.log('💰 Columnas de precio:', priceColumns);
      console.log('💵 Columnas de costo:', costColumns);
      
      // Verificar si existen las columnas que esperamos
      const expectedColumns = ['unit_cost', 'unit_price', 'current_stock', 'min_stock_level'];
      console.log('\n✅ Verificación de columnas esperadas:');
      expectedColumns.forEach(col => {
        if (columns.includes(col)) {
          console.log(`  ✅ ${col}: EXISTE`);
        } else {
          console.log(`  ❌ ${col}: NO EXISTE`);
        }
      });
      
      // Intentar agregar las columnas faltantes
      console.log('\n🔧 Intentando agregar columnas faltantes...');
      
      // Nota: En Supabase, necesitamos usar SQL para agregar columnas
      // Esto requiere permisos de administrador en la base de datos
      
      if (!columns.includes('unit_cost')) {
        console.log('➕ Intentando agregar columna unit_cost...');
        try {
          const { data, error } = await supabase.rpc('exec_sql', {
            sql: 'ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(10,2) DEFAULT 0;'
          });
          
          if (error) {
            console.log('⚠️ No se pudo agregar unit_cost via RPC:', error.message);
            console.log('💡 Sugerencia: Agregar manualmente en el panel de Supabase');
          } else {
            console.log('✅ Columna unit_cost agregada exitosamente');
          }
        } catch (err) {
          console.log('⚠️ RPC no disponible, necesita agregarse manualmente');
        }
      }
      
      if (!columns.includes('unit_price')) {
        console.log('➕ Intentando agregar columna unit_price...');
        try {
          const { data, error } = await supabase.rpc('exec_sql', {
            sql: 'ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2) DEFAULT 0;'
          });
          
          if (error) {
            console.log('⚠️ No se pudo agregar unit_price via RPC:', error.message);
            console.log('💡 Sugerencia: Agregar manualmente en el panel de Supabase');
          } else {
            console.log('✅ Columna unit_price agregada exitosamente');
          }
        } catch (err) {
          console.log('⚠️ RPC no disponible, necesita agregarse manualmente');
        }
      }
      
    } else {
      console.log('⚠️ No se encontraron registros en la tabla inventory_items');
    }
    
    // Generar SQL para agregar las columnas manualmente
    console.log('\n📝 SQL para agregar columnas manualmente en Supabase:');
    console.log('-- Ejecutar en el SQL Editor de Supabase:');
    console.log('ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(10,2) DEFAULT 0;');
    console.log('ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2) DEFAULT 0;');
    
    console.log('\n🎯 Pasos siguientes:');
    console.log('1. Ejecutar el SQL anterior en el panel de Supabase');
    console.log('2. Verificar que las columnas se agregaron correctamente');
    console.log('3. Ejecutar nuevamente el test de edición de items');
    
  } catch (error) {
    console.error('❌ Error en la verificación del esquema:', error);
  }
}

// Ejecutar la corrección
fixInventoryColumns();