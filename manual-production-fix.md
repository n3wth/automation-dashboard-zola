# Manual Production Database Schema Fix

## Issue
The production Supabase database is missing the following columns in the `users` table:
- `daily_pro_message_count` (integer, default 0)
- `daily_pro_reset` (timestamptz, default now())

## Verification
Confirmed by testing API query:
```
Error: column users.daily_pro_message_count does not exist
```

## Solution
Execute the following SQL in the Supabase SQL Editor:

```sql
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

-- Verify the changes
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('daily_pro_message_count', 'daily_pro_reset');
```

## Steps to Execute
1. Go to https://supabase.com/dashboard/project/zktnabjvuphoixwgwwem
2. Navigate to SQL Editor
3. Paste and execute the SQL above
4. Verify that both columns now exist

## Post-Execution Verification
Test the API again to confirm the columns exist:
```bash
curl -X GET 'https://zktnabjvuphoixwgwwem.supabase.co/rest/v1/users?select=daily_pro_message_count,daily_pro_reset&limit=1' \
  -H "apikey: [SERVICE_KEY]" \
  -H "Authorization: Bearer [SERVICE_KEY]"
```

Should return data with both columns instead of an error.