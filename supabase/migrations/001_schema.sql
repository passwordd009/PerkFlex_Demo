-- Enable PostGIS for geographic queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- ─── Profiles ────────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('customer', 'business_owner')),
  full_name   TEXT,
  avatar_url  TEXT,
  points_balance INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Districts ───────────────────────────────────────────────────────────────
CREATE TABLE districts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  boundary   GEOGRAPHY(POLYGON, 4326),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Businesses ──────────────────────────────────────────────────────────────
CREATE TABLE businesses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  district_id UUID REFERENCES districts(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  description TEXT,
  category    TEXT,
  address     TEXT,
  lat         FLOAT,
  lng         FLOAT,
  logo_url    TEXT,
  cover_url   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX businesses_owner_idx ON businesses(owner_id);
CREATE INDEX businesses_district_idx ON businesses(district_id);
CREATE INDEX businesses_active_idx ON businesses(is_active);

-- ─── Menu Items ───────────────────────────────────────────────────────────────
CREATE TABLE menu_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  price        NUMERIC(10, 2) NOT NULL,
  category     TEXT,
  image_url    TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  points_value INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX menu_items_business_idx ON menu_items(business_id);

-- ─── Orders ──────────────────────────────────────────────────────────────────
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'confirmed', 'ready', 'completed', 'cancelled')),
  total           NUMERIC(10, 2) NOT NULL,
  points_earned   INTEGER NOT NULL DEFAULT 0,
  points_redeemed INTEGER NOT NULL DEFAULT 0,
  qr_token        TEXT UNIQUE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at     TIMESTAMPTZ
);

CREATE INDEX orders_customer_idx ON orders(customer_id);
CREATE INDEX orders_business_idx ON orders(business_id);
CREATE INDEX orders_status_idx ON orders(status);

-- ─── Order Items ─────────────────────────────────────────────────────────────
CREATE TABLE order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
  quantity     INTEGER NOT NULL CHECK (quantity > 0),
  unit_price   NUMERIC(10, 2) NOT NULL,
  subtotal     NUMERIC(10, 2) NOT NULL
);

CREATE INDEX order_items_order_idx ON order_items(order_id);

-- ─── Points Ledger ───────────────────────────────────────────────────────────
CREATE TABLE points_ledger (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id    UUID REFERENCES orders(id) ON DELETE SET NULL,
  type        TEXT NOT NULL CHECK (type IN ('earned', 'redeemed', 'expired', 'bonus')),
  amount      INTEGER NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX points_ledger_user_idx ON points_ledger(user_id);

-- ─── Rewards ─────────────────────────────────────────────────────────────────
CREATE TABLE rewards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  points_cost     INTEGER NOT NULL CHECK (points_cost > 0),
  discount_amount NUMERIC(10, 2),
  discount_type   TEXT CHECK (discount_type IN ('fixed', 'percentage')),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX rewards_business_idx ON rewards(business_id);
CREATE INDEX rewards_active_idx ON rewards(is_active);

-- ─── Reward Redemptions ──────────────────────────────────────────────────────
CREATE TABLE reward_redemptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_id   UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  order_id    UUID REFERENCES orders(id) ON DELETE SET NULL,
  points_spent INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX reward_redemptions_user_idx ON reward_redemptions(user_id);

-- ─── Auto-create profile on signup ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, role, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
