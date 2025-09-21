import { Database } from "@/app/types/database.types"
import { createServerClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { isSupabaseEnabled } from "./config"

export type TypedSupabaseServerClient = SupabaseClient<Database>

export const createClient = async (): Promise<TypedSupabaseServerClient> => {
  if (!isSupabaseEnabled) {
    throw new Error("Supabase is not enabled. Check environment variables.")
  }

  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // ignore for middleware
          }
        },
      },
    }
  ) as any as TypedSupabaseServerClient
}

export const createClientSafe = async (): Promise<TypedSupabaseServerClient | null> => {
  if (!isSupabaseEnabled) {
    return null
  }

  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // ignore for middleware
          }
        },
      },
    }
  ) as any as TypedSupabaseServerClient
}
