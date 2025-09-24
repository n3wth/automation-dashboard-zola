import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  let dbStatus = 'ok'

  if (supabase) {
    try {
      const { error } = await supabase.from('chats').select('id').limit(1)
      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Health check failed:', error)
      dbStatus = 'error'
    }
  } else {
    dbStatus = 'disabled'
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