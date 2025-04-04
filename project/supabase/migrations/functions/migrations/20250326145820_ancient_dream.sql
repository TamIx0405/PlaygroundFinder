CREATE OR REPLACE FUNCTION get_nearby_playgrounds(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision
)
RETURNS TABLE (
  id uuid,
  name text,
  location text,
  latitude numeric,
  longitude numeric,
  distance_km double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.location,
    p.latitude,
    p.longitude,
    (earth_distance(
      ll_to_earth(p.latitude, p.longitude),
      ll_to_earth(user_lat, user_lng)
    ) / 1000.0) as distance_km
  FROM playgrounds p
  WHERE earth_box(
    ll_to_earth(user_lat, user_lng),
    radius_km * 1000.0
  ) @> ll_to_earth(p.latitude, p.longitude)
  AND earth_distance(
    ll_to_earth(p.latitude, p.longitude),
    ll_to_earth(user_lat, user_lng)
  ) < radius_km * 1000.0
  ORDER BY distance_km;
END;
$$;