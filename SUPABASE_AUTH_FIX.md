# Supabase Google OAuth Configuration Fix

## The Problem
Users (like Evan) are getting "Missing authentication code" error when trying to sign in with Gmail.

## Root Cause
The OAuth callback is not receiving the `code` parameter from Google, which means the redirect URL configuration is mismatched between Google OAuth, Supabase, and your Vercel deployment.

## Required Configuration

### 1. In Supabase Dashboard
Go to your Supabase project dashboard (https://supabase.com/dashboard/project/zktnabjvuphoixwgwwem):

1. Navigate to **Authentication** → **Providers** → **Google**
2. Make sure Google is **enabled**
3. Add these **Authorized redirect URIs**:
   ```
   https://zktnabjvuphoixwgwwem.supabase.co/auth/v1/callback
   https://bob.newth.ai/auth/callback
   http://localhost:3000/auth/callback
   ```

### 2. In Google Cloud Console
Go to Google Cloud Console (https://console.cloud.google.com/):

1. Select your project
2. Go to **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 Client ID
4. Add these **Authorized redirect URIs**:
   ```
   https://[YOUR-SUPABASE-PROJECT].supabase.co/auth/v1/callback
   ```
5. Add these **Authorized JavaScript origins**:
   ```
   https://bob.newth.ai
   http://localhost:3000
   ```

### 3. Copy Client ID and Secret to Supabase
In Supabase Dashboard under Google provider settings, ensure:
- **Client ID**: Your Google OAuth Client ID from Google Console
- **Client Secret**: Your Google OAuth Client Secret from Google Console
- **Skip nonce checks**: Leave UNCHECKED (disabled) for better security

## Testing the Fix
1. Clear browser cookies for the domain
2. Try signing in with Google again
3. The flow should be:
   - Click "Sign in with Google"
   - Redirected to Google
   - After authorization, redirected to Supabase callback
   - Supabase redirects to your app's `/auth/callback` with the code
   - Successfully authenticated

## Additional Notes
- The error occurs because Google is not redirecting back with the authorization code
- This typically happens when the redirect URI doesn't match exactly what's configured
- The Supabase callback URL must be added to Google OAuth settings
- Make sure there are no trailing slashes in the URLs