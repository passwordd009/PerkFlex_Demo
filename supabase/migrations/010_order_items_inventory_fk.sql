-- order_items will now reference inventory directly
ALTER TABLE order_items
  ADD COLUMN inventory_item_id UUID REFERENCES inventory(id) ON DELETE RESTRICT;

-- keep menu_item_id but make it nullable so existing rows aren't broken
ALTER TABLE order_items
  ALTER COLUMN menu_item_id DROP NOT NULL;
