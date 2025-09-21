#!/bin/bash

# Deploy Supabase Migrations to Production
# This script applies all pending migrations to the production Supabase database

set -e  # Exit on any error

echo "🚀 Starting Supabase migration deployment to production..."

# Production project reference
PROJECT_REF="zktnabjvuphoixwgwwem"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first."
    echo "Run: brew install supabase/tap/supabase"
    exit 1
fi

# Login to Supabase (if not already logged in)
echo "📝 Checking Supabase authentication..."
supabase login || true

# Link to the production project
echo "🔗 Linking to production project..."
supabase link --project-ref "$PROJECT_REF" || true

# Apply all migrations to production
echo "🗄️ Applying migrations to production database..."
supabase db push

# Verify the migrations were applied
echo "✅ Verifying migration status..."
supabase migration list

echo "✨ Migration deployment complete!"
echo ""
echo "⚠️ Important next steps:"
echo "1. Verify the database schema in Supabase dashboard"
echo "2. Test authentication flow"
echo "3. Check RLS policies are enabled"
echo "4. Verify storage buckets if needed"