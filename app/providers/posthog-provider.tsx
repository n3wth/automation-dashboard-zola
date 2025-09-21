'use client'
import { useUser } from '@/lib/user-store/provider'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { ReactNode, useEffect } from 'react'

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NODE_ENV === 'production') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false,
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.debug()
    }
  })
}

export function CSPostHogProvider({ children }: { children: ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <PostHogAuthWrapper>
        {children}
      </PostHogAuthWrapper>
    </PostHogProvider>
  )
}

function PostHogAuthWrapper({ children }: { children: ReactNode }) {
  const { user } = useUser()

  useEffect(() => {
    // Only use PostHog in production
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.NODE_ENV !== 'production') return

    try {
      if (user) {
        posthog.identify(user.id, {
          email: user.email,
          name: user.name,
        })
      } else {
        posthog.reset()
      }
    } catch (error) {
      console.warn('PostHog operation failed:', error)
    }
  }, [user])

  return <>{children}</>
}
