"use client"

import { useCallback, useEffect, useState } from "react"

type OnboardingStatus = "loading" | "pending" | "done"
type CompletionType = "completed" | "skipped"

const STORAGE_KEY = "bob:onboarding-tour-status"

export function useOnboardingTour() {
  const [status, setStatus] = useState<OnboardingStatus>("loading")
  const [completionType, setCompletionType] = useState<CompletionType | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const stored = window.localStorage.getItem(STORAGE_KEY) as CompletionType | null

    if (stored === "completed" || stored === "skipped") {
      setStatus("done")
      setCompletionType(stored)
      return
    }

    setStatus("pending")
  }, [])

  const persistStatus = useCallback((value: CompletionType) => {
    if (typeof window === "undefined") {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, value)
  }, [])

  const completeTour = useCallback(() => {
    setStatus("done")
    setCompletionType("completed")
    persistStatus("completed")
  }, [persistStatus])

  const skipTour = useCallback(() => {
    setStatus("done")
    setCompletionType("skipped")
    persistStatus("skipped")
  }, [persistStatus])

  const resetTour = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY)
    }

    setStatus("pending")
    setCompletionType(null)
  }, [])

  return {
    hasCompletedTour: status === "done",
    isLoading: status === "loading",
    completionType,
    completeTour,
    skipTour,
    resetTour,
  }
}
