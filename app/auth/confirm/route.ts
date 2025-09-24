import type { EmailOtpType } from "@supabase/auth-js"
import { trackEvent, MonitoringEvent } from "@/lib/monitoring"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import { createClient } from "@/lib/supabase/server"
import { createGuestServerClient } from "@/lib/supabase/server-guest"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type")
  const next = searchParams.get("next") ?? "/"
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  if (!isSupabaseEnabled) {
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent("Supabase is not enabled in this deployment.")}`
    )
  }

  // Handle email confirmation errors
  if (error) {
    const errorMessage = errorDescription || error
    console.error("Email confirmation error:", { error, errorDescription, type })

    let userMessage = "Email confirmation failed"
    if (error === "email_not_confirmed") {
      userMessage = "Please check your email and click the confirmation link"
    } else if (error === "token_expired") {
      userMessage = "The confirmation link has expired. Please request a new one"
    } else if (error === "invalid_token") {
      userMessage = "Invalid confirmation link. Please request a new one"
    } else {
      userMessage = `Confirmation failed: ${errorMessage}`
    }

    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent(userMessage)}`
    )
  }

  if (!tokenHash || !type) {
    console.error("Missing token_hash or type parameter:", { tokenHash: !!tokenHash, type })
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent("Invalid confirmation link. Missing required parameters.")}`
    )
  }

  if (!isEmailOtpType(type)) {
    console.error("Unsupported email confirmation type:", type)
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent("Invalid confirmation type in confirmation link.")}`
    )
  }

  const supabase = await createClient()
  const supabaseAdmin = await createGuestServerClient()

  if (!supabase || !supabaseAdmin) {
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent("Supabase is not enabled in this deployment.")}`
    )
  }

  try {
    // Verify the email confirmation token
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    })

    if (verifyError) {
      console.error("Email verification error:", verifyError)

      let userMessage = "Email verification failed"
      if (verifyError.message.includes("expired")) {
        userMessage = "The confirmation link has expired. Please request a new one"
      } else if (verifyError.message.includes("invalid")) {
        userMessage = "Invalid confirmation link. Please try signing up again"
      } else {
        userMessage = `Verification failed: ${verifyError.message}`
      }

      return NextResponse.redirect(
        `${origin}/auth/error?message=${encodeURIComponent(userMessage)}`
      )
    }

    const user = data?.user
    if (!user || !user.id || !user.email) {
      return NextResponse.redirect(
        `${origin}/auth/error?message=${encodeURIComponent("Missing user information after verification")}`
      )
    }

    // Handle different confirmation types
    if (type === "signup" || type === "email") {
      // Email signup confirmation - user record is automatically created by database trigger
      await trackEvent({
        type: MonitoringEvent.USER_LOGIN,
        userId: user.id,
      })
    } else if (type === "recovery") {
      // Password recovery - user already exists, just track the login
      await trackEvent({
        type: MonitoringEvent.USER_LOGIN,
        userId: user.id,
      })
    }

    // Handle custom domain redirects properly
    const forwardedHost = request.headers.get("x-forwarded-host")
    const host = forwardedHost || request.headers.get("host")
    const protocol = host?.includes("localhost") ? "http" : "https"

    // Determine redirect URL based on confirmation type
    let redirectPath = next
    if (type === "recovery") {
      // For password recovery, redirect to a password reset page
      redirectPath = "/auth/reset-password"
    } else if (type === "signup" || type === "email") {
      // For signup confirmation, redirect to home or onboarding
      redirectPath = next.includes("/auth") ? "/" : next
    }

    const redirectUrl = `${protocol}://${host}${redirectPath}`

    console.log("Email confirmation successful:", {
      type,
      userId: user.id,
      redirectUrl
    })

    return NextResponse.redirect(redirectUrl)
  } catch (err) {
    console.error("Unexpected email confirmation error:", err)
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent("An unexpected error occurred during confirmation")}`
    )
  }
}
const EMAIL_OTP_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]

const isEmailOtpType = (value: string): value is EmailOtpType =>
  EMAIL_OTP_TYPES.includes(value as EmailOtpType)
