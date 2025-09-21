import { updateSession } from "@/utils/supabase/middleware"
import { NextResponse, type NextRequest } from "next/server"
import { validateCsrfToken } from "./lib/csrf"

// Development/Test user validation for API routes
function validateDevUser(request: NextRequest): boolean {
  const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
  if (!isDevOrTest) {
    return false
  }

  const devUserId = request.headers.get('x-dev-user-id')
  const devMode = request.headers.get('x-development-mode')

  if (!devUserId || !devMode || devMode !== 'true') {
    return false
  }

  // Valid dev/test user IDs
  const validDevUsers = [
    'dev-guest-001',
    'dev-free-001',
    'dev-pro-001',
    'dev-admin-001',
    'test-user-001', // Test environment user
    'playwright-test-user' // E2E test user
  ]

  return (devUserId.startsWith('dev-') || devUserId.startsWith('test-') || devUserId.startsWith('playwright-')) &&
         validDevUsers.includes(devUserId)
}

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)

  // Development user authentication bridge for API routes
  if (request.nextUrl.pathname.startsWith('/api/') && validateDevUser(request)) {
    const devUserId = request.headers.get('x-dev-user-id')!
    const devRole = request.headers.get('x-dev-user-role') || 'guest'

    // Add dev user info to headers for API routes
    response.headers.set('x-forwarded-dev-user', devUserId)
    response.headers.set('x-forwarded-dev-role', devRole)
    response.headers.set('x-development-mode', 'true')
  }

  // CSRF protection for state-changing requests (disabled in dev)
  if (["POST", "PUT", "DELETE"].includes(request.method) && process.env.NODE_ENV !== 'development') {
    const csrfCookie = request.cookies.get("csrf_token")?.value
    const headerToken = request.headers.get("x-csrf-token")

    if (!csrfCookie || !headerToken || !(await validateCsrfToken(headerToken))) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
    }
  }

  // CSP for development and production
  const isDev = process.env.NODE_ENV === "development"

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseDomain = supabaseUrl ? new URL(supabaseUrl).origin : ""

  response.headers.set(
    "Content-Security-Policy",
    isDev
      ? `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://assets.onedollarstats.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; connect-src 'self' wss: https://api.openai.com https://api.mistral.ai https://api.supabase.com ${supabaseDomain} https://api.github.com https://collector.onedollarstats.com;`
      : `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://analytics.umami.is https://vercel.live https://assets.onedollarstats.com https://us-assets.i.posthog.com; frame-src 'self' https://vercel.live; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' wss: https://api.openai.com https://api.mistral.ai https://api.supabase.com ${supabaseDomain} https://api-gateway.umami.dev https://api.github.com https://collector.onedollarstats.com https://us.i.posthog.com https://us-assets.i.posthog.com;`
  )

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
