-- Add is_combo flag; recalculate points_cost using TIV = sum (not avg)
ALTER TABLE discounts
  ADD COLUMN IF NOT EXISTS is_combo BOOLEAN NOT NULL DEFAULT false;

-- Mark existing multi-item discounts as combos
UPDATE discounts SET is_combo = true WHERE array_length(item_ids, 1) > 1;

-- Recalculate points_cost with TIV = sum of item prices (not avg)
UPDATE discounts d
SET points_cost = GREATEST(1, ROUND(
  (SELECT SUM(i.price) FROM inventory i WHERE i.id = ANY(d.item_ids))
  * (d.discount_percentage::numeric / 100)
  / 0.01
)::integer)
WHERE array_length(d.item_ids, 1) > 0
  AND EXISTS (SELECT 1 FROM inventory i WHERE i.id = ANY(d.item_ids));
