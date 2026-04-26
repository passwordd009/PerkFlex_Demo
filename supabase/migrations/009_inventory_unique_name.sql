-- Remove duplicate inventory rows, keeping the most recent per (business_id, name)
DELETE FROM inventory
WHERE id NOT IN (
  SELECT DISTINCT ON (business_id, name) id
  FROM inventory
  ORDER BY business_id, name, created_at DESC
);

-- Enforce uniqueness going forward
ALTER TABLE inventory
  ADD CONSTRAINT inventory_business_id_name_key UNIQUE (business_id, name);
