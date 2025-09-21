import { Database } from "@/app/types/database.types"
import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { isSupabaseEnabled } from "./config"

export type TypedSupabaseClient = SupabaseClient<Database>

// Create a properly typed client that throws if Supabase is not enabled
export function createClient(): TypedSupabaseClient {
  if (!isSupabaseEnabled) {
    throw new Error("Supabase is not enabled. Check environment variables.")
  }

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as any as TypedSupabaseClient
}

// For cases where we need to handle the client being unavailable gracefully
export function createClientSafe(): TypedSupabaseClient | null {
  if (!isSupabaseEnabled) {
    return null
  }

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as any as TypedSupabaseClient
}

// Type guard to check if client is available
export function isSupabaseClientAvailable(client: TypedSupabaseClient | null): client is TypedSupabaseClient {
  return client !== null
}
