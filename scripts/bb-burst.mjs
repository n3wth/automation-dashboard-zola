#!/usr/bin/env node
// Concurrent Browserbase burst runner
// Usage: node scripts/bb-burst.mjs --n 10 --engine gm --flow mix
// flows: smoke (home+anon), full (home+auth+anon+settings), mix (varied scenarios)

import { Stagehand } from '@browserbasehq/stagehand'
import { execSync } from 'node:child_process'

async function llmTitle({ kind, engine, flow, n, details }) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('no-openai-key')
    const prompt = `Write a concise, descriptive GitHub issue title in Title Case summarizing ${kind} from Browserbase burst.
Engine: ${engine}. Flow: ${flow}. Tasks: ${n}.
Observations:
${details}
Constraints:
- Keep under 90 characters.
- Start with a category word (e.g., UX:, Monitoring:, Auth:, Performance:).
- No trailing punctuation.`
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.LLM_TITLE_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an assistant that writes concise, high-signal GitHub issue titles.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 40
      })
    })
    const data = await res.json()
    const title = data?.choices?.[0]?.message?.content?.trim()
    if (title && title.length > 0) return title
    throw new Error('empty-title')
  } catch (e) {
    // Fallback heuristic
    if (kind === 'UX') {
      const first = (details || '').split('\n').find(Boolean) || 'UX observations'
      return `UX: ${first.substring(0, 70)}`
    }
    const first = (details || '').split('\n').find(Boolean) || 'Burst failures'
    return `Monitoring: ${first.substring(0, 70)}`
  }
}

function ensureLabel(name, desc, color) {
  try { execSync(`gh label create ${JSON.stringify(name)} -d ${JSON.stringify(desc)} -c ${JSON.stringify(color)}`, { stdio: 'ignore' }) } catch {}
}

function createOrUpdateIssue({ title, body, labels = [], dedupeKey }) {
  try {
    // Ensure base labels exist
    ensureLabel('monitoring', 'Automated monitoring and smoke test failures', '#fbca04')
    ensureLabel('ux', 'User experience improvements', '#f9d0c4')
    // Engine labels for triage
    ensureLabel('engine:c', 'OpenAI engine', '#ededed')
    ensureLabel('engine:gm', 'Gemini engine', '#e0f7fa')
    ensureLabel('engine:cc', 'Claude engine', '#e8eaf6')

    const labelArgs = labels.map(l => `--label ${JSON.stringify(l)}`).join(' ')
    // Look for an existing open issue with the same dedupe key in body
    const q = `gh issue list --state open --search ${JSON.stringify(dedupeKey + ' in:body')} --json number --jq '.[0].number'`
    const existing = execSync(q, { encoding: 'utf8' }).trim()
    if (existing) {
      execSync(`gh issue comment ${existing} --body ${JSON.stringify(body)}`, { stdio: 'ignore' })
      return existing
    }
    execSync(`gh issue create --title ${JSON.stringify(title)} --body ${JSON.stringify(body + "\n\n[dedupe]: " + dedupeKey)} ${labelArgs}`, { stdio: 'ignore' })
    return null
  } catch (e) {
    console.error('createOrUpdateIssue error:', e?.message || e)
    return null
  }
}

function arg(k, d) {
  const ix = process.argv.findIndex(a => a === `--${k}`)
  return ix >= 0 && process.argv[ix + 1] ? process.argv[ix + 1] : d
}

const N = parseInt(arg('n', process.env.BB_BURST_N || '10'), 10)
const ENGINE = arg('engine', process.env.RUNNER_ENGINE || 'gm')
const FLOW = (arg('flow', 'mix')).toLowerCase()

