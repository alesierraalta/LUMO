-- Make cost, price, and margin columns optional in inventory_items table
-- This allows products to be created without pricing information

-- Remove NOT NULL constraints and default values
ALTER TABLE inventory_items 
  ALTER COLUMN cost DROP NOT NULL,
  ALTER COLUMN cost DROP DEFAULT;

ALTER TABLE inventory_items 
  ALTER COLUMN price DROP NOT NULL,
  ALTER COLUMN price DROP DEFAULT;

ALTER TABLE inventory_items 
  ALTER COLUMN margin DROP NOT NULL,
  ALTER COLUMN margin DROP DEFAULT;

-- Update existing records with default values to NULL if they are 0
UPDATE inventory_items 
SET cost = NULL 
WHERE cost = 0;

UPDATE inventory_items 
SET price = NULL 
WHERE price = 0;

UPDATE inventory_items 
SET margin = NULL 
WHERE margin = 0;

-- Add comment to document the change
COMMENT ON COLUMN inventory_items.cost IS 'Product cost - optional field';
COMMENT ON COLUMN inventory_items.price IS 'Product price - optional field';
COMMENT ON COLUMN inventory_items.margin IS 'Product margin - optional field'; 