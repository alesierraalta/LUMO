/**
 * Script para agregar las columnas faltantes unit_cost y unit_price
 * a la tabla inventory_items en Supabase
 */

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function addMissingColumns() {
  try {
    console.log('🔍 Conectando a Supabase...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('🔧 Variables de entorno:');
    console.log('URL:', supabaseUrl ? 'Present' : 'Missing');
    console.log('Service Key:', supabaseKey ? 'Present (length: ' + supabaseKey.length + ')' : 'Missing');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variables de entorno de Supabase no encontradas');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('📋 Verificando estructura actual de inventory_items...');
    
    // Primero intentemos obtener un registro para ver qué columnas existen
    let { data: sampleData, error: sampleError } = await supabase
      .from('inventory_items')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('❌ Error al obtener datos:', sampleError);
      
      // Si hay error de autenticación, intentemos con el anon key
      console.log('🔄 Intentando con anon key...');
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const supabaseAnon = createClient(supabaseUrl, anonKey);
      
      const { data: anonData, error: anonError } = await supabaseAnon
        .from('inventory_items')
        .select('*')
        .limit(1);
      
      if (anonError) {
        console.error('❌ Error con anon key también:', anonError);
        throw anonError;
      }
      
      console.log('✅ Conexión exitosa con anon key');
      sampleData = anonData;
    }
    
    if (sampleData && sampleData.length > 0) {
      console.log('📊 Columnas actuales en inventory_items:');
      const columns = Object.keys(sampleData[0]);
      columns.forEach(column => {
        console.log(`  - ${column}`);
      });
      
      // Verificar si las columnas unit_cost y unit_price existen
      const hasUnitCost = columns.includes('unit_cost');
      const hasUnitPrice = columns.includes('unit_price');
      
      console.log('\n🔍 Estado de las columnas requeridas:');
      console.log(`  unit_cost: ${hasUnitCost ? '✅ EXISTE' : '❌ FALTA'}`);
      console.log(`  unit_price: ${hasUnitPrice ? '✅ EXISTE' : '❌ FALTA'}`);
      
      if (!hasUnitCost || !hasUnitPrice) {
        console.log('\n📝 SQL para agregar las columnas faltantes:');
        console.log('Ejecuta estos comandos en el SQL Editor de Supabase:\n');
        
        if (!hasUnitCost) {
          console.log('-- Agregar columna unit_cost');
          console.log('ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(10,2) DEFAULT 0;');
        }
        
        if (!hasUnitPrice) {
          console.log('-- Agregar columna unit_price');
          console.log('ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2) DEFAULT 0;');
        }
        
        console.log('\n🔗 Pasos para ejecutar:');
        console.log('1. Ve a https://supabase.com/dashboard/project/ndprriqyhddjoixrlqnz');
        console.log('2. Navega a SQL Editor');
        console.log('3. Copia y pega los comandos SQL de arriba');
        console.log('4. Ejecuta los comandos');
        console.log('5. Verifica que las columnas se agregaron correctamente');
        
        console.log('\n⚠️  IMPORTANTE: Después de agregar las columnas, ejecuta el test de edición nuevamente.');
      } else {
        console.log('\n✅ Todas las columnas requeridas ya existen!');
      }
    } else {
      console.log('⚠️  No hay datos en la tabla inventory_items para verificar estructura');
      console.log('📝 SQL para agregar las columnas (ejecutar por precaución):');
      console.log('\nALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(10,2) DEFAULT 0;');
      console.log('ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2) DEFAULT 0;');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar el script
addMissingColumns();