function resolveModel(engine) {
  switch ((engine || '').toLowerCase()) {
    case 'gm': return process.env.SMOKE_MODEL || 'google/gemini-2.5-flash-preview-05-20'
    case 'cc': return process.env.SMOKE_MODEL || 'anthropic/claude-3-5-sonnet-20240620'
    case 'c': default: return process.env.SMOKE_MODEL || (process.env.OPENAI_API_KEY ? 'openai/gpt-4o-mini' : 'google/gemini-2.5-flash-preview-05-20')
  }
}
function resolveApiKey(engine) {
  const m = (engine || '').toLowerCase()
  if (m === 'gm' && process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY
  if (m === 'cc' && process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY
  return process.env.OPENAI_API_KEY || process.env.GOOGLE_API_KEY || process.env.ANTHROPIC_API_KEY
}

async function smokeHome(page) {
  const url = process.env.SMOKE_URL || 'https://bob.newth.ai'
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  const ok = await page.evaluate(() => {
    const header = document.querySelector('header, [role="banner"], nav')
    const login = document.querySelector('[data-testid="login-link"], a[href*="auth" i]')
    const vis = el => !!el && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)
    return vis(header) && vis(login)
  })
  if (!ok) throw new Error('home: header/login missing')
}
async function anonChat(page) {
  try { await page.act('Type "Burst hello" into the message input'); await page.act('Click the send message button') } catch {}
  await page.waitForTimeout(1000)
  const hadAuthError = await page.evaluate(() => {
    const e = document.querySelector('[role="alert" i],[class*="error" i],[data-testid*="error" i]')
    const t = (e?.textContent || '').toLowerCase()
    return t.includes('sign in') || t.includes('login')
  })
  if (hadAuthError) throw new Error('anon: auth error after send')
}
async function authIfCreds(page) {
  const email = process.env.BOB_AUTH_EMAIL, password = process.env.BOB_AUTH_PASSWORD
  if (!email || !password) return false
  await page.goto((process.env.SMOKE_URL || 'https://bob.newth.ai') + '/auth', { waitUntil: 'domcontentloaded' })
  await page.evaluate(({ email, password }) => {
    const e = document.querySelector('input[type="email"], input[placeholder*="Email" i]')
    const p = document.querySelector('input[type="password"], input[placeholder*="Password" i]')
    if (e && 'value' in e) e.value = email
    if (p && 'value' in p) p.value = password
  }, { email, password })
  try { await page.act('Click the Sign In button') } catch { await page.evaluate(() => document.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))) }
  await page.waitForTimeout(1500)
  return await page.evaluate(() => !!document.querySelector('[data-testid="user-menu"], .user-avatar'))
}
async function settingsIfAuthed(page) {
  const canOpen = await page.evaluate(() => !!document.querySelector('[data-testid="user-menu"], .user-avatar'))
  if (!canOpen) return false
  try { await page.act('Click the settings button or settings nav link') } catch {}
  await page.waitForTimeout(800)
  const opened = await page.evaluate(() => !!document.querySelector('[role="dialog"], [class*="settings"]'))
  if (!opened) throw new Error('settings: not visible')
  return true
}

async function llmDynamicPlanShort() {
  const apiKey = process.env.OPENAI_API_KEY
  const fallback = [
    'Open the model selector',
    'Choose a different model from the list',
    'Type "What are two speedups for CI?" into the message input',
    'Click the send message button',
  ]
  try {
    if (!apiKey) throw new Error('no-openai-key')
    const prompt = `Return a JSON array of 4-8 short, concrete UI actions for a chat app that vary behavior. Keep each action imperative and directly executable, e.g. "Open the model selector", "Choose a different model from the list", "Open the settings button or settings nav link", "Open the user or app menu", "Open the About or App Info dialog", "Type \"...\" into the message input", "Click the send message button". Return ONLY JSON.`
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.LLM_TITLE_MODEL || 'gpt-4o-mini', messages: [ { role:'system', content:'Output only a JSON array of strings.' }, { role:'user', content: prompt } ], temperature: 0.4, max_tokens: 200 })
    })
    const data = await res.json()
    let actions = []
    try { actions = JSON.parse(data?.choices?.[0]?.message?.content?.trim() || '[]') } catch { actions = [] }
    if (!Array.isArray(actions) || actions.length === 0) return fallback
    return actions.slice(0, 10)
  } catch { return fallback }
}

