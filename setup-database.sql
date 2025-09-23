-- Essential Bob Database Schema for Automation Dashboard POC
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (essential for authentication)
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
  system_prompt text
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy for users to access their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Chats table (for storing chat conversations)
CREATE TABLE IF NOT EXISTS public.chats (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title text,
  model text,
  system_prompt text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  public boolean DEFAULT false,
  pinned boolean DEFAULT false,
  pinned_at timestamptz
);

-- Enable RLS on chats table
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Policy for chats
CREATE POLICY "Users can access own chats" ON public.chats
  FOR ALL USING (auth.uid() = user_id OR public = true);

-- Messages table (for storing individual messages)
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

-- Enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy for messages
CREATE POLICY "Users can access messages from their chats" ON public.messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND (chats.user_id = auth.uid() OR chats.public = true)
    )
  );

-- Function to automatically create user record
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, anonymous)
  VALUES (NEW.id, NEW.email, false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user record when auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert a default automation user for our POC
INSERT INTO public.users (id, email, display_name, anonymous)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'automation@example.com',
  'Automation Dashboard',
  true
) ON CONFLICT (id) DO NOTHING;

-- Success message
SELECT 'Database schema created successfully! Bob is ready for automation integration.' as status;