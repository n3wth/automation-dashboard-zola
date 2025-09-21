-- Production Schema Fix - Add Missing Columns
-- This adds the daily_pro_message_count and daily_pro_reset columns to the users table

-- Add missing columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS daily_pro_message_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_pro_reset TIMESTAMPTZ DEFAULT NOW();

-- Update the handle_new_user function to include the new columns
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

SELECT 'Production schema fix completed successfully!' as status;