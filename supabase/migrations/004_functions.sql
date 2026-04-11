-- ─── Atomic points increment/decrement ───────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_points(p_user_id UUID, p_amount INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE profiles
  SET points_balance = points_balance + p_amount
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;

  -- Prevent negative balance
  IF (SELECT points_balance FROM profiles WHERE id = p_user_id) < 0 THEN
    RAISE EXCEPTION 'Insufficient points balance';
  END IF;
END;
$$;

-- ─── Check if a lat/lng is within a district ─────────────────────────────────
CREATE OR REPLACE FUNCTION is_point_in_district(
  p_lat FLOAT,
  p_lng FLOAT,
  p_district_id UUID
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_boundary GEOGRAPHY;
  v_point GEOGRAPHY;
BEGIN
  SELECT boundary INTO v_boundary FROM districts WHERE id = p_district_id;
  IF NOT FOUND THEN RETURN FALSE; END IF;

  v_point := ST_MakePoint(p_lng, p_lat)::geography;
  RETURN ST_Contains(v_boundary::geometry, v_point::geometry);
END;
$$;
