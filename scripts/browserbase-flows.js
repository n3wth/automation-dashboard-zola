// Rich Browserbase flows with pluggable model engine: gm (Gemini), cc (Claude), c (OpenAI)
const { Stagehand } = require('@browserbasehq/stagehand')

function resolveModelFromEngine(engine) {
  switch ((engine || '').toLowerCase()) {
    case 'gm':
      return process.env.SMOKE_MODEL || 'google/gemini-2.5-flash-preview-05-20'
    case 'cc':
      return process.env.SMOKE_MODEL || 'anthropic/claude-3-5-sonnet-20240620'
    case 'c':
    default:
      return process.env.SMOKE_MODEL || (process.env.OPENAI_API_KEY ? 'openai/gpt-4o-mini' : 'google/gemini-2.5-flash-preview-05-20')
  }
}

function resolveApiKey(engine) {
  const m = (engine || '').toLowerCase()
  if (m === 'gm' && process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY
  if (m === 'cc' && process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY
  return process.env.OPENAI_API_KEY || process.env.GOOGLE_API_KEY || process.env.ANTHROPIC_API_KEY
}

async function flowSmokeHome(page) {
  await page.goto(process.env.SMOKE_URL || 'https://bob.newth.ai', { waitUntil: 'domcontentloaded' })
  const ok = await page.evaluate(() => {
    const header = document.querySelector('header, [role="banner"], nav')
    const login = document.querySelector('[data-testid="login-link"], a[href*="auth" i]')
    const vis = (el) => !!el && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)
    return vis(header) && vis(login)
  })
  if (!ok) throw new Error('SmokeHome: missing header or login link')
}

async function flowAnonymousChat(page) {
  await page.act('Type "Hello from automated flow" into the message input')
  await page.act('Click the send message button')
  await page.waitForTimeout(1200)
  const hadAuthError = await page.evaluate(() => {
    const err = document.querySelector('[role="alert" i], [class*="error" i], [data-testid*="error" i]')
    const text = (err?.textContent || '').toLowerCase()
    return text.includes('sign in') || text.includes('login')
  })
  if (hadAuthError) throw new Error('AnonymousChat: auth error after send')
}

async function flowSettings(page) {
  await page.act('Click the settings button or settings nav link')
  await page.waitForTimeout(500)
  const hasSettings = await page.evaluate(() => !!document.querySelector('[data-testid="settings-root"], [class*="settings"]'))
  if (!hasSettings) throw new Error('Settings: could not find settings UI')
}

async function run() {
  const engine = process.env.RUNNER_ENGINE || process.argv.find(a => ['gm','cc','c'].includes(a)) || 'gm'
  const modelName = resolveModelFromEngine(engine)
  const apiKey = resolveApiKey(engine)
  const sh = new Stagehand({ env: 'BROWSERBASE', verbose: 0, modelName, disablePino: true, modelClientOptions: { apiKey } })
  await sh.init()
  const page = sh.page
  try {
    await flowSmokeHome(page)
    await flowAnonymousChat(page)
    await flowSettings(page)
    console.log('[flows] OK')
    await sh.close(); process.exit(0)
  } catch (e) {
    console.error('[flows] FAIL:', e?.message || e)
    await sh.close(); process.exit(1)
  }
}

if (require.main === module) run()

