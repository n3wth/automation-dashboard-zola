import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json({ models: [] }, { status: 200 })
    }

    // TODO: Implement monitoring table or remove this endpoint
    // const { data, error } = await supabase
    //   .from('monitoring')
    //   .select('value')
    //   .eq('type', MonitoringEvent.AI_MODEL_USAGE)

    // Return mock data for now
    const data: { value: string }[] = []
    const error = null

    if (error) throw error

    const modelCounts = (data || []).reduce((acc: Record<string, number>, { value }: { value: string }) => {
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
