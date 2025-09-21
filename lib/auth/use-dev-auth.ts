"use client"

import { useEffect, useState } from "react"
import { devAuth } from "./dev-auth"
import type { DevUser } from "./dev-auth"

export function useDevAuth() {
  const [user, setUser] = useState<DevUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!devAuth.isDevelopment()) {
      setIsLoading(false)
      return
    }

    const checkDevUser = () => {
      const currentUser = devAuth.getCurrentDevUser()
      setUser(currentUser)
      setIsLoading(false)
    }

    checkDevUser()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "guestUserId") {
        checkDevUser()
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const login = (userId: string) => {
    const user = devAuth.setCurrentDevUser(userId)
    setUser(user)
    return user
  }

  const logout = () => {
    devAuth.clearCurrentDevUser()
    setUser(null)
  }

  return {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    logout,
    availableUsers: devAuth.getAvailableDevUsers(),
  }
}
