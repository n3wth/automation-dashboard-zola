-- Monitoring queries for pg_cron jobs

-- 1. View all scheduled cron jobs
SELECT
    jobid,
    jobname,
    schedule,
    command,
    active
FROM cron.job
ORDER BY jobname;

-- 2. Check recent job execution history (last 50 runs)
SELECT
    jobid,
    jobname,
    status,
    return_message,
    start_time,
    end_time,
    end_time - start_time AS duration
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 50;

-- 3. Check if keepalive is working (view recent pings)
SELECT * FROM keepalive_pings
ORDER BY ping_time DESC
LIMIT 10;

-- 4. Check job statistics
SELECT
    jobname,
    COUNT(*) as total_runs,
    SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END) as successful_runs,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_runs,
    MAX(start_time) as last_run,
    AVG(EXTRACT(EPOCH FROM (end_time - start_time))) as avg_duration_seconds
FROM cron.job_run_details
GROUP BY jobname
ORDER BY jobname;

-- 5. Check for failed jobs in the last 24 hours
SELECT
    jobname,
    status,
    return_message,
    start_time
FROM cron.job_run_details
WHERE status = 'failed'
    AND start_time > NOW() - INTERVAL '24 hours'
ORDER BY start_time DESC;

-- 6. Verify database is active
SELECT
    datname as database,
    COUNT(*) as active_connections,
    MAX(state_change) as last_activity
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY datname;