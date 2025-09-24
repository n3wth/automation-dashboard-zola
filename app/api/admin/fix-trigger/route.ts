import { createGuestServerClient } from "@/lib/supabase/server-guest"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createGuestServerClient()

    if (!supabase) {
      return NextResponse.json({ error: "Could not create Supabase client" }, { status: 500 })
    }

    console.log("Applying missing trigger to production database...")

    // First check if the trigger exists
    const { data: triggerCheck, error: checkError } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('trigger_name', 'on_auth_user_created')

    if (checkError) {
      console.error("Error checking trigger:", checkError)
    } else {
      console.log("Trigger check result:", triggerCheck)
    }

    // Apply the missing trigger using SQL
    const triggerSQL = `
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `

    // Note: We can't execute raw SQL with the client, but we can report the status
    return NextResponse.json({
      success: true,
      message: "Connected to correct Supabase instance",
      sql: triggerSQL.trim(),
      instructions: [
        "1. Go to Supabase Dashboard > SQL Editor for zktnabjvuphoixwgwwem",
        "2. Run the SQL provided above",
        "3. Test email signup again"
      ],
      triggerExists: triggerCheck?.length > 0
    })

  } catch (err) {
    console.error("Unexpected error:", err)
    return NextResponse.json({
      error: "Unexpected error",
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 })
  }
}