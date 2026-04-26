-- Make menu_item_id nullable (was NOT NULL in original schema)
ALTER TABLE order_items
  ALTER COLUMN menu_item_id DROP NOT NULL;

-- Add inventory reference (loose FK — SET NULL on delete so orders survive inventory changes)
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS inventory_item_id UUID REFERENCES inventory(id) ON DELETE SET NULL;

-- Snapshot the item name at order time so history never needs a join
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS item_name TEXT;
