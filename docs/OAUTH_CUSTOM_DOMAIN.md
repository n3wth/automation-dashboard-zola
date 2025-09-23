# Custom Domain OAuth Configuration

This document explains how Bob is configured to use a custom domain (bob.newth.ai) for OAuth flows instead of showing the Supabase URL to users.

## Overview

When users sign in with Google OAuth, they now see `bob.newth.ai` in the redirect URL instead of the long Supabase project URL. This provides a more professional and branded experience.

## Implementation Details

### 1. OAuth Flow Configuration

The OAuth implementation in `lib/api.ts` uses the custom domain:

```typescript
const baseUrl = isDev
  ? "http://localhost:3000"
  : process.env.NEXT_PUBLIC_APP_URL || APP_DOMAIN

const { data, error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: `${baseUrl}/auth/callback`,
  },
})
```

### 2. Callback Handler

The callback route (`app/auth/callback/route.ts`) handles both custom domain and forwarded host headers:

```typescript
const forwardedHost = request.headers.get("x-forwarded-host")
const host = forwardedHost || request.headers.get("host")
const redirectUrl = `${protocol}://${host}${next}`
```

### 3. Supabase Configuration

The `supabase/config.toml` file configures allowed redirect URLs:

```toml
[auth]
site_url = "https://bob.newth.ai"
additional_redirect_urls = [
  "https://bob.newth.ai/**",
  "http://localhost:3000/**",
  "https://*.vercel.app/**"
]
```

### 4. Proxy Routes

The OAuth proxy route (`app/api/auth/[...supabase]/route.ts`) forwards auth requests to Supabase while maintaining the custom domain appearance.

### 5. Vercel Configuration

The `vercel.json` includes redirects for auth endpoints:

```json
{
  "redirects": [
    {
      "source": "/auth/v1/:path*",
      "destination": "https://$NEXT_PUBLIC_SUPABASE_URL/auth/v1/:path*",
      "permanent": false
    }
  ]
}
```

## Setup Instructions

### 1. Environment Variables

Update your `.env.local` file:

```bash
NEXT_PUBLIC_APP_URL=https://bob.newth.ai
NEXT_PUBLIC_SITE_URL=https://bob.newth.ai
```

### 2. Google Cloud Console

Add these redirect URIs to your Google OAuth configuration:

- `https://bob.newth.ai/auth/callback`
- `http://localhost:3000/auth/callback` (for development)

### 3. Supabase Dashboard

In your Supabase project dashboard:

1. Go to Authentication → URL Configuration
2. Set Site URL to `https://bob.newth.ai`
3. Add redirect URLs:
   - `https://bob.newth.ai/**`
   - `http://localhost:3000/**`
   - `https://*.vercel.app/**` (for preview deployments)

### 4. Deploy

Deploy the application with the updated configuration. The OAuth flow will now use your custom domain.

## Benefits

1. **Branded Experience**: Users see your domain throughout the auth flow
2. **Trust**: Custom domain appears more trustworthy than Supabase subdomains
3. **Professional**: Polished appearance for production applications
4. **Consistency**: Maintains domain consistency across the entire user journey

## Architecture Diagram

```
User → bob.newth.ai/auth → Google OAuth
         ↓
Google → bob.newth.ai/auth/callback
         ↓
Callback → Supabase Auth (behind the scenes)
         ↓
User Session Created → Redirect to App
```

## Troubleshooting

### Issue: OAuth redirect not working

**Solution**: Ensure all redirect URLs are whitelisted in both Google Cloud Console and Supabase Dashboard.

### Issue: "Redirect URL mismatch" error

**Solution**: The redirect URL must exactly match what's configured in Google OAuth. Check for trailing slashes and protocol (http vs https).

### Issue: Callback fails in production

**Solution**: Verify that `NEXT_PUBLIC_APP_URL` is set correctly in your production environment variables.

## Security Considerations

- The Supabase project URL is only used server-side
- All OAuth tokens are handled securely through Supabase Auth
- CSRF protection is maintained throughout the flow
- Session cookies are httpOnly and secure in production

## Testing

1. **Local Development**: Test with `http://localhost:3000`
2. **Preview Deployments**: Test with Vercel preview URLs
3. **Production**: Test with `https://bob.newth.ai`

Ensure the OAuth flow works correctly in all environments before deploying to production.