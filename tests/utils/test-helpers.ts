import { Page, expect } from '@playwright/test'

export class TestHelpers {
  constructor(private page: Page) {}

  // Navigation helpers
  async navigateToChat(chatId: string) {
    await this.page.goto(`/c/${chatId}`)
    await this.waitForPageLoad()
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle')
    // Wait for React hydration
    await this.page.waitForFunction(() => window.React !== undefined, { timeout: 10000 }).catch(() => {})
  }

  // Chat helpers
  async waitForChatInterface() {
    await expect(this.page.locator('textarea')).toBeVisible({ timeout: 10000 })
    await expect(this.page.locator('[role="main"], main, .chat-container')).toBeVisible({ timeout: 5000 })
  }

  async sendMessage(message: string) {
    const textarea = this.page.locator('textarea')
    await textarea.fill(message)
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
      const consoleErrors = (window as any).__playwrightErrors || []
      return consoleErrors
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