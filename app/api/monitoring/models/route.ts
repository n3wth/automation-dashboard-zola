import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { MonitoringEvent } from '@/lib/monitoring'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    const { data, error } = await supabase
      .from('monitoring')
      .select('value')
      .eq('type', MonitoringEvent.AI_MODEL_USAGE)

    if (error) throw error

    const modelCounts = data.reduce((acc, { value }) => {
      if (value) {
        acc[value] = (acc[value] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    const modelData = Object.entries(modelCounts).map(([name, count]) => ({
      name,
      count,
    }))

    return NextResponse.json(modelData)
  } catch (error) {
    console.error('Error fetching model usage data:', error)
    return NextResponse.json({ error: 'Failed to fetch model usage data' }, { status: 500 })
  }
}
