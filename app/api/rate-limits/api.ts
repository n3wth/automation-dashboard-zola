import {
  AUTH_DAILY_MESSAGE_LIMIT,
  DAILY_LIMIT_PRO_MODELS,
  NON_AUTH_DAILY_MESSAGE_LIMIT,
} from "@/lib/config"
import { validateUserIdentity } from "@/lib/server/api"

const HOURS_IN_DAY = 24

// Normalises anonymous usage rows into the daily limit payload expected by the client.
function getAnonymousRemaining(queryCount: number, firstQueryAt?: string) {
  const firstQuery = firstQueryAt ? new Date(firstQueryAt) : null
  const now = new Date()

  if (firstQuery) {
    const hoursSinceFirst =
      (now.getTime() - firstQuery.getTime()) / (1000 * 60 * 60)
    if (hoursSinceFirst > HOURS_IN_DAY) {
      return {
        remaining: NON_AUTH_DAILY_MESSAGE_LIMIT,
        dailyCount: 0,
      }
    }
  }

  const cappedCount = Math.max(0, queryCount)
  const remaining = Math.max(0, NON_AUTH_DAILY_MESSAGE_LIMIT - cappedCount)

  return {
    remaining,
    dailyCount: Math.min(cappedCount, NON_AUTH_DAILY_MESSAGE_LIMIT),
  }
}

export async function getMessageUsage(
  userId: string,
  isAuthenticated: boolean
) {
  const supabase = await validateUserIdentity(userId, isAuthenticated)
  if (!supabase) return null

  // Handle session-based anonymous users without hitting UUID columns
  if (userId.startsWith("anon-")) {
    const { data, error } = await (supabase as any)
      .from("anonymous_usage")
      .select("query_count, first_query_at")
      .eq("session_id", userId)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      throw new Error(error.message)
    }

    const queryCount = data?.query_count ?? 0
    const firstQueryAt = data?.first_query_at ?? undefined
    const { remaining, dailyCount } = getAnonymousRemaining(
      queryCount,
      firstQueryAt
    )

    return {
      dailyCount,
      dailyProCount: 0,
      dailyLimit: NON_AUTH_DAILY_MESSAGE_LIMIT,
      remaining,
      remainingPro: 0,
    }
  }

  const { data, error } = await supabase
    .from("users")
    .select("daily_message_count, daily_pro_message_count")
    .eq("id", userId)
    .maybeSingle()

  if (error || !data) {
    throw new Error(error?.message || "Failed to fetch message usage")
  }

  const dailyLimit = isAuthenticated
    ? AUTH_DAILY_MESSAGE_LIMIT
    : NON_AUTH_DAILY_MESSAGE_LIMIT

  const dailyCount = (data as any).daily_message_count || 0
  const dailyProCount = (data as any).daily_pro_message_count || 0

  return {
    dailyCount,
    dailyProCount,
    dailyLimit,
    remaining: dailyLimit - dailyCount,
    remainingPro: DAILY_LIMIT_PRO_MODELS - dailyProCount,
  }
}
