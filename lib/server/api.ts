import { createClient } from "@/lib/supabase/server"
import { createGuestServerClient } from "@/lib/supabase/server-guest"
import { isSupabaseEnabled } from "../supabase/config"

// Track whether we've already logged dev mode warnings this session
const loggedDevUsers = new Set<string>()

/**
 * Validates the user's identity
 * @param userId - The ID of the user.
 * @param isAuthenticated - Whether the user is authenticated.
 * @returns The Supabase client.
 */
export async function validateUserIdentity(
  userId: string,
  isAuthenticated: boolean
) {
  if (!isSupabaseEnabled) {
    return null
  }

  // LOCAL DEV BYPASS: Allow all dev users in development
  if (process.env.NODE_ENV === 'development' && (userId.startsWith('dev-') || userId === '00000000-0000-0000-0000-000000000001')) {
    // Only log once per dev user per session to reduce console spam
    if (!loggedDevUsers.has(userId)) {
      console.log("⚠️ LOCAL DEV MODE: Bypassing validation for dev user:", userId)
      console.log("⚠️ LOCAL DEV MODE: Mapping dev user to anonymous UUID")
      loggedDevUsers.add(userId)
    }

    // Return guest client for dev users to enable database operations
    const guestClient = await createGuestServerClient()
    return guestClient
  }

  const supabase = isAuthenticated
    ? await createClient()
    : await createGuestServerClient()

  if (!supabase) {
    throw new Error("Failed to initialize Supabase client")
  }

  if (isAuthenticated) {
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData?.user?.id) {
      throw new Error("Unable to get authenticated user")
    }

    if (authData.user.id !== userId) {
      throw new Error("User ID doesn't match the authenticated user")
    }
  }

  return supabase
}