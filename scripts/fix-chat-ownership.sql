-- Script to fix chat ownership
-- Run this in your Supabase SQL editor

-- 1. First, check what user_id the chat currently has
SELECT
  id,
  user_id,
  title,
  created_at
FROM chats
WHERE id = '6acac358-0e13-42c5-817c-cb3130fe659e';

-- 2. Check your actual user ID (when you're logged in)
-- You can find this by checking any of your existing chats
SELECT DISTINCT user_id
FROM chats
WHERE title IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- 3. If the chat exists but has the wrong user_id, update it:
-- Replace 'YOUR_ACTUAL_USER_ID' with your real user ID from step 2
/*
UPDATE chats
SET user_id = 'YOUR_ACTUAL_USER_ID'
WHERE id = '6acac358-0e13-42c5-817c-cb3130fe659e';
*/

-- 4. Verify the update worked
/*
SELECT id, user_id, title
FROM chats
WHERE id = '6acac358-0e13-42c5-817c-cb3130fe659e';
*/