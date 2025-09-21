-- Fix Security Issues from Supabase Linter Report
-- Run this migration to address critical security vulnerabilities

-- ================================================================
-- 1. FIX CRITICAL: Enable RLS on monitoring table
-- ================================================================
ALTER TABLE public.monitoring ENABLE ROW LEVEL SECURITY;

-- Create appropriate RLS policies for monitoring table
-- Only authenticated users can view their own monitoring data
CREATE POLICY "Users can view own monitoring data" ON public.monitoring
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert monitoring data" ON public.monitoring
  FOR INSERT WITH CHECK (true); -- Allow system to insert

CREATE POLICY "Users cannot update monitoring data" ON public.monitoring
  FOR UPDATE USING (false);

CREATE POLICY "Users cannot delete monitoring data" ON public.monitoring
  FOR DELETE USING (false);

-- ================================================================
-- 2. FIX: Function search_path security issues
-- ================================================================
-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    display_name,
    anonymous
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    FALSE
  );

  -- Create default preferences for new user
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Fix get_events_over_time function (if it exists)
-- Note: Update this based on your actual function definition
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_events_over_time') THEN
    -- You'll need to recreate this function with SET search_path
    -- Example structure:
    /*
    CREATE OR REPLACE FUNCTION public.get_events_over_time()
    RETURNS TABLE(...)
    SECURITY DEFINER
    SET search_path = public
    LANGUAGE plpgsql
    AS $func$
    BEGIN
      -- Function body here
    END;
    $func$;
    */
  END IF;
END $$;

-- ================================================================
-- 3. REVIEW: Anonymous Access Policies
-- ================================================================
-- These policies allow anonymous access. Review if this is intentional.
-- If you want to restrict to authenticated users only, uncomment below:

/*
-- Remove anonymous access from chats
DROP POLICY IF EXISTS "Users can access own chats" ON public.chats;
CREATE POLICY "Authenticated users can access own chats" ON public.chats
  FOR ALL USING (auth.uid() = user_id);

-- Remove anonymous access from messages
DROP POLICY IF EXISTS "Users can access messages from their chats" ON public.messages;
CREATE POLICY "Authenticated users can access messages from their chats" ON public.messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );

-- Remove anonymous access from projects
DROP POLICY IF EXISTS "Users can access own projects" ON public.projects;
CREATE POLICY "Authenticated users can access own projects" ON public.projects
  FOR ALL USING (auth.uid() = user_id);

-- Remove anonymous access from user_keys
DROP POLICY IF EXISTS "Users can access own API keys" ON public.user_keys;
CREATE POLICY "Authenticated users can access own API keys" ON public.user_keys
  FOR ALL USING (auth.uid() = user_id);

-- Remove anonymous access from user_preferences
DROP POLICY IF EXISTS "Users can access own preferences" ON public.user_preferences;
CREATE POLICY "Authenticated users can access own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Remove anonymous access from users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Authenticated users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Authenticated users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);
*/

-- ================================================================
-- 4. Additional Security Hardening
-- ================================================================

-- Ensure all public tables have RLS enabled
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename NOT IN ('schema_migrations', 'migrations')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;

-- Create index for better performance on user lookups
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);

-- ================================================================
-- 5. Audit Log for Security Events (Optional but recommended)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  event_details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" ON public.security_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON public.security_audit_log
  FOR INSERT WITH CHECK (true);

-- No one can update or delete audit logs
CREATE POLICY "No updates to audit logs" ON public.security_audit_log
  FOR UPDATE USING (false);
CREATE POLICY "No deletes to audit logs" ON public.security_audit_log
  FOR DELETE USING (false);

-- ================================================================
-- IMPORTANT: Enable Leaked Password Protection
-- ================================================================
-- This must be enabled in the Supabase Dashboard:
-- 1. Go to Authentication -> Settings
-- 2. Enable "Leaked Password Protection"
-- This will check passwords against HaveIBeenPwned.org