import { updateSession } from "@/utils/supabase/middleware"
import { type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)

  // CSRF protection for state-changing requests (temporarily disabled)
  // TODO: Re-enable CSRF protection after fixing token generation
  // if (["POST", "PUT", "DELETE"].includes(request.method) && process.env.NODE_ENV !== 'development') {
  //   const csrfCookie = request.cookies.get("csrf_token")?.value
  //   const headerToken = request.headers.get("x-csrf-token")

  //   if (!csrfCookie || !headerToken || !(await validateCsrfToken(headerToken))) {
  //     return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
  //   }
  // }

  // CSP for development and production
  const isDev = process.env.NODE_ENV === "development"

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseDomain = supabaseUrl ? new URL(supabaseUrl).origin : ""

  const buildCsp = (directives: Record<string, string[]>) =>
    Object.entries(directives)
      .map(
        ([directive, values]) =>
          `${directive} ${values.filter((value) => Boolean(value)).join(" ")}`,
      )
      .join("; ")
      .concat(";")

  const commonScriptSrc = [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    "https://cdnjs.cloudflare.com",
    "https://assets.onedollarstats.com",
    "https://va.vercel-scripts.com",
  ]

  const commonConnectSrc = [
    "'self'",
    "wss:",
    "https://api.openai.com",
    "https://api.mistral.ai",
    "https://api.supabase.com",
    supabaseDomain,
    "https://api.github.com",
    "https://collector.onedollarstats.com",
    "https://va.vercel-analytics.com",
    "https://vitals.vercel-insights.com",
  ]

  const devDirectives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": commonScriptSrc,
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "font-src": ["'self'", "https://fonts.gstatic.com"],
    "img-src": ["'self'", "data:", "https:", "blob:"],
    "connect-src": [...commonConnectSrc],
  }

  const prodDirectives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      ...commonScriptSrc,
      "https://analytics.umami.is",
      "https://vercel.live",
      "https://us-assets.i.posthog.com",
    ],
    "frame-src": ["'self'", "https://vercel.live"],
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "font-src": ["'self'", "https://fonts.gstatic.com"],
    "img-src": ["'self'", "data:", "https:", "blob:"],
    "connect-src": [
      ...commonConnectSrc,
      "https://api-gateway.umami.dev",
      "https://us.i.posthog.com",
      "https://us-assets.i.posthog.com",
    ],
  }

  response.headers.set(
    "Content-Security-Policy",
    buildCsp(isDev ? devDirectives : prodDirectives),
  )

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
