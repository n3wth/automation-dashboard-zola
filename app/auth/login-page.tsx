"use client"

import { Button } from "@/components/ui/button"
import { signInWithGoogle } from "@/lib/api"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { HeaderGoBack } from "../components/header-go-back"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Dev mode login handler
  async function handleDevLogin(userType: 'admin' | 'pro' | 'free' | 'guest') {
    if (process.env.NODE_ENV !== 'development') return

    setIsLoading(true)

    // Use centralized devAuth system
    const { devAuth } = await import('@/lib/auth/dev-auth')
    const userIdMap = {
      admin: 'dev-admin-001',
      pro: 'dev-pro-001',
      free: 'dev-free-001',
      guest: 'dev-guest-001'
    }

    const userId = userIdMap[userType]
    devAuth.setCurrentDevUser(userId)

    // Redirect to home
    setTimeout(() => {
      window.location.href = '/'
    }, 500)
  }

  async function handleSignInWithGoogle() {
    const supabase = createClient()

    if (!supabase) {
      // In dev mode without Supabase, use dev login
      if (process.env.NODE_ENV === 'development') {
        handleDevLogin('free')
        return
      }
      throw new Error("Supabase is not configured")
    }

    try {
      setIsLoading(true)
      setError(null)

      const data = await signInWithGoogle(supabase)

      // Redirect to the provider URL
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

  return (
    <div className="bg-background flex h-dvh w-full flex-col">
      <HeaderGoBack href="/" />

      <main className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-foreground text-3xl font-medium tracking-tight sm:text-4xl">
              Welcome to Zola
            </h1>
            <p className="text-muted-foreground mt-3">
              Sign in below to increase your message limits.
            </p>
          </div>
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {error}
            </div>
          )}
          <div className="mt-8 space-y-3">
            {/* Dev mode login options */}
            {process.env.NODE_ENV === 'development' && (
              <>
                <div className="text-muted-foreground text-center text-sm mb-4">
                  🛠️ Development Mode - Quick Login
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleDevLogin('guest')}
                    disabled={isLoading}
                  >
                    Guest User
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDevLogin('free')}
                    disabled={isLoading}
                  >
                    Free User
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDevLogin('pro')}
                    disabled={isLoading}
                  >
                    Pro User
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDevLogin('admin')}
                    disabled={isLoading}
                  >
                    Admin
                  </Button>
                </div>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>
              </>
            )}

            {/* Regular Google login */}
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
                {isLoading ? "Connecting..." : "Continue with Google"}
              </span>
            </Button>
          </div>
        </div>
      </main>

      <footer className="text-muted-foreground py-6 text-center text-sm">
        {/* @todo */}
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
