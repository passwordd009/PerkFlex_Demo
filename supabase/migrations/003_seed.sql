-- ─── Seed: Districts ──────────────────────────────────────────────────────────
-- Downtown district (simple bounding box polygon for demo)
INSERT INTO districts (id, name, boundary) VALUES
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Downtown',
    ST_GeomFromText(
      'POLYGON((-87.6430 41.8700, -87.6100 41.8700, -87.6100 41.8900, -87.6430 41.8900, -87.6430 41.8700))',
      4326
    )::geography
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000002',
    'Midtown',
    ST_GeomFromText(
      'POLYGON((-87.6430 41.8900, -87.6100 41.8900, -87.6100 41.9100, -87.6430 41.9100, -87.6430 41.8900))',
      4326
    )::geography
  );

-- Note: Businesses and users should be created through the app to trigger
-- the profile creation trigger. This seed only provides districts.
-- For local dev, you can manually insert test users via Supabase Studio.
