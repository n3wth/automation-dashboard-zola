import { isSupabaseEnabled } from "@/lib/supabase/config"
import { notFound } from "next/navigation"
import LoginPage from "./login-page"

export default function AuthPage() {
  // In development, always show login page for dev user selection
  if (!isSupabaseEnabled && process.env.NODE_ENV !== 'development') {
    return notFound()
  }

  return <LoginPage />
}
