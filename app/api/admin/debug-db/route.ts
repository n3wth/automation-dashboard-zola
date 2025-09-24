import { createGuestServerClient } from "@/lib/supabase/server-guest"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createGuestServerClient()

    if (!supabase) {
      return NextResponse.json({ error: "Could not create Supabase client" }, { status: 500 })
    }

    const results: any = {
      checks: []
    }

    // Check 1: Does the handle_new_user function exist?
    try {
      const { data: functions, error: funcError } = await supabase
        .from('pg_proc')
        .select('proname, prosrc')
        .eq('proname', 'handle_new_user')

      results.checks.push({
        test: "handle_new_user function exists",
        result: functions && functions.length > 0,
        data: functions,
        error: funcError
      })
    } catch (err) {
      results.checks.push({
        test: "handle_new_user function exists",
        result: false,
        error: "Cannot access pg_proc table"
      })
    }

    // Check 2: Does the trigger exist?
    try {
      const { data: triggers, error: trigError } = await supabase
        .from('information_schema.triggers')
        .select('*')
        .eq('trigger_name', 'on_auth_user_created')

      results.checks.push({
        test: "on_auth_user_created trigger exists",
        result: triggers && triggers.length > 0,
        data: triggers,
        error: trigError
      })
    } catch (err) {
      results.checks.push({
        test: "on_auth_user_created trigger exists",
        result: false,
        error: "Cannot access information_schema.triggers"
      })
    }

    // Check 3: Does the users table exist?
    try {
      const { data: tables, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('*')
        .eq('table_name', 'users')
        .eq('table_schema', 'public')

      results.checks.push({
        test: "public.users table exists",
        result: tables && tables.length > 0,
        data: tables,
        error: tableError
      })
    } catch (err) {
      results.checks.push({
        test: "public.users table exists",
        result: false,
        error: "Cannot access information_schema.tables"
      })
    }

    // Check 4: What's the users table structure?
    try {
      const { data: columns, error: colError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'users')
        .eq('table_schema', 'public')

      results.checks.push({
        test: "public.users table structure",
        result: columns && columns.length > 0,
        data: columns,
        error: colError
      })
    } catch (err) {
      results.checks.push({
        test: "public.users table structure",
        result: false,
        error: "Cannot access information_schema.columns"
      })
    }

    // Check 5: Try to query users table directly
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id')
        .limit(1)

      results.checks.push({
        test: "Can query users table",
        result: !usersError,
        data: `Found ${users?.length || 0} records`,
        error: usersError
      })
    } catch (err) {
      results.checks.push({
        test: "Can query users table",
        result: false,
        error: err instanceof Error ? err.message : String(err)
      })
    }

    return NextResponse.json(results)

  } catch (err) {
    return NextResponse.json({
      error: "Unexpected error",
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 })
  }
}