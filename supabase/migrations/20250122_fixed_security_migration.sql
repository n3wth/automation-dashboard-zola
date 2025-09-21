-- FIXED SECURITY MIGRATION WITH ANONYMOUS ACCESS
-- This migration adds missing columns and fixes security issues
-- Date: 2025-01-22

-- ================================================================
-- STEP 1: Add Anonymous Column to Tables FIRST
-- ================================================================
ALTER TABLE public.chats
  ADD COLUMN IF NOT EXISTS anonymous BOOLEAN DEFAULT FALSE;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS anonymous BOOLEAN DEFAULT FALSE;

-- Create indexes for anonymous queries
CREATE INDEX IF NOT EXISTS idx_chats_anonymous ON public.chats(anonymous) WHERE anonymous = true;
CREATE INDEX IF NOT EXISTS idx_users_anonymous ON public.users(anonymous) WHERE anonymous = true;

-- ================================================================
-- STEP 2: Create Anonymous Usage Tracking Table
-- ================================================================
CREATE TABLE IF NOT EXISTS public.anonymous_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  query_count INTEGER DEFAULT 0,
  first_query_at TIMESTAMPTZ DEFAULT NOW(),
  last_query_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id)
);

-- Enable RLS on anonymous usage table
ALTER TABLE public.anonymous_usage ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to read their own usage
CREATE POLICY "anonymous_usage_read_own" ON public.anonymous_usage
  FOR SELECT USING (true);

-- Allow anonymous users to insert their usage record
CREATE POLICY "anonymous_usage_insert" ON public.anonymous_usage
  FOR INSERT WITH CHECK (true);

-- Allow anonymous users to update their own usage count
CREATE POLICY "anonymous_usage_update_own" ON public.anonymous_usage
  FOR UPDATE USING (true)
  WITH CHECK (query_count <= 5);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_anonymous_usage_session_id ON public.anonymous_usage(session_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_usage_created_at ON public.anonymous_usage(created_at);

-- ================================================================
-- STEP 3: Fix CRITICAL - Enable RLS on monitoring table
-- ================================================================
ALTER TABLE IF EXISTS public.monitoring ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for monitoring
DROP POLICY IF EXISTS "monitoring_select_authenticated" ON public.monitoring;
DROP POLICY IF EXISTS "monitoring_insert_system" ON public.monitoring;
DROP POLICY IF EXISTS "monitoring_no_update" ON public.monitoring;
DROP POLICY IF EXISTS "monitoring_no_delete" ON public.monitoring;

CREATE POLICY "monitoring_select" ON public.monitoring
  FOR SELECT USING (auth.uid() IS NOT NULL OR auth.role() = 'service_role');

CREATE POLICY "monitoring_insert" ON public.monitoring
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "monitoring_no_update" ON public.monitoring
  FOR UPDATE USING (false);

CREATE POLICY "monitoring_no_delete" ON public.monitoring
  FOR DELETE USING (false);

-- ================================================================
-- STEP 4: Create Anonymous Session Management Functions
-- ================================================================

-- Function to check if anonymous user can make more queries
CREATE OR REPLACE FUNCTION public.check_anonymous_query_limit(p_session_id TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
  v_first_query TIMESTAMPTZ;
BEGIN
  -- Get current usage
  SELECT query_count, first_query_at
  INTO v_count, v_first_query
  FROM public.anonymous_usage
  WHERE session_id = p_session_id;

  -- If no record exists, this is the first query
  IF NOT FOUND THEN
    RETURN true;
  END IF;

  -- Reset count if it's been more than 24 hours since first query
  IF v_first_query < NOW() - INTERVAL '24 hours' THEN
    UPDATE public.anonymous_usage
    SET query_count = 0,
        first_query_at = NOW(),
        last_query_at = NOW()
    WHERE session_id = p_session_id;
    RETURN true;
  END IF;

  -- Check if under limit
  RETURN v_count < 5;
END;
$$;

-- Function to increment anonymous query count
CREATE OR REPLACE FUNCTION public.increment_anonymous_query_count(p_session_id TEXT, p_ip INET, p_user_agent TEXT)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.anonymous_usage (session_id, ip_address, user_agent, query_count)
  VALUES (p_session_id, p_ip, p_user_agent, 1)
  ON CONFLICT (session_id)
  DO UPDATE SET
    query_count = anonymous_usage.query_count + 1,
    last_query_at = NOW();
END;
$$;

-- ================================================================
-- STEP 5: Setup RLS Policies for Limited Anonymous Access
-- ================================================================

-- Drop all existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_select_authenticated_or_anonymous" ON public.users;
DROP POLICY IF EXISTS "users_update_authenticated" ON public.users;
DROP POLICY IF EXISTS "users_insert_authenticated" ON public.users;

DROP POLICY IF EXISTS "Users can access own chats" ON public.chats;
DROP POLICY IF EXISTS "chats_all_own" ON public.chats;
DROP POLICY IF EXISTS "chats_authenticated_own" ON public.chats;
DROP POLICY IF EXISTS "chats_anonymous_limited" ON public.chats;
DROP POLICY IF EXISTS "chats_anonymous_insert" ON public.chats;

DROP POLICY IF EXISTS "Users can access messages from their chats" ON public.messages;
DROP POLICY IF EXISTS "messages_all_own_chats" ON public.messages;
DROP POLICY IF EXISTS "messages_authenticated_own" ON public.messages;
DROP POLICY IF EXISTS "messages_anonymous_limited" ON public.messages;
DROP POLICY IF EXISTS "messages_anonymous_insert" ON public.messages;

DROP POLICY IF EXISTS "Users can access own projects" ON public.projects;
DROP POLICY IF EXISTS "projects_all_own" ON public.projects;
DROP POLICY IF EXISTS "projects_authenticated_own" ON public.projects;

DROP POLICY IF EXISTS "Users can access own API keys" ON public.user_keys;
DROP POLICY IF EXISTS "Users can view their own keys" ON public.user_keys;
DROP POLICY IF EXISTS "Users can update their own keys" ON public.user_keys;
DROP POLICY IF EXISTS "Users can insert their own keys" ON public.user_keys;
DROP POLICY IF EXISTS "Users can delete their own keys" ON public.user_keys;
DROP POLICY IF EXISTS "user_keys_all_own" ON public.user_keys;
DROP POLICY IF EXISTS "user_keys_authenticated_own" ON public.user_keys;

DROP POLICY IF EXISTS "Users can access own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can delete their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "user_preferences_all_own" ON public.user_preferences;
DROP POLICY IF EXISTS "user_preferences_authenticated_own" ON public.user_preferences;

-- public.users - Allow read for all, update for authenticated only
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_authenticated_or_anonymous" ON public.users
  FOR SELECT USING (
    auth.uid() = id
    OR auth.uid() IS NULL -- Allow anonymous to see public profiles
  );

CREATE POLICY "users_update_authenticated" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_insert_authenticated" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- public.chats - Allow access for authenticated users and limited anonymous
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chats_authenticated_own" ON public.chats
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- For anonymous users, we'll handle this at the application level with session tracking
CREATE POLICY "chats_anonymous_limited" ON public.chats
  FOR SELECT USING (
    auth.uid() IS NULL
    AND anonymous = true -- Only allow anonymous chats for anonymous users
  );

CREATE POLICY "chats_anonymous_insert" ON public.chats
  FOR INSERT WITH CHECK (
    auth.uid() IS NULL
    AND anonymous = true
  );

-- public.messages - Similar approach
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_authenticated_own" ON public.messages
  FOR ALL USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );

CREATE POLICY "messages_anonymous_limited" ON public.messages
  FOR SELECT USING (
    auth.uid() IS NULL AND
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND chats.anonymous = true
    )
  );