async function detectUX(page) {
  // Run several quick heuristics in the page context
  const warnings = await page.evaluate(() => {
    const warns = []
    try {
      // 1) Missing alt on images
      const imgs = Array.from(document.querySelectorAll('img'))
      const missingAlt = imgs.filter(img => !img.hasAttribute('alt') || img.getAttribute('alt') === '').length
      if (missingAlt > 0) warns.push(`Images without alt: ${missingAlt}`)

      // 2) Buttons without accessible name
      const buttons = Array.from(document.querySelectorAll('button, [role="button"], a[role="button"]'))
      const nameless = buttons.filter(b => {
        const hasText = (b.textContent || '').trim().length > 0
        const aria = b.getAttribute('aria-label')
        return !hasText && !(aria && aria.trim())
      }).length
      if (nameless > 0) warns.push(`Buttons without accessible name: ${nameless}`)

      // 3) Inputs without label
      const inputs = Array.from(document.querySelectorAll('input, textarea, select'))
      const hasLabel = (el) => {
        const id = el.getAttribute('id')
        if (id) {
          const lab = document.querySelector(`label[for="${CSS.escape(id)}"]`)
          if (lab && (lab.textContent || '').trim()) return true
        }
        const aria = el.getAttribute('aria-label')
        if (aria && aria.trim()) return true
        const labelledBy = el.getAttribute('aria-labelledby')
        if (labelledBy) {
          const labelEl = document.getElementById(labelledBy)
          if (labelEl && (labelEl.textContent || '').trim()) return true
        }
        return false
      }
      const unlabelledInputs = inputs.filter(el => !hasLabel(el)).length
      if (unlabelledInputs > 0) warns.push(`Inputs without label: ${unlabelledInputs}`)

      // 4) Text contrast (simple heuristic on sampled elements)
      const sampleSel = 'button, a, p, span, label, h1, h2, h3, h4'
      const nodes = Array.from(document.querySelectorAll(sampleSel)).slice(0, 80)
      const getRGB = (s) => {
        const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
        if (!m) return null
        return { r: +m[1], g: +m[2], b: +m[3] }
      }
      const luminance = ({ r, g, b }) => {
        const c = [r, g, b].map(v => {
          v /= 255
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
        })
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
      }
      const ratio = (fg, bg) => {
        const L1 = luminance(fg) + 0.05
        const L2 = luminance(bg) + 0.05
        return L1 > L2 ? L1 / L2 : L2 / L1
      }
      const bodyBg = getRGB(getComputedStyle(document.body).backgroundColor || 'rgb(255,255,255)') || { r:255,g:255,b:255 }
      let lowContrast = 0
      for (const n of nodes) {
        const cs = getComputedStyle(n)
        const col = getRGB(cs.color)
        let bg = getRGB(cs.backgroundColor)
        if (!bg || cs.backgroundColor === 'rgba(0, 0, 0, 0)' || cs.backgroundColor === 'transparent') bg = bodyBg
        if (col && bg) {
          const cr = ratio(col, bg)
          if (cr < 3.0) lowContrast++
        }
      }
      if (lowContrast > 0) warns.push(`Low-contrast text samples: ${lowContrast}`)

      // 5) Tiny clickable targets
      const smallButtons = buttons.filter(b => {
        const r = b.getBoundingClientRect()
        return r.width < 32 || r.height < 32
      }).length
      if (smallButtons > 0) warns.push(`Small tap targets (<32px): ${smallButtons}`)
    } catch (e) {
      warns.push(`UX detection error: ${String(e)}`)
    }
    return warns
  })
  return warnings
}

async function runOne(ix) {
  const modelName = resolveModel(ENGINE)
  const apiKey = resolveApiKey(ENGINE)
  const sh = new Stagehand({ env: 'BROWSERBASE', verbose: 0, modelName, disablePino: true, modelClientOptions: { apiKey } })
  const label = `[burst:${ix}]`
  const t0 = Date.now()
  try {
    await sh.init()
    const page = sh.page
    // Select scenario
    const scenario = (FLOW === 'mix') ? (ix % 10 || 10) : FLOW
    // Small random jitter
    await page.waitForTimeout(200 + Math.floor(Math.random()*400))

    // Scenario definitions
    const dashboardUrl = (process.env.SMOKE_URL || 'https://bob.newth.ai') + '/dashboard'
    const chatId = '6acac358-0e13-42c5-817c-cb3130fe659e'
    const chatUrl = (process.env.SMOKE_URL || 'https://bob.newth.ai') + '/c/' + chatId

    const scenarios = {
      1: async () => { await smokeHome(page); await anonChat(page) },
      2: async () => { await smokeHome(page); const authed = await authIfCreds(page); await anonChat(page); if (authed) await settingsIfAuthed(page) },
      3: async () => { await smokeHome(page); await page.goto(dashboardUrl, { waitUntil:'domcontentloaded' }); await page.waitForTimeout(500); await page.goto(process.env.SMOKE_URL || 'https://bob.newth.ai', { waitUntil:'domcontentloaded' }) },
      4: async () => { const authed = await authIfCreds(page); if (authed) { await settingsIfAuthed(page) } else { await anonChat(page) } },
      5: async () => { await smokeHome(page); try { await page.act('Open the model selector'); await page.act('Choose a different model from the list') } catch {} await page.waitForTimeout(400); await anonChat(page) },
      6: async () => { await smokeHome(page); try { await page.act('Type "Please summarize the benefits of parallel testing and monitoring in CI/CD pipelines in 3 bullet points" into the message input'); await page.act('Click the send message button') } catch {} await page.waitForTimeout(1200) },
      7: async () => { await page.goto(chatUrl, { waitUntil:'domcontentloaded' }); await page.waitForTimeout(600); await anonChat(page) },
      8: async () => { await smokeHome(page); try { await page.act('Open the user or app menu'); await page.act('Open the About or App Info dialog') } catch {} await page.waitForTimeout(600) },
      9: async () => { const authed = await authIfCreds(page); if (authed) { try { await page.act('Open settings'); await page.act('Switch to dark theme in appearance settings') } catch {} } else { await anonChat(page) } },
      10: async () => { await smokeHome(page); try { await page.act('Click the attach file button'); await page.waitForTimeout(400) } catch {} await anonChat(page) },
      // 11: Let the LLM choose a short dynamic plan and execute it
      11: async () => {
        await smokeHome(page)
        const plan = await llmDynamicPlanShort()
        for (const a of plan) { try { await page.act(a) } catch {} await page.waitForTimeout(400) }
      },
      'smoke': async () => { await smokeHome(page); await anonChat(page) },
      'full': async () => { await smokeHome(page); const authed = await authIfCreds(page); await anonChat(page); if (authed) await settingsIfAuthed(page) },
    }

    if (typeof scenario === 'number' && scenarios[scenario]) {
      await scenarios[scenario]()
    } else if (typeof scenario === 'string' && scenarios[scenario]) {
      await scenarios[scenario]()
    } else {
      await scenarios['smoke']()
    }

    // Append a small dynamic plan 50% of the time to increase variability
    if (Math.random() < 0.5) {
      const plan2 = await llmDynamicPlanShort()
      for (const a of plan2.slice(0, 4)) { try { await page.act(a) } catch {} await page.waitForTimeout(350) }
    }

    // UX heuristics (non-fatal): collect warnings
    const uxWarnings = await detectUX(page)

    const dt = Date.now() - t0
    console.log(`${label} OK in ${dt}ms`)
    await sh.close(); return { ok: true, ms: dt, ux: uxWarnings }
  } catch (e) {
    const dt = Date.now() - t0
    console.error(`${label} FAIL in ${dt}ms ->`, e?.message || e)
    try { await sh.close() } catch {}
    return { ok: false, ms: dt, err: String(e?.message || e) }
  }
}

