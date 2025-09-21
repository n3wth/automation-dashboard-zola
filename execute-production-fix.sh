#!/bin/bash

SUPABASE_URL="https://zktnabjvuphoixwgwwem.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprdG5hYmp2dXBob2l4d2d3d2VtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQ1MzI1MCwiZXhwIjoyMDc0MDI5MjUwfQ.tg0qkQsQF_A0K4FKl9VwB3T1xJn44wj1BLAh-VcIhSw"

echo "Checking current users table structure..."

# First, let's check current columns
curl -X GET "${SUPABASE_URL}/rest/v1/users?limit=1" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json"

echo -e "\n\nAdding daily_pro_message_count column..."

# Add daily_pro_message_count column
psql "postgresql://postgres.zktnabjvuphoixwgwwem:${SERVICE_KEY#*:}@aws-0-us-west-1.pooler.supabase.com:6543/postgres" << 'EOF'
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS daily_pro_message_count integer DEFAULT 0;
EOF

echo "Adding daily_pro_reset column..."

# Add daily_pro_reset column
psql "postgresql://postgres.zktnabjvuphoixwgwwem:${SERVICE_KEY#*:}@aws-0-us-west-1.pooler.supabase.com:6543/postgres" << 'EOF'
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS daily_pro_reset timestamptz DEFAULT now();
EOF

echo "Verifying changes..."

# Verify the changes
curl -X GET "${SUPABASE_URL}/rest/v1/users?limit=1" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json"

echo -e "\n\nDone!"