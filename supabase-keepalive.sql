-- Enable pg_cron extension (run in SQL Editor in Supabase Dashboard)
-- Note: You may need to enable this in the Extensions page first

-- 1. Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Grant usage to pg_cron schema
GRANT USAGE ON SCHEMA cron TO postgres;

-- 3. Create a simple keepalive job that runs every 30 minutes
-- This queries a small table to keep the database active
SELECT cron.schedule(
    'keepalive-job',           -- Job name
    '*/30 * * * *',            -- Every 30 minutes
    $$SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active';$$
);

-- Alternative: Create a dedicated keepalive table with timestamp logging
CREATE TABLE IF NOT EXISTS keepalive_pings (
    id SERIAL PRIMARY KEY,
    ping_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active'
);

-- Schedule job to insert a ping record every 30 minutes and clean old records
SELECT cron.schedule(
    'keepalive-ping-job',      -- Job name
    '*/30 * * * *',            -- Every 30 minutes
    $$
    INSERT INTO keepalive_pings (ping_time) VALUES (NOW());
    -- Keep only last 100 pings to avoid table bloat
    DELETE FROM keepalive_pings
    WHERE id NOT IN (
        SELECT id FROM keepalive_pings
        ORDER BY ping_time DESC
        LIMIT 100
    );
    $$
);

-- Optional: Add a daily cleanup job for any other maintenance
SELECT cron.schedule(
    'daily-cleanup',           -- Job name
    '0 2 * * *',              -- Daily at 2 AM
    $$
    -- Clean up old keepalive records (keep last 7 days)
    DELETE FROM keepalive_pings
    WHERE ping_time < NOW() - INTERVAL '7 days';

    -- You can add other maintenance tasks here
    VACUUM ANALYZE;
    $$
);

-- View all scheduled jobs
SELECT * FROM cron.job;

-- To unschedule a job (if needed):
-- SELECT cron.unschedule('keepalive-job');
-- SELECT cron.unschedule('keepalive-ping-job');
-- SELECT cron.unschedule('daily-cleanup');