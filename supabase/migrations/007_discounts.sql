CREATE TABLE discounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT,
  image_url           TEXT,
  discount_percentage INTEGER NOT NULL CHECK (discount_percentage BETWEEN 10 AND 100),
  item_ids            UUID[] NOT NULL DEFAULT '{}',
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners manage own discounts"
  ON discounts FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));
