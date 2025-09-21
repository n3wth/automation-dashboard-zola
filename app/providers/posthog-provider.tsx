'use client'
import { ReactNode } from 'react'

// PostHog temporarily disabled for build optimization
// To re-enable: npm install posthog-js and uncomment the original code

export function CSPostHogProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}