import { createClient } from '@/lib/supabase/server'

export enum MonitoringEvent {
  AI_MODEL_USAGE = 'AI_MODEL_USAGE',
  DB_QUERY = 'DB_QUERY',
  USER_LOGIN = 'USER_LOGIN',
}

interface TrackEventParams {
  type: MonitoringEvent;
  value?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export async function trackEvent({ type, value, userId, metadata }: TrackEventParams) {
  try {
    const supabase = await createClient()
    if (!supabase) return // Skip if Supabase is not enabled

    // Map dev users to anonymous UUID for database constraints
    const dbUserId = process.env.NODE_ENV === 'development' && userId?.startsWith('dev-')
      ? '00000000-0000-0000-0000-000000000001'
      : userId

    const { error } = await supabase.from('monitoring').insert({
      type,
      value,
      user_id: dbUserId,
      metadata,
    })

    if (error) {
      console.error('Failed to track event:', error)
    }
  } catch (error) {
    console.error('Error tracking event:', error)
  }
}
