-- Fix user_preferences table and RLS policies
-- This migration ensures the user_preferences and user_keys tables exist with proper RLS

-- Create user_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  layout TEXT DEFAULT 'focused',
  prompt_suggestions BOOLEAN DEFAULT true,
  show_tool_invocations BOOLEAN DEFAULT false,
  multi_model_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_keys table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_keys (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  iv TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, provider)
);

-- Enable RLS on both tables
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_keys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can delete their own preferences" ON public.user_preferences;

DROP POLICY IF EXISTS "Users can view their own keys" ON public.user_keys;
DROP POLICY IF EXISTS "Users can update their own keys" ON public.user_keys;
DROP POLICY IF EXISTS "Users can insert their own keys" ON public.user_keys;
DROP POLICY IF EXISTS "Users can delete their own keys" ON public.user_keys;

-- Create RLS policies for user_preferences
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" ON public.user_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_keys
CREATE POLICY "Users can view their own keys" ON public.user_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own keys" ON public.user_keys
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own keys" ON public.user_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own keys" ON public.user_keys
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_keys_user_id ON public.user_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_keys_provider ON public.user_keys(provider);

-- Update function for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_keys_updated_at ON public.user_keys;
CREATE TRIGGER update_user_keys_updated_at
  BEFORE UPDATE ON public.user_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();