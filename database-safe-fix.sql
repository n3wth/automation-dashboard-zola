-- Safe Database Fix for Bob - Handles Existing Objects
-- Run this in your Supabase SQL editor

-- 1. Add missing columns to users table (safe with IF NOT EXISTS)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS daily_pro_message_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_pro_reset TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS favorite_models TEXT[] DEFAULT '{}';

-- 2. Create user_keys table (safe with IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.user_keys (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  iv TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, provider)
);

-- Enable RLS (safe - won't error if already enabled)
ALTER TABLE public.user_keys ENABLE ROW LEVEL SECURITY;

-- 3. Create user_preferences table
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

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- 4. Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 5. Add missing columns to chats table
ALTER TABLE public.chats
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

-- 6. Create remaining tables
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

ALTER TABLE public.chat_attachments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- 7. Drop and recreate policies (safe approach)
DROP POLICY IF EXISTS "Users can access own API keys" ON public.user_keys;
CREATE POLICY "Users can access own API keys" ON public.user_keys
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can access own preferences" ON public.user_preferences;
CREATE POLICY "Users can access own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can access own projects" ON public.projects;
CREATE POLICY "Users can access own projects" ON public.projects
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can access own attachments" ON public.chat_attachments;
CREATE POLICY "Users can access own attachments" ON public.chat_attachments
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can access own feedback" ON public.feedback;
CREATE POLICY "Users can access own feedback" ON public.feedback
  FOR ALL USING (auth.uid() = user_id);

-- 8. Update automation user
UPDATE public.users
SET
  daily_pro_message_count = 0,
  daily_pro_reset = NOW(),
  favorite_models = ARRAY['gpt-4o-mini', 'claude-3-haiku']
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 9. Insert default preferences
INSERT INTO public.user_preferences (
  user_id, layout, prompt_suggestions, show_tool_invocations,
  show_conversation_previews, multi_model_enabled, hidden_models
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'fullscreen', true, true, true, false, '{}'
) ON CONFLICT (user_id) DO UPDATE SET
  layout = EXCLUDED.layout,
  updated_at = NOW();

SELECT 'Database schema safely updated! All conflicts resolved.' as status;