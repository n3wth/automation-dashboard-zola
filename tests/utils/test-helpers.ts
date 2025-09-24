import { Page, expect } from '@playwright/test'

export class TestHelpers {
  constructor(private page: Page) {}

  getChatInput() {
    return this.page.getByTestId('chat-input-textarea').first()
  }

  getSendButton() {
    return this.page.getByTestId('send-button').first()
  }

  // Navigation helpers
  async navigateToChat(chatId: string) {
    await this.page.goto(`/c/${chatId}`)
    await this.waitForPageLoad()
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle')

    // Wait for Next.js hydration to complete
    await this.page.waitForFunction(() => {
      // Check if the page is interactive and hydrated
      if (document.readyState !== 'complete') return false

      // Look for Next.js hydration markers
      const hasNextRoot = document.querySelector('#__next') !== null
      const hasReactRoot = document.querySelector('[data-reactroot]') !== null

      // Check if React has finished hydrating by looking for interactive elements
      const hasInteractiveElements = document.querySelector('button, input, textarea, [role="button"]') !== null

      return (hasNextRoot || hasReactRoot) && hasInteractiveElements
    }, { timeout: 15000 }).catch(() => {
      console.log('Hydration check timed out, proceeding anyway')
    })

    // Additional wait for any remaining async operations
    await this.page.waitForTimeout(1000)
  }

  // Chat helpers
  async waitForChatInterface() {
    const chatInput = this.getChatInput()
    await expect(chatInput).toBeVisible({ timeout: 10000 })
    await expect(chatInput).toBeEnabled({ timeout: 10000 })
    await expect(this.page.locator('[role="main"], main, .chat-container')).toBeVisible({ timeout: 5000 })
  }

  async sendMessage(message: string) {
    const textarea = this.getChatInput()
    await textarea.fill(message)

    const sendButton = this.getSendButton()
    if (await sendButton.isVisible()) {
      await expect(sendButton).toBeEnabled({ timeout: 5000 })
      try {
        await sendButton.click()
        return
      } catch (error) {
        // Fall back to keyboard interaction if the click fails
        console.warn('Falling back to keyboard submission:', error)
      }
    }

    await textarea.press('Enter')
  }

  async waitForResponse() {
    // Wait for loading indicator to appear and disappear
    await this.page.waitForSelector('[class*="loading"], [class*="thinking"], [aria-label*="loading"]', {
      state: 'visible',
      timeout: 5000
    }).catch(() => {})

    await this.page.waitForSelector('[class*="loading"], [class*="thinking"], [aria-label*="loading"]', {
      state: 'hidden',
      timeout: 30000
    }).catch(() => {})
  }

  // Auth helpers
  async login() {
    // Try real sign-in at /auth using env-provided creds. Falls back to a light mock.
    await this.page.goto('/auth')
    await this.waitForPageLoad()

    const email = process.env.BOB_AUTH_EMAIL || process.env.E2E_AUTH_EMAIL
    const password = process.env.BOB_AUTH_PASSWORD || process.env.E2E_AUTH_PASSWORD

    if (email && password) {
      // Fill the real form
      const emailInput = this.page.locator('input[type="email"], input[placeholder*="email" i]').first()
      const passwordInput = this.page.locator('input[type="password"]').first()

      await emailInput.fill(email)
      await passwordInput.fill(password)

      // Click the submit button (Sign In / Create Account)
      const submit = this.page.locator('button:has-text("Sign In"), button:has-text("Create Account")').first()
      if (await submit.isVisible()) {
        await submit.click()
      } else {
        // If button locator fails, submit the form via Enter as a fallback
        await passwordInput.press('Enter')
      }

      // Wait for possible redirect/home
      await this.page.waitForTimeout(1500)
      const atHome = this.page.url().endsWith('/') || this.page.url().includes('/c/')
      const userVisible = await this.page.locator('[data-testid="user-menu"], .user-avatar').first().isVisible().catch(() => false)
      if (atHome || userVisible) {
        return
      }
    }

    // Fallback: set a minimal mock token for UI that checks localStorage only.
    // Note: This does not hydrate server-side user; tests that truly need auth
    // should run with real credentials in .env.local.
    await this.page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'e2e-mock-user', email: 'e2e@mock.local' }
      }))
    })
    await this.page.goto('/')
    await this.waitForPageLoad()
  }

  async logout() {
    // This is a placeholder implementation.
    // The actual logout process might be different.
    await this.page.goto('/auth/logout')
    await this.waitForPageLoad()
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      // Check for common auth indicators
      const authIndicators = [
        '[data-testid="user-menu"]',
        '[aria-label*="user"]',
        '.user-avatar',
        '[href*="logout"]'
      ]

      for (const selector of authIndicators) {
        const element = await this.page.locator(selector).first()
        if (await element.isVisible()) return true
      }
      return false
    } catch {
      return false
    }
  }

  // Visual helpers
  async hideVariableContent() {
    // Hide timestamps, dynamic IDs, etc. for consistent screenshots
    await this.page.addStyleTag({
      content: `
        [data-testid="timestamp"],
        .timestamp,
        [class*="time"],
        [data-time] {
          visibility: hidden !important;
        }
      `
    })
  }

  // Error helpers
  async checkForErrors() {
    const errors = await this.page.evaluate(() => {
      const globalWindow = window as typeof window & {
        __playwrightErrors?: unknown[]
      }
      return globalWindow.__playwrightErrors ?? []
    })
    return errors
  }

  // Performance helpers
  async measureLoadTime(): Promise<number> {
    return await this.page.evaluate(() => {
      return performance.timing.loadEventEnd - performance.timing.navigationStart
    })
  }
}

// Global test data
export const TEST_DATA = {
  chatIds: {
    automation: '6acac358-0e13-42c5-817c-cb3130fe659e',
    general: 'test-chat-id-general',
  },
  users: {
    testUser: {
      email: 'test@example.com',
      password: 'testpassword123'
    }
  },
  messages: {
    simple: 'Hello, this is a test message.',
    complex: 'Can you help me with a complex task that involves multiple steps?',
    codeRequest: 'Write a simple React component for me.'
  }
}