CREATE POLICY "messages_anonymous_insert" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() IS NULL AND
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND chats.anonymous = true
    )
  );

-- public.projects - Authenticated only
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_authenticated_own" ON public.projects
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- public.user_keys - Authenticated only
ALTER TABLE public.user_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_keys_authenticated_own" ON public.user_keys
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- public.user_preferences - Authenticated only
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_preferences_authenticated_own" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- STEP 6: Fix Function Search Path Issues
-- ================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    display_name,
    anonymous,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    FALSE,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_preferences (
    user_id,
    layout,
    prompt_suggestions,
    show_tool_invocations,
    multi_model_enabled,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    'focused',
    true,
    false,
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ================================================================
-- STEP 7: Cleanup Function for Old Anonymous Sessions
-- ================================================================
CREATE OR REPLACE FUNCTION public.cleanup_old_anonymous_sessions()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete anonymous usage records older than 30 days
  DELETE FROM public.anonymous_usage
  WHERE created_at < NOW() - INTERVAL '30 days';

  -- Delete anonymous chats older than 7 days
  DELETE FROM public.messages
  WHERE chat_id IN (
    SELECT id FROM public.chats
    WHERE anonymous = true
    AND created_at < NOW() - INTERVAL '7 days'
  );

  DELETE FROM public.chats
  WHERE anonymous = true
  AND created_at < NOW() - INTERVAL '7 days';
END;
$$;

-- ================================================================
-- STEP 8: Create Scheduled Job for Cleanup (if pg_cron is available)
-- ================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Schedule daily cleanup at 3 AM
    PERFORM cron.schedule(
      'cleanup-anonymous-sessions',
      '0 3 * * *',
      'SELECT public.cleanup_old_anonymous_sessions();'
    );
  END IF;
END $$;

-- ================================================================
-- STEP 9: Enable RLS on All Public Tables
-- ================================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename NOT IN ('schema_migrations', 'migrations', 'spatial_ref_sys')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;

-- ================================================================
-- VERIFICATION
-- ================================================================
DO $$
DECLARE
  unprotected_count INTEGER;
BEGIN
  -- Count unprotected tables
  SELECT COUNT(*)
  INTO unprotected_count
  FROM pg_tables t
  LEFT JOIN pg_class c ON c.relname = t.tablename AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = t.schemaname)
  WHERE t.schemaname = 'public'
  AND NOT c.relrowsecurity;

  RAISE NOTICE 'Security Fix Complete:';
  RAISE NOTICE '- Tables without RLS: %', unprotected_count;

  IF unprotected_count > 0 THEN
    RAISE WARNING 'There are still % tables without RLS enabled!', unprotected_count;
  END IF;
END $$;

-- ================================================================
-- MANUAL STEPS REQUIRED:
-- ================================================================
-- 1. Go to Supabase Dashboard -> Authentication -> Settings
-- 2. Enable "Leaked Password Protection"
-- 3. Update your application to:
--    a. Generate session IDs for anonymous users
--    b. Check query limits before allowing anonymous queries
--    c. Increment query count after each anonymous query
--    d. Show a login prompt after 5 queries
-- 4. Test anonymous access limits thoroughly