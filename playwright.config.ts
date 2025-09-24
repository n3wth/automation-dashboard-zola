import { defineConfig, devices } from '@playwright/test'
import fs from 'fs'
import path from 'path'

// Lightweight .env loader so Playwright picks up .env.local without extra deps
function loadEnv(file: string) {
  const abs = path.resolve(process.cwd(), file)
  if (!fs.existsSync(abs)) return
  const content = fs.readFileSync(abs, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

// Load env in priority order: .env.local then .env
loadEnv('.env.local')
loadEnv('.env')

const e2ePort = process.env.E2E_PORT ?? '3100'
const e2eBaseUrl = `http://127.0.0.1:${e2ePort}`

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4, // More workers for better parallelization
  timeout: 90 * 1000, // 90s for unstable app
  expect: { timeout: 15 * 1000 }, // 15s for individual assertions
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],

  use: {
    baseURL: e2eBaseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10 * 1000, // 10s for individual actions
    navigationTimeout: 30 * 1000, // 30s for navigation
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: `npm run dev -- --port=${e2ePort}`,
    url: e2eBaseUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000, // 3 minutes for unstable server startup
    stderr: 'pipe',
    stdout: 'pipe',
    env: (() => {
      const env: Record<string, string> = {
        NODE_ENV: 'test', // Use test environment
        PORT: e2ePort,
      }
      // Pass through only if defined so we don't override .env.local
      const keys = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE',
        'CSRF_SECRET',
        'ENCRYPTION_KEY',
      ]
      for (const k of keys) {
        if (process.env[k]) env[k] = process.env[k] as string
      }
      return env
    })(),
  },
})
