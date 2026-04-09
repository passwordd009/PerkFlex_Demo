-- ─── Enable RLS on all tables ─────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

-- ─── Profiles ─────────────────────────────────────────────────────────────────
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- ─── Districts (public read) ──────────────────────────────────────────────────
CREATE POLICY "Districts are publicly readable"
  ON districts FOR SELECT USING (true);

-- ─── Businesses (public read, owner write) ────────────────────────────────────
CREATE POLICY "Businesses are publicly readable when active"
  ON businesses FOR SELECT USING (is_active = true);

CREATE POLICY "Business owners can manage their business"
  ON businesses FOR ALL USING (auth.uid() = owner_id);

-- ─── Menu Items (public read for available items, owner write) ────────────────
CREATE POLICY "Menu items are publicly readable when available"
  ON menu_items FOR SELECT USING (is_available = true);

CREATE POLICY "Business owners can manage their menu items"
  ON menu_items FOR ALL USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = menu_items.business_id
        AND businesses.owner_id = auth.uid()
    )
  );

-- ─── Orders ──────────────────────────────────────────────────────────────────
CREATE POLICY "Customers can view their own orders"
  ON orders FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Business owners can view orders for their business"
  ON orders FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = orders.business_id
        AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can update order status"
  ON orders FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = orders.business_id
        AND businesses.owner_id = auth.uid()
    )
  );

-- Orders are created by the Express service role, not directly by users

-- ─── Order Items ──────────────────────────────────────────────────────────────
CREATE POLICY "Customers can view their order items"
  ON order_items FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.customer_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can view their order items"
  ON order_items FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN businesses ON businesses.id = orders.business_id
      WHERE orders.id = order_items.order_id
        AND businesses.owner_id = auth.uid()
    )
  );

-- ─── Points Ledger ────────────────────────────────────────────────────────────
CREATE POLICY "Users can view their own points history"
  ON points_ledger FOR SELECT USING (auth.uid() = user_id);

-- ─── Rewards (public read, owner write) ──────────────────────────────────────
CREATE POLICY "Active rewards are publicly readable"
  ON rewards FOR SELECT USING (is_active = true);

CREATE POLICY "Business owners can manage their rewards"
  ON rewards FOR ALL USING (
    business_id IS NULL OR
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = rewards.business_id
        AND businesses.owner_id = auth.uid()
    )
  );

-- ─── Reward Redemptions ───────────────────────────────────────────────────────
CREATE POLICY "Users can view their own redemptions"
  ON reward_redemptions FOR SELECT USING (auth.uid() = user_id);
