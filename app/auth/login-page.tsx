"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { signInWithGoogle } from "@/lib/api"
import { createClient } from "@/lib/supabase/client"
import { createClientSafe } from "@/lib/supabase/client"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { HeaderGoBack } from "../components/header-go-back"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [emailLoading, setEmailLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const router = useRouter()

  async function handleSignInWithGoogle() {
    const supabase = createClient()

    if (!supabase) {
      throw new Error("Supabase is not configured")
    }

    try {
      setIsLoading(true)
      setError(null)

      const data = await signInWithGoogle(supabase)

      if (data?.url) {
        window.location.href = data.url
      }
    } catch (err: unknown) {
      console.error("Error signing in with Google:", err)
      setError(
        (err as Error).message ||
          "An unexpected error occurred. Please try again."
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()

    if (!email || !password) {
      setError("Email and password are required")
      return
    }

    const supabase = createClientSafe()
    if (!supabase) {
      setError("Authentication is not available in dev mode")
      return
    }

    try {
      setEmailLoading(true)
      setError(null)

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        setError(null)
        // Show success message for email confirmation
        setError("Check your email for a confirmation link")
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push("/")
      }
    } catch (err: unknown) {
      console.error(`Error ${isSignUp ? 'signing up' : 'signing in'}:`, err)
      setError(
        (err as Error).message ||
          `Failed to ${isSignUp ? 'create account' : 'sign in'}. Please try again.`
      )
    } finally {
      setEmailLoading(false)
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()

    if (!email) {
      setError("Please enter your email address")
      return
    }

    const supabase = createClientSafe()
    if (!supabase) {
      setError("Password reset is not available in dev mode")
      return
    }

    try {
      setResetLoading(true)
      setError(null)

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      setError("Check your email for a password reset link")
    } catch (err: unknown) {
      console.error("Error sending password reset:", err)
      setError(
        (err as Error).message ||
          "Failed to send password reset email. Please try again."
      )
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="bg-background flex h-dvh w-full flex-col">
      <HeaderGoBack href="/" />

      <main className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-foreground text-3xl font-medium tracking-tight sm:text-4xl">
              Welcome to Bob
            </h1>
            <p className="text-muted-foreground mt-3">
              {isForgotPassword
                ? "Enter your email to receive a password reset link"
                : isSignUp
                ? "Create an account to get started"
                : "Sign in below to increase your message limits."}
            </p>
          </div>
          {error && (
            <div className={`rounded-md p-3 text-sm ${
              error.includes("Check your email")
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-destructive/10 text-destructive"
            }`}>
              {error}
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={isForgotPassword ? handleForgotPassword : handleEmailAuth} className="space-y-4">
            <div className="space-y-3">
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
              {!isForgotPassword && (
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12"
                  minLength={6}
                />
              )}
            </div>
            <Button
              type="submit"
              className="w-full text-base"
              size="lg"
              disabled={isForgotPassword ? resetLoading : emailLoading}
            >
              {isForgotPassword
                ? (resetLoading ? "Sending Reset Link..." : "Send Reset Link")
                : (emailLoading ? "Processing..." : (isSignUp ? "Create Account" : "Sign In"))}
            </Button>
          </form>

          {/* Navigation between modes */}
          <div className="text-center space-y-2">
            {!isForgotPassword ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setError(null)
                    setEmail("")
                    setPassword("")
                  }}
                  className="block text-sm text-muted-foreground hover:text-foreground underline mx-auto"
                >
                  {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                </button>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true)
                      setError(null)
                      setPassword("")
                    }}
                    className="block text-sm text-muted-foreground hover:text-foreground underline mx-auto"
                  >
                    Forgot your password?
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false)
                  setError(null)
                  setEmail("")
                  setPassword("")
                }}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                Back to sign in
              </button>
            )}
          </div>

          {/* Divider - only show if not in forgot password mode */}
          {!isForgotPassword && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
          )}

          {/* Google Login - only show if not in forgot password mode */}
          {!isForgotPassword && (
            <div className="space-y-3">
              <Button
                variant="secondary"
                className="w-full text-base sm:text-base"
                size="lg"
                onClick={handleSignInWithGoogle}
                disabled={isLoading}
              >
                <img
                  src="https://www.google.com/favicon.ico"
                  alt="Google logo"
                  width={20}
                  height={20}
                  className="mr-2 size-4"
                />
                <span>
                  {isLoading ? "Connecting..." : "Google"}
                </span>
              </Button>
            </div>
          )}
        </div>
      </main>

      <footer className="text-muted-foreground py-6 text-center text-sm">
        <p>
          By continuing, you agree to our{" "}
          <Link href="/" className="text-foreground hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/" className="text-foreground hover:underline">
            Privacy Policy
          </Link>
        </p>
      </footer>
    </div>
  )
}
