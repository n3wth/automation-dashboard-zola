import { MODEL_DEFAULT } from "@/lib/config"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import { createClient } from "@/lib/supabase/server"
import { createGuestServerClient } from "@/lib/supabase/server-guest"
import { NextResponse } from "next/server"
import { trackEvent, MonitoringEvent } from "@/lib/monitoring"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")
  const next = searchParams.get("next") ?? "/"

  if (!isSupabaseEnabled) {
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent("Supabase is not enabled in this deployment.")}`
    )
  }

  // Handle OAuth errors from provider
  if (error) {
    const errorMessage = errorDescription || error
    console.error("OAuth error:", { error, errorDescription })
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent(`Authentication failed: ${errorMessage}`)}`
    )
  }

  if (!code) {
    // Log additional info for debugging
    console.error("Missing authentication code. Request URL:", request.url)
    console.error("Search params:", Object.fromEntries(searchParams.entries()))

    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent("Missing authentication code. Please ensure Google OAuth is properly configured in Supabase Dashboard.")}`
    )
  }

  const supabase = await createClient()
  const supabaseAdmin = await createGuestServerClient()

  if (!supabase || !supabaseAdmin) {
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent("Supabase is not enabled in this deployment.")}`
    )
  }

  const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

  if (sessionError) {
    console.error("Auth error:", sessionError)
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent(sessionError.message)}`
    )
  }

  const user = data?.user
  if (!user || !user.id || !user.email) {
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent("Missing user info")}`
    )
  }

  try {
    // Try to insert user only if not exists
    const { error: insertError } = await supabaseAdmin.from("users").insert({
      id: user.id,
      email: user.email,
      message_count: 0,
      premium: false,
      favorite_models: [MODEL_DEFAULT],
    } as any)

    if (insertError && insertError.code !== "23505") {
      console.error("Error inserting user:", insertError)
    }
  } catch (err) {
    console.error("Unexpected user insert error:", err)
  }

  // Handle custom domain redirects properly
  const forwardedHost = request.headers.get("x-forwarded-host")
  const host = forwardedHost || request.headers.get("host")
  const protocol = host?.includes("localhost") ? "http" : "https"

  // Use custom domain or forwarded host for redirect
  const redirectUrl = `${protocol}://${host}${next}`

  await trackEvent({
    type: MonitoringEvent.USER_LOGIN,
    userId: user.id,
  })

  return NextResponse.redirect(redirectUrl)
}
