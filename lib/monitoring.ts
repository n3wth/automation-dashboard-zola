import type { Json, TablesInsert } from '@/app/types/database.types'
import { createClient, type TypedSupabaseServerClient } from '@/lib/supabase/server'

export enum MonitoringEvent {
  AI_MODEL_USAGE = 'AI_MODEL_USAGE',
  DB_QUERY = 'DB_QUERY',
  USER_LOGIN = 'USER_LOGIN',
}

interface TrackEventParams {
  type: MonitoringEvent;
  value?: string;
  userId?: string;
  metadata?: Json;
}

export async function trackEvent({ type, value, userId, metadata }: TrackEventParams) {
  try {
    const supabase: TypedSupabaseServerClient = await createClient()
    if (!supabase) return // Skip if Supabase is not enabled

    // Map dev users to anonymous UUID for database constraints
    const dbUserId = process.env.NODE_ENV === 'development' && userId?.startsWith('dev-')
      ? '00000000-0000-0000-0000-000000000001'
      : userId

    const payload: TablesInsert<'monitoring'> = {
      type,
      value: value ?? null,
      user_id: dbUserId ?? null,
      metadata: metadata ?? null,
    }

    const { error } = await supabase.from('monitoring').insert(payload)

    if (error) {
      console.error('Failed to track event:', error)
    }
  } catch (error) {
    console.error('Error tracking event:', error)
  }
}
