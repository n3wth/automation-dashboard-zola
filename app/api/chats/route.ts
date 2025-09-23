import { validateUserIdentity } from "@/lib/server/api"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const isAuthenticated = searchParams.get('isAuthenticated') === 'true'

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = await validateUserIdentity(userId, isAuthenticated)
    if (!supabase) {
      return NextResponse.json({ error: "Failed to authenticate" }, { status: 401 })
    }

    // Use anonymous user UUID for dev users to match what we do for message saving
    const dbUserId = process.env.NODE_ENV === 'development' && userId.startsWith('dev-')
      ? '00000000-0000-0000-0000-000000000001'
      : userId

    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .eq("user_id", dbUserId)
      .order("pinned", { ascending: false })
      .order("pinned_at", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Failed to fetch chats:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ chats: data || [] })
  } catch (error) {
    console.error("Error in chats endpoint:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}