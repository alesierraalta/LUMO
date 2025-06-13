-- Supabase Schema Fix for Inventory Management System
-- This script adds missing columns to the existing database

-- Add missing columns to inventory_items table
ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS margin DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update existing records to have default values for new columns
UPDATE inventory_items 
SET 
  min_stock_level = COALESCE(min_level, 0),
  margin = 0,
  image_url = NULL
WHERE min_stock_level IS NULL OR margin IS NULL;

-- Create some default categories if they don't exist
INSERT INTO categories (id, name, description, created_at, updated_at, created_by_id)
SELECT 
  uuid_generate_v4(),
  'General',
  'Categoría general para productos',
  NOW(),
  NOW(),
  (SELECT id FROM users WHERE email = 'alesierraalta@gmail.com' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'General')
AND EXISTS (SELECT 1 FROM users WHERE email = 'alesierraalta@gmail.com');

INSERT INTO categories (id, name, description, created_at, updated_at, created_by_id)
SELECT 
  uuid_generate_v4(),
  'Electrónicos',
  'Productos electrónicos y tecnológicos',
  NOW(),
  NOW(),
  (SELECT id FROM users WHERE email = 'alesierraalta@gmail.com' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Electrónicos')
AND EXISTS (SELECT 1 FROM users WHERE email = 'alesierraalta@gmail.com');

-- Create some default locations if they don't exist
INSERT INTO locations (id, name, description, is_active, created_at, updated_at)
SELECT 
  uuid_generate_v4(),
  'Almacén Principal',
  'Ubicación principal del almacén',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Almacén Principal');

INSERT INTO locations (id, name, description, is_active, created_at, updated_at)
SELECT 
  uuid_generate_v4(),
  'Tienda',
  'Área de ventas de la tienda',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Tienda');

-- Verify the changes
SELECT 'inventory_items columns' as table_info, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'inventory_items' 
AND column_name IN ('min_stock_level', 'margin', 'image_url')
ORDER BY column_name;

SELECT 'categories count' as info, COUNT(*) as count FROM categories;
SELECT 'locations count' as info, COUNT(*) as count FROM locations; 