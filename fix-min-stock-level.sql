-- Add min_stock_level column to inventory_items table in Supabase
-- This fixes the "Could not find the 'min_stock_level' column" error

-- Add the missing column with default value
ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 5 NOT NULL;

-- Copy existing minLevel values if they exist (for backward compatibility)
-- This handles cases where minLevel column might exist from previous schema
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'inventory_items' 
               AND column_name = 'minLevel') THEN
        UPDATE inventory_items 
        SET min_stock_level = "minLevel" 
        WHERE "minLevel" IS NOT NULL;
    END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_min_stock_level 
ON inventory_items(min_stock_level);

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'inventory_items' 
AND column_name = 'min_stock_level'; 