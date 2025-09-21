import { validateUserIdentity } from "@/lib/server/api"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const chatId = searchParams.get('chatId')
    const userId = searchParams.get('userId')
    const isAuthenticated = searchParams.get('isAuthenticated') === 'true'

    if (!chatId) {
      return NextResponse.json({ error: "Chat ID is required" }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // In dev mode without real Supabase, return empty messages array
    const isDevMode = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEV_AUTH === 'true'
    const isDummySupabase = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('dummy')

    if (isDevMode && isDummySupabase) {
      console.log("📦 Dev mode: Returning empty messages (no real Supabase)")
      return NextResponse.json({ messages: [] })
    }

    const supabase = await validateUserIdentity(userId, isAuthenticated)
    if (!supabase) {
      // In dev mode, return empty messages instead of error
      if (isDevMode) {
        console.log("📦 Dev mode: No Supabase client available, returning empty messages")
        return NextResponse.json({ messages: [] })
      }
      return NextResponse.json({ error: "Failed to authenticate" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("messages")
      .select(
        "id, content, role, experimental_attachments, created_at, parts, message_group_id, model"
      )
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Failed to fetch messages:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform the data to match the expected format
    const messages = (data || []).map((message: any) => ({
      ...message,
      id: String(message.id),
      content: message.content ?? "",
      createdAt: new Date(message.created_at || ""),
      parts: message?.parts || undefined,
      message_group_id: message.message_group_id,
      model: message.model,
    }))

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error in messages endpoint:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}