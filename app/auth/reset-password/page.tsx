"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClientSafe } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { HeaderGoBack } from "../../components/header-go-back"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user has a valid session for password reset
    async function checkSession() {
      const supabase = createClientSafe()
      if (!supabase) {
        setError("Password reset is not available in dev mode")
        setIsValidSession(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError("Invalid or expired reset link. Please request a new password reset.")
        setIsValidSession(false)
      } else {
        setIsValidSession(true)
      }
    }

    checkSession()
  }, [])

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault()

    if (!password || !confirmPassword) {
      setError("Please fill in both password fields")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    const supabase = createClientSafe()
    if (!supabase) {
      setError("Password reset is not available in dev mode")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) throw updateError

      setSuccess(true)

      // Redirect to home page after 2 seconds
      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (err: unknown) {
      console.error("Error updating password:", err)
      setError(
        (err as Error).message ||
          "Failed to update password. Please try again."
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (isValidSession === null) {
    return (
      <div className="bg-background flex h-dvh w-full flex-col">
        <HeaderGoBack href="/auth" />
        <main className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6">
          <div className="text-center">
            <p className="text-muted-foreground">Verifying reset link...</p>
          </div>
        </main>
      </div>
    )
  }

  if (isValidSession === false) {
    return (
      <div className="bg-background flex h-dvh w-full flex-col">
        <HeaderGoBack href="/auth" />
        <main className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <h1 className="text-foreground text-3xl font-medium tracking-tight sm:text-4xl">
                Reset Link Invalid
              </h1>
              <p className="text-muted-foreground mt-3">
                This password reset link is invalid or has expired.
              </p>
            </div>
            {error && (
              <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                {error}
              </div>
            )}
            <div className="flex justify-center">
              <Button
                onClick={() => router.push("/auth")}
                variant="outline"
              >
                Request New Reset Link
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (success) {
    return (
      <div className="bg-background flex h-dvh w-full flex-col">
        <HeaderGoBack href="/" />
        <main className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <h1 className="text-foreground text-3xl font-medium tracking-tight sm:text-4xl">
                Password Updated
              </h1>
              <p className="text-muted-foreground mt-3">
                Your password has been successfully updated. Redirecting you to the app...
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="bg-background flex h-dvh w-full flex-col">
      <HeaderGoBack href="/auth" />

      <main className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-foreground text-3xl font-medium tracking-tight sm:text-4xl">
              Reset Your Password
            </h1>
            <p className="text-muted-foreground mt-3">
              Enter your new password below.
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-3">
              <Input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
                minLength={6}
              />
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-12"
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              className="w-full text-base"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Updating Password..." : "Update Password"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}