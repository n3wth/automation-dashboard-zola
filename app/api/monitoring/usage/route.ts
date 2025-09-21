import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { count: totalEvents, error: totalEventsError } = await supabase
      .from('monitoring')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', twentyFourHoursAgo)

    if (totalEventsError) throw totalEventsError

    const { data: activeUsersData, error: activeUsersError } = await supabase
      .from('monitoring')
      .select('user_id')
      .gte('created_at', twentyFourHoursAgo)
      .not('user_id', 'is', null)

    if (activeUsersError) throw activeUsersError

    const activeUsers = new Set(activeUsersData.map(d => d.user_id)).size

    const { data: eventsOverTimeData, error: eventsOverTimeError } = await supabase
      .rpc('get_events_over_time')

    if (eventsOverTimeError) throw eventsOverTimeError

    return NextResponse.json({
      totalEvents,
      activeUsers,
      eventsOverTime: eventsOverTimeData,
    })
  } catch (error) {
    console.error('Error fetching usage data:', error)
    return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 })
  }
}
