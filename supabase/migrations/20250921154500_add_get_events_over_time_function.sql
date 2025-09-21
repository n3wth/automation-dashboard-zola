CREATE OR REPLACE FUNCTION get_events_over_time()
RETURNS TABLE(hour TIMESTAMPTZ, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    date_trunc('hour', m.created_at) as hour,
    COUNT(m.id) as count
  FROM
    monitoring m
  WHERE
    m.created_at >= now() - interval '24 hours'
  GROUP BY
    hour
  ORDER BY
    hour;
END;
$$ LANGUAGE plpgsql;
