"use client"

// Centralized development authentication utilities
// Replaces scattered localStorage calls throughout the codebase

export interface DevUser {
  id: string
  email: string
  display_name: string
  profile_image?: string
  role: 'guest' | 'free' | 'pro' | 'admin'
}

const DEV_USERS: Record<string, DevUser> = {
  'dev-guest-001': {
    id: 'dev-guest-001',
    email: 'guest@dev.local',
    display_name: 'Guest User',
    role: 'guest'
  },
  'dev-free-001': {
    id: 'dev-free-001',
    email: 'free@dev.local',
    display_name: 'Free User',
    role: 'free'
  },
  'dev-pro-001': {
    id: 'dev-pro-001',
    email: 'pro@dev.local',
    display_name: 'Pro User',
    role: 'pro'
  },
  'dev-admin-001': {
    id: 'dev-admin-001',
    email: 'admin@dev.local',
    display_name: 'Admin User',
    role: 'admin'
  }
}

class DevAuthManager {
  private static instance: DevAuthManager
  private readonly STORAGE_KEY = 'guestUserId'

  static getInstance(): DevAuthManager {
    if (!DevAuthManager.instance) {
      DevAuthManager.instance = new DevAuthManager()
    }
    return DevAuthManager.instance
  }

  // Check if we're in development mode
  isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development'
  }

  // Get current dev user from localStorage
  getCurrentDevUser(): DevUser | null {
    if (!this.isDevelopment()) return null

    try {
      const userId = localStorage.getItem(this.STORAGE_KEY)
      if (!userId || !userId.startsWith('dev-')) return null

      return DEV_USERS[userId] || null
    } catch {
      return null
    }
  }

  // Set current dev user in localStorage
  setCurrentDevUser(userId: string): DevUser | null {
    if (!this.isDevelopment()) return null

    const user = DEV_USERS[userId]
    if (!user) return null

    try {
      localStorage.setItem(this.STORAGE_KEY, userId)
      return user
    } catch {
      return null
    }
  }

  // Clear current dev user
  clearCurrentDevUser(): void {
    if (!this.isDevelopment()) return

    try {
      localStorage.removeItem(this.STORAGE_KEY)
    } catch {
      // Silently fail
    }
  }

  // Get all available dev users
  getAvailableDevUsers(): DevUser[] {
    if (!this.isDevelopment()) return []
    return Object.values(DEV_USERS)
  }

  // Check if a userId is a dev user
  isDevUser(userId?: string | null): boolean {
    if (!this.isDevelopment() || !userId) return false
    return userId.startsWith('dev-') && userId in DEV_USERS
  }

  // Get dev user by ID
  getDevUserById(userId: string): DevUser | null {
    if (!this.isDevelopment() || !this.isDevUser(userId)) return null
    return DEV_USERS[userId] || null
  }

  // Generate auth headers for dev users
  getDevAuthHeaders(): HeadersInit {
    const user = this.getCurrentDevUser()
    if (!user) return {}

    return {
      'x-dev-user-id': user.id,
      'x-dev-user-role': user.role,
      'x-development-mode': 'true'
    }
  }

  // Check if user has authenticated status (real or dev)
  isAuthenticated(): boolean {
    if (!this.isDevelopment()) {
      // In production, check for real authentication
      // This would be replaced with actual auth check
      return false
    }

    return this.getCurrentDevUser() !== null
  }
}

// Export singleton instance
export const devAuth = DevAuthManager.getInstance()

// Convenience exports
export const {
  isDevelopment,
  getCurrentDevUser,
  setCurrentDevUser,
  clearCurrentDevUser,
  getAvailableDevUsers,
  isDevUser,
  getDevUserById,
  getDevAuthHeaders,
  isAuthenticated
} = devAuth

// React hook for dev auth state
import { useEffect, useState } from 'react'

export function useDevAuth() {
  const [user, setUser] = useState<DevUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isDevelopment()) {
      setIsLoading(false)
      return
    }

    const checkDevUser = () => {
      const currentUser = getCurrentDevUser()
      setUser(currentUser)
      setIsLoading(false)
    }

    checkDevUser()

    // Listen for localStorage changes (when user switches dev accounts)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'guestUserId') {
        checkDevUser()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const login = (userId: string) => {
    const user = setCurrentDevUser(userId)
    setUser(user)
    return user
  }

  const logout = () => {
    clearCurrentDevUser()
    setUser(null)
  }

  return {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    logout,
    availableUsers: getAvailableDevUsers()
  }
}