-- Recalculate points_cost for all existing discounts using the formula:
-- PR = TIV × p / PPV
-- where TIV = avg item price, p = discount_percentage / 100, PPV = $0.01
UPDATE discounts d
SET points_cost = GREATEST(1, ROUND(
  (SELECT AVG(i.price) FROM inventory i WHERE i.id = ANY(d.item_ids))
  * (d.discount_percentage::numeric / 100)
  / 0.01
)::integer)
WHERE array_length(d.item_ids, 1) > 0
  AND EXISTS (SELECT 1 FROM inventory i WHERE i.id = ANY(d.item_ids));
