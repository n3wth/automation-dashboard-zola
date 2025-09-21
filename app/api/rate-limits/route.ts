import { getMessageUsage } from "./api"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  const isAuthenticated = searchParams.get("isAuthenticated") === "true"

  if (!userId) {
    return new Response(JSON.stringify({ error: "Missing userId" }), {
      status: 400,
    })
  }

  // LOCAL DEV BYPASS: Return mock rate limits for development
  if (process.env.NODE_ENV === 'development' && userId.startsWith('dev-')) {
    // Different limits based on dev user type
    const isPro = userId.includes('pro') || userId.includes('admin')
    const mockUsage = {
      dailyCount: 0,
      dailyProCount: 0,
      dailyLimit: isPro ? 1000 : (isAuthenticated ? 100 : 50),
      remaining: isPro ? 1000 : (isAuthenticated ? 100 : 50),
      remainingPro: isPro ? 100 : 20,
    }
    return new Response(JSON.stringify(mockUsage), { status: 200 })
  }

  try {
    const usage = await getMessageUsage(userId, isAuthenticated)

    if (!usage) {
      return new Response(
        JSON.stringify({ error: "Supabase not available in this deployment." }),
        { status: 200 }
      )
    }

    return new Response(JSON.stringify(usage), { status: 200 })
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 })
  }
}
