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
