-- Fix production Supabase database schema
-- Add missing columns to users table

-- Add daily_pro_message_count column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'daily_pro_message_count'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users
        ADD COLUMN daily_pro_message_count integer DEFAULT 0;

        RAISE NOTICE 'Added daily_pro_message_count column to users table';
    ELSE
        RAISE NOTICE 'daily_pro_message_count column already exists';
    END IF;
END $$;

-- Add daily_pro_reset column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'daily_pro_reset'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users
        ADD COLUMN daily_pro_reset timestamptz DEFAULT now();

        RAISE NOTICE 'Added daily_pro_reset column to users table';
    ELSE
        RAISE NOTICE 'daily_pro_reset column already exists';
    END IF;
END $$;

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