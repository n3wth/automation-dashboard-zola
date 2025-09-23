-- Complete Bob Database Schema
-- Combines initial schema + all required tables and columns

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with ALL required columns
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text,
  anonymous boolean DEFAULT false,
  daily_message_count integer DEFAULT 0,
  daily_reset timestamptz DEFAULT now(),
  display_name text,
  message_count integer DEFAULT 0,
  premium boolean DEFAULT false,
  profile_image text,
  created_at timestamptz DEFAULT now(),
  last_active_at timestamptz DEFAULT now(),
  system_prompt text,
  daily_pro_message_count integer DEFAULT 0,
  daily_pro_reset timestamptz DEFAULT now(),
  favorite_models jsonb DEFAULT '[]'
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies for users
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own projects" ON public.projects
  FOR ALL USING (auth.uid() = user_id);

-- Chats table with all columns
CREATE TABLE IF NOT EXISTS public.chats (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  title text,
  model text,
  system_prompt text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  public boolean DEFAULT false,
  pinned boolean DEFAULT false,
  pinned_at timestamptz
);

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own chats" ON public.chats
  FOR ALL USING (auth.uid() = user_id OR public = true);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id serial PRIMARY KEY,
  chat_id uuid REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  content text,
  role text NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'data')),
  experimental_attachments jsonb,
  parts jsonb,
  created_at timestamptz DEFAULT now(),
  message_group_id text,
  model text
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access messages from their chats" ON public.messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND (chats.user_id = auth.uid() OR chats.public = true)
    )
  );

-- User keys table for BYOK
CREATE TABLE IF NOT EXISTS public.user_keys (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  encrypted_key text NOT NULL,
  iv text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, provider)
);

ALTER TABLE public.user_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own API keys" ON public.user_keys
  FOR ALL USING (auth.uid() = user_id);

-- User preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  layout text DEFAULT 'fullscreen',
  prompt_suggestions boolean DEFAULT true,
  show_tool_invocations boolean DEFAULT true,
  show_conversation_previews boolean DEFAULT true,
  multi_model_enabled boolean DEFAULT false,
  hidden_models text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Chat attachments table
CREATE TABLE IF NOT EXISTS public.chat_attachments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id uuid NOT NULL,
  user_id uuid NOT NULL,
  file_url text NOT NULL,
  file_name text,
  file_type text,
  file_size integer,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fk_chat FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

ALTER TABLE public.chat_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own attachments" ON public.chat_attachments
  FOR ALL USING (auth.uid() = user_id);

-- Feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own feedback" ON public.feedback
  FOR ALL USING (auth.uid() = user_id);

-- Function to automatically create user record
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, anonymous, daily_message_count, daily_pro_message_count)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, 'guest@zola.ai'),
    COALESCE(NEW.email IS NULL, false),
    0,
    0
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user record when auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert automation user with all required fields
INSERT INTO public.users (
  id, email, display_name, anonymous,
  daily_message_count, daily_pro_message_count,
  favorite_models
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'automation@example.com',
  'Automation Dashboard',
  true,
  0,
  0,
  '["gpt-4o-mini", "claude-3-haiku"]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  daily_pro_message_count = 0,
  favorite_models = '["gpt-4o-mini", "claude-3-haiku"]'::jsonb;

-- Insert default preferences for automation user
INSERT INTO public.user_preferences (
  user_id, layout, prompt_suggestions, show_tool_invocations,
  show_conversation_previews, multi_model_enabled, hidden_models
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'fullscreen', true, true, true, false, '{}'
) ON CONFLICT (user_id) DO UPDATE SET
  layout = EXCLUDED.layout,
  updated_at = now();

SELECT 'Complete Bob database schema created successfully!' as status;