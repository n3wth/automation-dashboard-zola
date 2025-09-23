-- Schema Fix for Bob Dashboard - Missing Tables and Columns
-- Run this in your Supabase SQL editor to fix 500 errors

-- Add missing favorite_models column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS favorite_models jsonb DEFAULT '[]';

-- Create user_keys table for API key management
CREATE TABLE IF NOT EXISTS public.user_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    key_name text NOT NULL,
    encrypted_key text NOT NULL,
    created_at timestamptz DEFAULT now(),
    last_used_at timestamptz,
    is_active boolean DEFAULT true
);

-- Enable RLS on user_keys table
ALTER TABLE public.user_keys ENABLE ROW LEVEL SECURITY;

-- Policy for user_keys - users can only access their own keys
CREATE POLICY "Users can access own API keys" ON public.user_keys
    FOR ALL USING (auth.uid() = user_id);

-- Create user_preferences table for storing user settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    preferences jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS on user_preferences table
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy for user_preferences
CREATE POLICY "Users can access own preferences" ON public.user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Create projects table for user projects/workspaces
CREATE TABLE IF NOT EXISTS public.projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    settings jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS on projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Policy for projects
CREATE POLICY "Users can access own projects" ON public.projects
    FOR ALL USING (auth.uid() = user_id);

-- Update existing automation user with new columns
UPDATE public.users
SET favorite_models = '["gpt-4.1-nano", "gpt-3.5-turbo"]'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Insert default preferences for automation user
INSERT INTO public.user_preferences (user_id, preferences)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '{"theme": "dark", "autoSave": true, "defaultModel": "gpt-4.1-nano"}'
) ON CONFLICT (user_id) DO UPDATE SET
    preferences = EXCLUDED.preferences,
    updated_at = now();

-- Success message
SELECT 'Missing schema elements added successfully! 500 errors should be resolved.' as status;