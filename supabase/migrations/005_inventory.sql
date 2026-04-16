-- Inventory table for bulk CSV uploads
CREATE TABLE IF NOT EXISTS inventory (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  price       NUMERIC NOT NULL,
  quantity    INTEGER NOT NULL,
  category    TEXT NOT NULL,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row-level security
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners manage own inventory"
  ON inventory FOR ALL
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );
