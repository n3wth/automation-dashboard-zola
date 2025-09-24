import { defineConfig, devices } from '@playwright/test'

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
    env: {
      NODE_ENV: 'test', // Use test environment
      PORT: e2ePort,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'test-anon-key',
      SUPABASE_SERVICE_ROLE: process.env.SUPABASE_SERVICE_ROLE ?? 'test-service-role',
      CSRF_SECRET: process.env.CSRF_SECRET ?? '0123456789abcdef0123456789abcdef',
      ENCRYPTION_KEY:
        process.env.ENCRYPTION_KEY ?? 'c2ltcGxlLXRlc3QtZW5jcnlwdGlvbi1rZXkzMg==',
    },
  },
})