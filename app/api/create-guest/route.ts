import { createGuestServerClient } from "@/lib/supabase/server-guest"

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
      })
    }

    // For session-based anonymous users (anon-* prefix)
    // We don't create a user record in the database
    // Instead, we just track their usage in the anonymous_usage table
    if (userId.startsWith('anon-')) {
      // Get IP and user agent for tracking
      const ip = request.headers.get('x-forwarded-for') ||
                 request.headers.get('x-real-ip') ||
                 'unknown'
      const userAgent = request.headers.get('user-agent') || 'unknown'

      // Return a mock user object for the frontend
      // The actual tracking will happen when they make queries
      return new Response(
        JSON.stringify({
          user: {
            id: userId,
            anonymous: true,
            email: `${userId}@anonymous.example`,
            message_count: 0,
            premium: false,
            created_at: new Date().toISOString()
          }
        }),
        { status: 200 }
      )
    }

    // For dev users or authenticated users, continue with the original logic
    const supabase = await createGuestServerClient()
    if (!supabase) {
      console.log("Supabase not enabled, skipping guest creation.")
      return new Response(
        JSON.stringify({ user: { id: userId, anonymous: true } }),
        {
          status: 200,
        }
      )
    }

    // Check if the user record already exists.
    let { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle()

    if (!userData) {
      const { data, error } = await supabase
        .from("users")
        .insert({
          id: userId,
          email: `${userId}@anonymous.example`,
          anonymous: true,
          message_count: 0,
          premium: false,
          created_at: new Date().toISOString(),
        } as any)
        .select("*")
        .single()

      if (error || !data) {
        console.error("Error creating guest user:", error)
        return new Response(
          JSON.stringify({
            error: "Failed to create guest user",
            details: error?.message,
          }),
          { status: 500 }
        )
      }

      userData = data
    }

    return new Response(JSON.stringify({ user: userData }), { status: 200 })
  } catch (err: unknown) {
    console.error("Error in create-guest endpoint:", err)

    return new Response(
      JSON.stringify({ error: (err as Error).message || "Internal server error" }),
      { status: 500 }
    )
  }
}