(async () => {
  console.log(`Burst starting: n=${N} engine=${ENGINE} flow=${FLOW}`)
  const tasks = Array.from({ length: N }, (_, i) => runOne(i + 1))
  const res = await Promise.allSettled(tasks)
  const flat = res.map(r => r.status === 'fulfilled' ? r.value : { ok: false, ms: 0, err: String(r.reason) })
  const ok = flat.filter(x => x.ok).length
  const fail = flat.length - ok
  const avg = Math.round(flat.reduce((a, b) => a + (b.ms || 0), 0) / flat.length)
  console.log(`Burst complete: ok=${ok}, fail=${fail}, avgMs=${avg}`)
  // Aggregate UX warnings
  const uxAll = flat.filter(x => x.ux && x.ux.length).flatMap(x => x.ux)
  const uxUnique = Array.from(new Set(uxAll)).slice(0, 10)
  if (uxUnique.length > 0) {
    try {
      const ts = new Date().toISOString()
      const detailText = uxUnique.join('\n')
      const genTitle = await llmTitle({ kind: 'UX', engine: ENGINE, flow: FLOW, n: N, details: detailText })
      const body = `Automated UX heuristics detected potential issues.\n\n- Engine: ${ENGINE}\n- Flow: ${FLOW}\n- N: ${N}\n- Success: ${ok}\n- Failures: ${fail}\n- Avg ms: ${avg}\n\n**Sample observations**\n- ${uxUnique.join('\n- ')}\n\n_Timestamp: ${ts}_`
      const dedupe = `UX-${ENGINE}-${FLOW}`
      createOrUpdateIssue({ title: genTitle, body, labels: ['ux', 'monitoring', `engine:${ENGINE}`], dedupeKey: dedupe })
    } catch (e) {
      console.error('Failed to file UX observations issue:', e?.message || e)
    }
  }
  if (fail > 0) {
    try {
      const ts = new Date().toISOString()
      const sample = flat.filter(x => !x.ok).slice(0, 5).map((x,i) => `#${i+1}: ${x.err}`).join('\n') || 'n/a'
      const genTitle = await llmTitle({ kind: 'Monitoring', engine: ENGINE, flow: FLOW, n: N, details: sample })
      const body = `Automated Browserbase burst detected failures.\n\n- Engine: ${ENGINE}\n- Flow: ${FLOW}\n- N: ${N}\n- Success: ${ok}\n- Failures: ${fail}\n- Avg ms: ${avg}\n\n<details>\n<summary>Sample errors</summary>\n\n${sample}\n\n</details>\n\n_Timestamp: ${ts}_`
      const dedupe = `MONITORING-FAILURES-${ENGINE}-${FLOW}`
      createOrUpdateIssue({ title: genTitle, body, labels: ['monitoring', 'bug', `engine:${ENGINE}`], dedupeKey: dedupe })
    } catch (e) {
      console.error('Failed to file burst failures issue:', e?.message || e)
    }
  }
  process.exit(fail ? 1 : 0)
})()
