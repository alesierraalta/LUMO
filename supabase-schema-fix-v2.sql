-- Supabase Schema Fix V2 - Add quantity column
-- This script adds the missing quantity column to inventory_items

-- Add quantity column as an alias for current_stock
ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0;

-- Update quantity to match current_stock for existing records
UPDATE inventory_items 
SET quantity = current_stock 
WHERE quantity IS NULL OR quantity = 0;

-- Create a trigger to keep quantity and current_stock in sync
CREATE OR REPLACE FUNCTION sync_quantity_current_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- When current_stock is updated, update quantity
  IF TG_OP = 'UPDATE' AND OLD.current_stock != NEW.current_stock THEN
    NEW.quantity = NEW.current_stock;
  END IF;
  
  -- When quantity is updated, update current_stock
  IF TG_OP = 'UPDATE' AND OLD.quantity != NEW.quantity THEN
    NEW.current_stock = NEW.quantity;
  END IF;
  
  -- For inserts, ensure both are the same
  IF TG_OP = 'INSERT' THEN
    IF NEW.quantity IS NULL THEN
      NEW.quantity = NEW.current_stock;
    ELSIF NEW.current_stock IS NULL THEN
      NEW.current_stock = NEW.quantity;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS sync_quantity_trigger ON inventory_items;
CREATE TRIGGER sync_quantity_trigger
  BEFORE INSERT OR UPDATE ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION sync_quantity_current_stock();

-- Verify the changes
SELECT 'inventory_items quantity column' as info, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'inventory_items' 
AND column_name = 'quantity';

SELECT 'sample data' as info, id, name, current_stock, quantity 
FROM inventory_items 
LIMIT 3; 