import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)
  let dbStatus = 'ok'

  try {
    const { error } = await supabase.from('chats').select('id').limit(1)
    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Health check failed:', error)
    dbStatus = 'error'
  }

  const status = dbStatus === 'ok' ? 200 : 503
  const response = {
    status: dbStatus === 'ok' ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
  }

  return NextResponse.json(response, { status })
}