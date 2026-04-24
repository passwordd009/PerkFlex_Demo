-- Add discount_pct to menu items so per-item discounts can be tracked
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS discount_pct NUMERIC;

-- Link rewards back to the menu item they discount
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE;
