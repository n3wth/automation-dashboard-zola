# Deployment Guide

## Prerequisites

- Vercel account
- Supabase project (production)
- API keys for AI services (OpenAI, Anthropic, etc.)

## Environment Variables

Set these environment variables in your Vercel project dashboard:

### Core Configuration
```bash
NODE_ENV=production
```

### Supabase Production
```bash
NEXT_PUBLIC_SUPABASE_URL=https://zktnabjvuphoixwgwwem.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprdG5hYmp2dXBob2l4d2d3d2VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NTMyNTAsImV4cCI6MjA3NDAyOTI1MH0.1TRigT6Yfz5Ny0WnRDrWkoTOYAbCZ1tGr6O395TTbrw
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprdG5hYmp2dXBob2l4d2d3d2VtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQ1MzI1MCwiZXhwIjoyMDc0MDI5MjUwfQ.tg0qkQsQF_A0K4FKl9VwB3T1xJn44wj1BLAh-VcIhSw
```

### Security Keys (Generate these)
```bash
# Generate with: openssl rand -hex 16
CSRF_SECRET=[32-character-random-string]

# Generate with: openssl rand -base64 32
ENCRYPTION_KEY=[base64-encoded-32-bytes]
```

### AI API Keys (Add your own)
```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=...
MISTRAL_API_KEY=...
OPENROUTER_API_KEY=sk-or-...
XAI_API_KEY=...
```

### OAuth Configuration
```bash
GOOGLE_CLIENT_ID=[your-google-oauth-client-id]
GOOGLE_CLIENT_SECRET=[your-google-oauth-client-secret]
```

### Analytics & Monitoring
```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_q39ZGuvXLQuwCgCkHZYAeaUlWm5bIhx2XKMCtTdhJ7o
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_SENTRY_DSN=[your-sentry-dsn]
SENTRY_ORG=[your-sentry-org]
SENTRY_PROJECT=[your-sentry-project]
SENTRY_AUTH_TOKEN=[your-sentry-auth-token]
```

### Additional APIs
```bash
EXA_API_KEY=[your-exa-api-key]
```

### Production URLs
```bash
# Update these after deployment with your actual domain
NEXT_PUBLIC_APP_URL=https://[your-project].vercel.app
NEXTAUTH_URL=https://[your-project].vercel.app
```

### Rate Limiting (Optional)
```bash
UPSTASH_REDIS_REST_URL=[your-upstash-redis-url]
UPSTASH_REDIS_REST_TOKEN=[your-upstash-redis-token]
```

### Development Mode
```bash
NEXT_PUBLIC_DEV_AUTH=false
```

## Deployment Steps

### 1. Database Setup (Already Complete)
Migrations have been applied to the production Supabase database:
- Complete schema for chats, messages, users
- Monitoring tables
- Analytics functions

### 2. Deploy to Vercel

#### Option A: Deploy via CLI
```bash
vercel --prod
```

#### Option B: Deploy via GitHub Integration
1. Connect your GitHub repository to Vercel
2. Vercel will automatically deploy on push to main branch

### 3. Configure Environment Variables
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add all the environment variables listed above
4. Make sure to set them for the Production environment

### 4. Configure OAuth Redirect URLs
In your Google Cloud Console:
1. Add your production URL to authorized JavaScript origins:
   - `https://[your-project].vercel.app`
2. Add callback URL to authorized redirect URIs:
   - `https://[your-project].vercel.app/auth/callback`

In your Supabase dashboard:
1. Go to Authentication → URL Configuration
2. Add your production URL to Site URL:
   - `https://[your-project].vercel.app`
3. Add to Redirect URLs:
   - `https://[your-project].vercel.app/auth/callback`

### 5. Post-Deployment Verification
1. Test the health endpoint: `https://[your-project].vercel.app/api/health`
2. Verify authentication flow works
3. Check monitoring endpoints
4. Test chat functionality
5. Verify PostHog analytics are tracking
6. Check Sentry error reporting (if configured)

## Monitoring

### Health Checks
- Main health endpoint: `/api/health`
- Monitoring endpoints:
  - `/api/monitoring/health`
  - `/api/monitoring/models`
  - `/api/monitoring/usage`

### Analytics
- PostHog dashboard for user analytics
- Sentry for error tracking and performance monitoring
- Supabase dashboard for database metrics

## Troubleshooting

### Common Issues

1. **Authentication not working**
   - Verify OAuth redirect URLs are configured correctly
   - Check Supabase URL and anon key are correct
   - Ensure CSRF_SECRET is set

2. **Database connection errors**
   - Verify SUPABASE_SERVICE_ROLE is correct
   - Check Supabase project is active
   - Ensure migrations were applied successfully

3. **AI features not working**
   - Verify API keys are set correctly
   - Check rate limits on AI services
   - Monitor error logs in Vercel Functions tab

## Security Notes

- Never commit `.env.production` to version control
- Rotate API keys regularly
- Monitor for suspicious activity via Supabase and Vercel dashboards
- Keep dependencies updated