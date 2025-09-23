import { isSupabaseEnabled } from "@/lib/supabase/config"
import { createClient } from "@/lib/supabase/server"
import {
  convertFromApiFormat,
  defaultPreferences,
} from "@/lib/user-preference-store/utils"
import { devAuth } from "@/lib/auth/dev-auth"
import type { UserProfile } from "./types"

export async function getSupabaseUser() {
  const supabase = await createClient()
  if (!supabase) return { supabase: null, user: null }

  const { data } = await supabase.auth.getUser()
  return {
    supabase,
    user: data.user ?? null,
  }
}

export async function getUserProfile(): Promise<UserProfile | null> {
  if (!isSupabaseEnabled) {
    // return fake user profile for no supabase
    return {
      id: "guest",
      email: "guest@bob.newth.ai",
      display_name: "Guest",
      profile_image: "",
      anonymous: true,
      preferences: defaultPreferences,
    } as UserProfile
  }

  const { supabase, user } = await getSupabaseUser()
  if (!supabase || !user) {
    // In development, return default dev user if no Supabase user
    if (process.env.NODE_ENV === 'development') {
      return {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'guest@dev.local',
        display_name: 'Guest User',
        profile_image: "",
        anonymous: false,
        preferences: defaultPreferences,
      } as UserProfile
    }
    return null
  }

  const { data: userProfileData } = await supabase
    .from("users")
    .select("*, user_preferences(*)")
    .eq("id", user.id)
    .single()

  // Don't load anonymous users in the user store
  if (userProfileData?.anonymous) return null

  // Format user preferences if they exist
  const formattedPreferences = userProfileData?.user_preferences
    ? convertFromApiFormat(userProfileData.user_preferences)
    : undefined

  return {
    ...userProfileData,
    profile_image: user.user_metadata?.avatar_url ?? "",
    display_name: user.user_metadata?.name ?? "",
    preferences: formattedPreferences,
  } as UserProfile
}
