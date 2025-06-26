-- LUMO Production Schema Synchronization Script
-- Run this in production Supabase (ubjujxtvlubxowsphvuk) SQL Editor

-- Fix users table password field
ALTER TABLE users RENAME COLUMN password_hash TO password;
-- If that fails, try this alternative:
-- ALTER TABLE users ADD COLUMN password VARCHAR(255);
-- UPDATE users SET password = password_hash WHERE password IS NULL;
-- ALTER TABLE users DROP COLUMN password_hash;

-- Add missing columns to inventory_items
ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS margin DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Ensure roles table has correct structure
ALTER TABLE roles 
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_min_stock_level ON inventory_items(min_stock_level);

-- Ensure admin user exists with correct email
INSERT INTO users (id, email, name, password, role_id, is_active, created_at, updated_at)
SELECT 
  'dd97c238-6649-4e31-979b-c9ef12959999'::uuid,
  'alesierraalta@gmail.com',
  'Alejandro Sierra (ROOT)',
  '$2a$10$YourHashedPasswordHere',  -- You'll need to update this
  (SELECT id FROM roles WHERE name = 'ADMIN' LIMIT 1),
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'alesierraalta@gmail.com');

-- Verify the changes
SELECT 'Schema verification' as info;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'users' AND column_name IN ('password', 'password_hash');

SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'inventory_items' AND column_name IN ('min_stock_level', 'margin', 'image_url');

SELECT 'Admin user check' as info;
SELECT email, name, is_active FROM users WHERE email = 'alesierraalta@gmail.com'; 