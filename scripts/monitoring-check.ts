// To run this script, you'll need to install ts-node and setup your environment variables.
// npm install -g ts-node
// ts-node scripts/monitoring-check.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL or service key not provided.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkHealth() {
  console.log('Running monitoring check...')

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  // 1. Check for a spike in errors (e.g., more than 10 in the last hour)
  // This is a placeholder. In a real scenario, you would query your error tracking system (e.g., Sentry).
  const errorThreshold = 10 
  // const { count: errorCount } = await supabase.from('errors').select('*', { count: 'exact' }).gte('timestamp', oneHourAgo)
  // if (errorCount > errorThreshold) {
  //   console.log(`ALERT: High number of errors detected: ${errorCount} in the last hour.`)
  //   // Here you would send an alert (email, Slack, etc.)
  // }

  // 2. Check database connection health
  const { error: dbError } = await supabase.from('chats').select('id').limit(1)
  if (dbError) {
    console.log('ALERT: Database connection is unhealthy.')
    // Send alert
  } else {
    console.log('Database connection is healthy.')
  }

  // 3. Check for unusual AI model usage (e.g., sudden spike)
  const { data: modelUsage, error: modelUsageError } = await supabase
    .from('monitoring')
    .select('value')
    .eq('type', 'AI_MODEL_USAGE')
    .gte('created_at', oneHourAgo)

  if (modelUsageError) {
    console.error('Could not fetch model usage data.')
  } else if (modelUsage.length > 100) { // Example threshold
    console.log(`ALERT: High AI model usage detected: ${modelUsage.length} requests in the last hour.`)
    // Send alert
  } else {
    console.log(`AI model usage is normal (${modelUsage.length} requests in the last hour).`)
  }

  console.log('Monitoring check complete.')
}

checkHealth().catch(console.error)
