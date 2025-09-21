-- CRITICAL SECURITY FIX MIGRATION
-- This migration addresses all security issues identified by Supabase linter
-- Date: 2025-01-22

-- ================================================================
-- STEP 1: FIX CRITICAL - Enable RLS on monitoring table
-- ================================================================
ALTER TABLE IF EXISTS public.monitoring ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own monitoring data" ON public.monitoring;
DROP POLICY IF EXISTS "System can insert monitoring data" ON public.monitoring;
DROP POLICY IF EXISTS "No updates allowed" ON public.monitoring;
DROP POLICY IF EXISTS "No deletes allowed" ON public.monitoring;

-- Create strict RLS policies for monitoring table
CREATE POLICY "monitoring_select_authenticated" ON public.monitoring
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "monitoring_insert_system" ON public.monitoring
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "monitoring_no_update" ON public.monitoring
  FOR UPDATE USING (false);

CREATE POLICY "monitoring_no_delete" ON public.monitoring
  FOR DELETE USING (false);

-- ================================================================
-- STEP 2: Fix ALL Anonymous Access Policies
-- Remove anonymous access from all tables
-- ================================================================

-- Fix auth.users table
DROP POLICY IF EXISTS "Users can update own profile" ON auth.users;
DROP POLICY IF EXISTS "Users can view own profile" ON auth.users;

-- Fix public.users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Fix public.chats table
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access own chats" ON public.chats;

CREATE POLICY "chats_all_own" ON public.chats
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fix public.messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access messages from their chats" ON public.messages;

CREATE POLICY "messages_all_own_chats" ON public.messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );

-- Fix public.projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access own projects" ON public.projects;

CREATE POLICY "projects_all_own" ON public.projects
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fix public.user_keys table
ALTER TABLE public.user_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access own API keys" ON public.user_keys;
DROP POLICY IF EXISTS "Users can view their own keys" ON public.user_keys;
DROP POLICY IF EXISTS "Users can update their own keys" ON public.user_keys;
DROP POLICY IF EXISTS "Users can insert their own keys" ON public.user_keys;
DROP POLICY IF EXISTS "Users can delete their own keys" ON public.user_keys;

CREATE POLICY "user_keys_all_own" ON public.user_keys
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fix public.user_preferences table
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can delete their own preferences" ON public.user_preferences;

CREATE POLICY "user_preferences_all_own" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- STEP 3: Fix Function Search Path Issues
-- ================================================================

-- Fix handle_new_user function with explicit search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert into public.users table
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

  -- Create default preferences
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

-- Fix get_events_over_time function if it exists
DO $$
BEGIN
  -- Check if function exists and recreate with search_path
  IF EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name = 'get_events_over_time'
  ) THEN
    -- Drop and recreate with proper search_path
    DROP FUNCTION IF EXISTS public.get_events_over_time CASCADE;

    CREATE OR REPLACE FUNCTION public.get_events_over_time()
    RETURNS TABLE(event_time timestamp, event_count bigint)
    SECURITY DEFINER
    SET search_path = public
    LANGUAGE sql
    AS $$
      SELECT
        date_trunc('hour', created_at) as event_time,
        count(*) as event_count
      FROM public.monitoring
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY event_time
      ORDER BY event_time;
    $$;
  END IF;
END $$;

-- ================================================================
-- STEP 4: Enable RLS on ALL Public Tables
-- ================================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Enable RLS on all public tables
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename NOT IN ('schema_migrations', 'migrations', 'spatial_ref_sys')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
    RAISE NOTICE 'Enabled RLS on table: public.%', r.tablename;
  END LOOP;
END $$;

-- ================================================================
-- STEP 5: Create Missing Indexes for Performance
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_monitoring_created_at ON public.monitoring(created_at);
CREATE INDEX IF NOT EXISTS idx_monitoring_user_id ON public.monitoring(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_anonymous ON public.users(anonymous);

CREATE INDEX IF NOT EXISTS idx_chats_user_id_created_at ON public.chats(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id_created_at ON public.messages(chat_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_projects_user_id_updated_at ON public.projects(user_id, updated_at DESC);

-- ================================================================
-- STEP 6: Verify and Report
-- ================================================================
DO $$
DECLARE
  unprotected_count INTEGER;
  anonymous_policies_count INTEGER;
BEGIN
  -- Count unprotected tables
  SELECT COUNT(*)
  INTO unprotected_count
  FROM pg_tables t
  LEFT JOIN pg_class c ON c.relname = t.tablename AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = t.schemaname)
  WHERE t.schemaname = 'public'
  AND NOT c.relrowsecurity;

  -- Count policies that might allow anonymous access
  SELECT COUNT(*)
  INTO anonymous_policies_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND qual NOT LIKE '%auth.uid()%';

  RAISE NOTICE 'Security Fix Summary:';
  RAISE NOTICE '- Tables without RLS: %', unprotected_count;
  RAISE NOTICE '- Policies without auth.uid() check: %', anonymous_policies_count;

  IF unprotected_count > 0 THEN
    RAISE WARNING 'There are still % tables without RLS enabled!', unprotected_count;
  END IF;
END $$;

-- ================================================================
-- MANUAL STEPS REQUIRED:
-- ================================================================
-- 1. Go to Supabase Dashboard -> Authentication -> Settings
-- 2. Enable "Leaked Password Protection"
-- 3. Review and test all RLS policies to ensure they work correctly
-- 4. Monitor the application for any access issues after migration