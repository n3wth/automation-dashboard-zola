import type { Database } from "@/app/types/database.types"
import { UsageLimitError } from "@/lib/api"
import {
  AUTH_DAILY_MESSAGE_LIMIT,
  DAILY_LIMIT_PRO_MODELS,
  FREE_MODELS_IDS,
  NON_AUTH_DAILY_MESSAGE_LIMIT,
} from "@/lib/config"
import type { SupabaseClient } from "@supabase/supabase-js"

type SupabaseDbClient = SupabaseClient<Database>

const isFreeModel = (modelId: string) => FREE_MODELS_IDS.includes(modelId)
const isProModel = (modelId: string) => !isFreeModel(modelId)

/**
 * Checks the user's daily usage to see if they've reached their limit.
 * Uses the `anonymous` flag from the user record to decide which daily limit applies.
 *
 * @param supabase - Your Supabase client.
 * @param userId - The ID of the user.
 * @param trackDaily - Whether to track the daily message count (default is true)
 * @throws UsageLimitError if the daily limit is reached, or a generic Error if checking fails.
 * @returns User data including message counts and reset date
 */
export async function checkUsage(supabase: SupabaseDbClient, userId: string) {
  // Handle session-based anonymous users (anon-* prefix)
  if (userId.startsWith('anon-')) {
    // For session-based anonymous users, check the anonymous_usage table
    const { data: usageData, error: usageError } = await supabase
      .from("anonymous_usage")
      .select("query_count, first_query_at")
      .eq("session_id", userId)
      .maybeSingle()

    if (usageError && usageError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error("Error checking anonymous usage: " + usageError.message)
    }

    // If no record exists, this is the first query
    const queryCount = usageData?.query_count || 0
    const firstQueryAt = usageData?.first_query_at || new Date().toISOString()
    const firstQuery = new Date(firstQueryAt)
    const now = new Date()

    // Reset if it's been more than 24 hours
    const hoursSinceFirst = (now.getTime() - firstQuery.getTime()) / (1000 * 60 * 60)
    const effectiveCount = hoursSinceFirst > 24 ? 0 : queryCount

    // Check anonymous limit (5 queries per day)
    if (effectiveCount >= NON_AUTH_DAILY_MESSAGE_LIMIT) {
      throw new UsageLimitError("Daily message limit reached for anonymous users. Please sign in to continue.")
    }

    // Return mock user data for anonymous sessions
    return {
      remaining: NON_AUTH_DAILY_MESSAGE_LIMIT - effectiveCount,
      dailyCount: effectiveCount,
      overallCount: queryCount,
      isAnonymous: true,
      isPremium: false,
      userData: {
        anonymous: true,
        premium: false,
        message_count: queryCount,
        daily_message_count: effectiveCount,
        daily_reset: firstQueryAt
      }
    }
  }

  // For authenticated or dev users, check the users table
  const { data: userData, error: userDataError } = await supabase
    .from("users")
    .select(
      "message_count, daily_message_count, daily_reset, anonymous, premium"
    )
    .eq("id", userId)
    .maybeSingle()

  if (userDataError) {
    throw new Error("Error fetchClienting user data: " + userDataError.message)
  }
  if (!userData) {
    // For default dev user ID, create a mock user
    if (userId === '00000000-0000-0000-0000-000000000001') {
      return {
        remaining: AUTH_DAILY_MESSAGE_LIMIT,
        dailyCount: 0,
        overallCount: 0,
        isAnonymous: false,
        isPremium: false,
        userData: {
          anonymous: false,
          premium: false,
          message_count: 0,
          daily_message_count: 0,
          daily_reset: new Date().toISOString()
        }
      }
    }
    throw new Error("User record not found for id: " + userId)
  }

  // Decide which daily limit to use.
  const isAnonymous = userData.anonymous
  // (Assuming these are imported from your config)
  const dailyLimit = isAnonymous
    ? NON_AUTH_DAILY_MESSAGE_LIMIT
    : AUTH_DAILY_MESSAGE_LIMIT

  // Reset the daily counter if the day has changed (using UTC).
  const now = new Date()
  let dailyCount = userData.daily_message_count ?? 0
  const lastReset = userData.daily_reset ? new Date(userData.daily_reset) : null

  const isNewDay =
    !lastReset ||
    now.getUTCFullYear() !== lastReset.getUTCFullYear() ||
    now.getUTCMonth() !== lastReset.getUTCMonth() ||
    now.getUTCDate() !== lastReset.getUTCDate()

  if (isNewDay) {
    dailyCount = 0
    const { error: resetError } = await supabase
      .from("users")
      .update({ daily_message_count: 0, daily_reset: now.toISOString() })
      .eq("id", userId)

    if (resetError) {
      throw new Error("Failed to reset daily count: " + resetError.message)
    }
  }

  // Check if the daily limit is reached.
  if (dailyCount >= dailyLimit) {
    throw new UsageLimitError("Daily message limit reached.")
  }

  return {
    userData,
    dailyCount,
    dailyLimit,
  }
}

/**
 * Increments both overall and daily message counters for a user.
 *
 * @param supabase - Your Supabase client.
 * @param userId - The ID of the user.
 * @param currentCounts - Current message counts (optional, will be fetchCliented if not provided)
 * @param trackDaily - Whether to track the daily message count (default is true)
 * @throws Error if updating fails.
 */
