import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json({
        totalEvents: 0,
        activeUsers: 0,
        eventsPerHour: []
      }, { status: 200 })
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { count: totalEvents, error: totalEventsError } = await (supabase as any)
      .from('monitoring')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', twentyFourHoursAgo)

    if (totalEventsError) throw totalEventsError

    const { data: activeUsersData, error: activeUsersError } = await (supabase as any)
      .from('monitoring')
      .select('user_id')
      .gte('created_at', twentyFourHoursAgo)
      .not('user_id', 'is', null)

    if (activeUsersError) throw activeUsersError

    const activeUsers = new Set(activeUsersData.map((d: any) => d.user_id)).size

    const { data: eventsOverTimeData, error: eventsOverTimeError } = await (supabase as any)
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
