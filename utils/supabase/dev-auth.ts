// Development-only authentication bypass
// This file provides a simple auth solution for local development

export const DEV_USER = {
  id: 'dev-user-123',
  email: 'dev@localhost',
  user_metadata: {
    full_name: 'Dev User',
    avatar_url: 'https://avatars.githubusercontent.com/u/0?v=4'
  }
}

export function isDevMode() {
  return process.env.NODE_ENV === 'development' &&
         process.env.NEXT_PUBLIC_DEV_AUTH === 'true'
}

export function getDevSession() {
  if (!isDevMode()) return null

  return {
    user: DEV_USER,
    access_token: 'dev-token',
    refresh_token: 'dev-refresh',
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    token_type: 'bearer'
  }
}