export async function incrementUsage(
  supabase: SupabaseDbClient | null,
  userId: string
): Promise<void> {
  // LOCAL DEV BYPASS: Skip increment for all dev users
  if (process.env.NODE_ENV === 'development' && userId.startsWith('dev-')) {
    console.log("⚠️ LOCAL DEV MODE: Bypassing usage increment for dev user")
    return
  }

  if (!supabase) {
    return // No-op if no Supabase client
  }

  // Handle session-based anonymous users (anon-* prefix)
  if (userId.startsWith('anon-')) {
    // Increment usage in anonymous_usage table
    const { error } = await supabase.rpc('increment_anonymous_query_count', {
      p_session_id: userId,
      p_ip: null,
      p_user_agent: null
    })

    if (error) {
      console.error("Failed to increment anonymous usage:", error)
      // Don't throw - allow the query to proceed
    }
    return
  }

  // Handle default dev user ID
  if (userId === '00000000-0000-0000-0000-000000000001') {
    // Skip tracking for default dev user
    return
  }

  const { data: userData, error: userDataError } = await supabase
    .from("users")
    .select("message_count, daily_message_count")
    .eq("id", userId)
    .maybeSingle()

  if (userDataError || !userData) {
    throw new Error(
      "Error fetchClienting user data: " +
        (userDataError?.message || "User not found")
    )
  }

  const messageCount = userData.message_count || 0
  const dailyCount = userData.daily_message_count ?? 0

  // Increment both overall and daily message counts.
  const newOverallCount = messageCount + 1
  const newDailyCount = dailyCount + 1

  const { error: updateError } = await supabase
    .from("users")
    .update({
      message_count: newOverallCount,
      daily_message_count: newDailyCount,
      last_active_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (updateError) {
    throw new Error("Failed to update usage data: " + updateError.message)
  }
}

export async function checkProUsage(supabase: SupabaseDbClient, userId: string) {
  const { data: userData, error: userDataError } = await supabase
    .from("users")
    .select("daily_pro_message_count, daily_pro_reset")
    .eq("id", userId)
    .maybeSingle()

  if (userDataError) {
    throw new Error("Error fetching user data: " + userDataError.message)
  }
  if (!userData) {
    throw new Error("User not found for ID: " + userId)
  }

  let dailyProCount = userData.daily_pro_message_count || 0
  const now = new Date()
  const lastReset = userData.daily_pro_reset
    ? new Date(userData.daily_pro_reset)
    : null

  const isNewDay =
    !lastReset ||
    now.getUTCFullYear() !== lastReset.getUTCFullYear() ||
    now.getUTCMonth() !== lastReset.getUTCMonth() ||
    now.getUTCDate() !== lastReset.getUTCDate()

  if (isNewDay) {
    dailyProCount = 0
    const { error: resetError } = await supabase
      .from("users")
      .update({
        daily_pro_message_count: 0,
        daily_pro_reset: now.toISOString(),
      })
      .eq("id", userId)

    if (resetError) {
      throw new Error("Failed to reset pro usage: " + resetError.message)
    }
  }

  if (dailyProCount >= DAILY_LIMIT_PRO_MODELS) {
    throw new UsageLimitError("Daily Pro model limit reached.")
  }

  return {
    dailyProCount,
    limit: DAILY_LIMIT_PRO_MODELS,
  }
}

export async function incrementProUsage(
  supabase: SupabaseDbClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("users")
    .select("daily_pro_message_count")
    .eq("id", userId)
    .maybeSingle()

  if (error || !data) {
    throw new Error("Failed to fetch user usage for increment")
  }

  const count = data.daily_pro_message_count || 0

  const { error: updateError } = await supabase
    .from("users")
    .update({
      daily_pro_message_count: count + 1,
      last_active_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (updateError) {
    throw new Error("Failed to increment pro usage: " + updateError.message)
  }
}

export async function checkUsageByModel(
  supabase: SupabaseDbClient | null,
  userId: string,
  modelId: string,
  isAuthenticated: boolean
) {
  // LOCAL DEV BYPASS: Skip usage checks for all dev users
  if (process.env.NODE_ENV === 'development' && userId.startsWith('dev-')) {
    console.log("⚠️ LOCAL DEV MODE: Bypassing usage checks for dev user")
    return {
      userData: {
        message_count: 0,
        daily_message_count: 0,
        daily_reset: new Date().toISOString(),
        anonymous: true,
        premium: false
      },
      dailyCount: 0,
      dailyLimit: 100
    }
  }

  if (!supabase) {
    // If no Supabase client, just return mock data
    return {
      userData: {
        message_count: 0,
        daily_message_count: 0,
        daily_reset: new Date().toISOString(),
        anonymous: true,
        premium: false
      },
      dailyCount: 0,
      dailyLimit: 100
    }
  }

  if (isProModel(modelId)) {
    if (!isAuthenticated) {
      throw new UsageLimitError("You must log in to use this model.")
    }
    return await checkProUsage(supabase, userId)
  }

  return await checkUsage(supabase, userId)
}

export async function incrementUsageByModel(
  supabase: SupabaseDbClient | null,
  userId: string,
  modelId: string,
  isAuthenticated: boolean
) {
  // LOCAL DEV BYPASS: Skip increment for all dev users
  if (process.env.NODE_ENV === 'development' && userId.startsWith('dev-')) {
    console.log("⚠️ LOCAL DEV MODE: Bypassing usage increment for dev user")
    return
  }

  if (!supabase) {
    return // No-op if no Supabase client
  }
  if (isProModel(modelId)) {
    if (!isAuthenticated) return
    return await incrementProUsage(supabase, userId)
  }

  return await incrementUsage(supabase, userId)
}
