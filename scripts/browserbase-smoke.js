// Browserbase smoke test for production site
// Requires: BROWSERBASE_API_KEY and a model key (e.g., GOOGLE_API_KEY)

const { Stagehand } = require('@browserbasehq/stagehand')

async function run() {
  const url = process.env.SMOKE_URL || 'https://bob.newth.ai'
  const modelName = process.env.SMOKE_MODEL || 'google/gemini-2.5-flash-preview-05-20'

  const sh = new Stagehand({
    env: 'BROWSERBASE',
    verbose: 0,
    modelName,
    disablePino: true,
    modelClientOptions: {
      apiKey: process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY
    }
  })

  try {
    await sh.init()
    const page = sh.page
    await page.goto(url, { waitUntil: 'domcontentloaded' })

    // Verify header and login link via DOM evaluation
    const dom = await page.evaluate(() => {
      const headerEl = document.querySelector('header, [role="banner"], nav')
      const loginEl = document.querySelector('[data-testid="login-link"], a[href*="auth" i], a:where(:is(:link)):where(:not([href="/"]))')
      const visible = (el) => !!el && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)
      return {
        header: visible(headerEl),
        login: visible(loginEl),
      }
    })

    if (!dom.header || !dom.login) {
      throw new Error('Missing header or login link on homepage')
    }

    // Try to send an anonymous chat message
    // Try common selectors directly first for robustness
    await page.evaluate(() => {
      const ta = document.querySelector('[data-testid="chat-input-textarea"], textarea, [contenteditable="true"]')
      if (ta && 'value' in ta) ta.value = 'Hello, can you help me?'
    })
    try {
      await page.act('Type "Hello, can you help me?" into the message input')
      await page.act('Click the send message button')
    } catch {}
    await page.waitForTimeout(1500)

    // Look for auth error text
    const hadAuthError = await page.evaluate(() => {
      const err = document.querySelector('[role="alert" i], [class*="error" i], [data-testid*="error" i]')
      const text = (err?.textContent || '').toLowerCase()
      return text.includes('sign in') || text.includes('login') || text.includes('authenticate')
    })

    if (hadAuthError) {
      throw new Error('Authentication error appeared when sending anonymous message')
    }

    return 0
  } catch (err) {
    console.error('[smoke] failure:', err?.message || err)
    return 1
  } finally {
    try { await sh.close() } catch {}
  }
}

run().then((code) => process.exit(code))
