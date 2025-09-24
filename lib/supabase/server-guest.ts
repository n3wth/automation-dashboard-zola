import type { Database } from "@/app/types/database.types"
import { createServerClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { isSupabaseEnabled } from "./config"

export type TypedSupabaseGuestClient = SupabaseClient<Database>

const instantiateGuestClient = (): TypedSupabaseGuestClient => {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  ) as unknown as SupabaseClient<Database>
}

export async function createGuestServerClient(): Promise<TypedSupabaseGuestClient> {
  if (!isSupabaseEnabled) {
    throw new Error("Supabase is not enabled. Check environment variables.")
  }

  return instantiateGuestClient()
}

export async function createGuestServerClientSafe(): Promise<TypedSupabaseGuestClient | null> {
  if (!isSupabaseEnabled) {
    return null
  }

  return instantiateGuestClient()
}
