"use client"

import { Button } from "@/components/ui/button"
import { PopoverContent } from "@/components/ui/popover"
import { signInWithGoogle } from "@/lib/api"
import { APP_CONFIG } from "@/lib/constants/app"
import { BobGreeting } from "@/lib/components/branding/bob-mascot"
import { createClient } from "@/lib/supabase/client"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import Image from "next/image"
import { useState } from "react"

export function PopoverContentAuth() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // In dev mode, don't show auth popup if we have a dev user
  if (process.env.NODE_ENV === 'development') {
    const guestId = typeof window !== 'undefined' ? localStorage.getItem('guestUserId') : null
    if (guestId && guestId.startsWith('dev-')) {
      return null  // Don't show auth popup for dev users
    }
  }

  if (!isSupabaseEnabled) {
    return null
  }

  const handleSignInWithGoogle = async () => {
    const supabase = createClient()

    if (!supabase) {
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
    <PopoverContent
      className="w-[300px] overflow-hidden rounded-xl p-0"
      side="top"
      align="start"
    >
      <Image
        src="/bob-banner.png"
        alt={`Bob retro celebration banner - ${APP_CONFIG.name}`}
        width={300}
        height={128}
        className="h-32 w-full object-cover"
      />
      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error}
        </div>
      )}
      <div className="p-3">
        <BobGreeting type="welcome" className="mb-3" />
        <p className="text-primary mb-1 text-base font-medium">
          Join Bob for enhanced AI conversations
        </p>
        <p className="text-muted-foreground mb-5 text-base">
          Upload files, access premium models, bring your own keys, and more.
        </p>
        <Button
          variant="secondary"
          className="w-full text-base btn-bob"
          size="lg"
          onClick={handleSignInWithGoogle}
          disabled={isLoading}
        >
          <Image
            src="https://www.google.com/favicon.ico"
            alt="Google logo"
            width={20}
            height={20}
            className="mr-2 size-4"
          />
          <span>{isLoading ? "Bob is connecting..." : "Chat with Bob via Google"}</span>
        </Button>
      </div>
    </PopoverContent>
  )
}
