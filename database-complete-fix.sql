-- Complete Database Fix for Bob - All Missing Columns and Tables
-- Run this in your Supabase SQL editor to fix all errors

-- 1. Add ALL missing columns to users table that are referenced in the code
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS daily_pro_message_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_pro_reset TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS favorite_models TEXT[] DEFAULT '{}';

-- 2. Create user_keys table for BYOK functionality (exact schema from INSTALL.md)
CREATE TABLE IF NOT EXISTS public.user_keys (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  iv TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, provider)
);

-- Enable RLS on user_keys
ALTER TABLE public.user_keys ENABLE ROW LEVEL SECURITY;

-- Policy for user_keys
CREATE POLICY "Users can access own API keys" ON public.user_keys
  FOR ALL USING (auth.uid() = user_id);

-- 3. Create user_preferences table (exact schema from INSTALL.md)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  layout TEXT DEFAULT 'fullscreen',
  prompt_suggestions BOOLEAN DEFAULT true,
  show_tool_invocations BOOLEAN DEFAULT true,
  show_conversation_previews BOOLEAN DEFAULT true,
  multi_model_enabled BOOLEAN DEFAULT false,
  hidden_models TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy for user_preferences
CREATE POLICY "Users can access own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- 4. Create projects table (exact schema from INSTALL.md)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Enable RLS on projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Policy for projects
CREATE POLICY "Users can access own projects" ON public.projects
  FOR ALL USING (auth.uid() = user_id);

-- 5. Add missing columns to chats table
ALTER TABLE public.chats
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

-- 6. Create chat_attachments table (exact schema from INSTALL.md)
CREATE TABLE IF NOT EXISTS public.chat_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL,
  user_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_chat FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Enable RLS on chat_attachments
ALTER TABLE public.chat_attachments ENABLE ROW LEVEL SECURITY;

-- Policy for chat_attachments
CREATE POLICY "Users can access own attachments" ON public.chat_attachments
  FOR ALL USING (auth.uid() = user_id);

-- 7. Create feedback table (exact schema from INSTALL.md)
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Enable RLS on feedback
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Policy for feedback
CREATE POLICY "Users can access own feedback" ON public.feedback
  FOR ALL USING (auth.uid() = user_id);

-- 8. Create trigger for user_preferences updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_timestamp
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE PROCEDURE update_user_preferences_updated_at();

-- 9. Update automation user with all new columns
UPDATE public.users
SET
  daily_pro_message_count = 0,
  daily_pro_reset = NOW(),
  favorite_models = ARRAY['gpt-4o-mini', 'claude-3-haiku']
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 10. Insert default preferences for automation user
INSERT INTO public.user_preferences (
  user_id,
  layout,
  prompt_suggestions,
  show_tool_invocations,
  show_conversation_previews,
  multi_model_enabled,
  hidden_models
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'fullscreen',
  true,
  true,
  true,
  false,
  '{}'
) ON CONFLICT (user_id) DO UPDATE SET
  layout = EXCLUDED.layout,
  updated_at = NOW();

-- 11. Fix guest user insertion policy (allow anonymous signups to create users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, anonymous)
  VALUES (NEW.id, COALESCE(NEW.email, 'guest@zola.ai'), COALESCE(NEW.email IS NULL, false))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
SELECT 'Complete database schema fix applied! All missing tables and columns added.' as status;