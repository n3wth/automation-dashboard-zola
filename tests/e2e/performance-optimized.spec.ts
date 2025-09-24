import { test, expect } from '@playwright/test'
import { TestHelpers, TEST_DATA } from '../utils/test-helpers'

type PerformanceWithMemory = Performance & {
  memory?: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  }
}

// Optimized performance tests - reduced scope and faster execution
test.describe('Performance Tests', () => {
  // Set shorter timeouts for performance tests
  test.setTimeout(30000) // 30 seconds max per test

  test('critical web vitals', async ({ page }) => {

    // Measure page load performance
    await page.goto('/', { waitUntil: 'domcontentloaded' }) // Don't wait for all resources

    // Quick check for critical elements
    await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 5000 })

    // Simplified web vitals check
    const metrics = await page.evaluate(() => {
      const perf = window.performance
      const navigation = perf.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

      return {
        domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
        loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart
      }
    })

    // Assert reasonable metrics
    expect(metrics.domContentLoaded).toBeLessThan(3000) // 3s for DOM content
    expect(metrics.loadComplete).toBeLessThan(5000) // 5s for full load
  })

  test('chat responsiveness', async ({ page }) => {
    const helpers = new TestHelpers(page)

    await helpers.navigateToChat(TEST_DATA.chatIds.automation)
    await helpers.waitForChatInterface()

    // Quick input performance check
    const textarea = helpers.getChatInput()

    // Type a short message
    const startType = Date.now()
    await textarea.fill('Test message')
    const typeTime = Date.now() - startType

    expect(typeTime).toBeLessThan(1000) // Should type quickly

    // Check send button is responsive
    const sendButton = helpers.getSendButton()
    await expect(sendButton).toBeEnabled({ timeout: 1000 })
  })

  test('memory baseline', async ({ page }) => {
    // Skip memory test in CI if not Chrome
    if (process.env.CI && !page.context().browser()?.browserType().name().includes('chromium')) {
      test.skip()
    }

    await page.goto('/', { waitUntil: 'domcontentloaded' })

    // Simple memory check
    const memory = await page.evaluate(() => {
      const perf = performance as PerformanceWithMemory
      return perf.memory?.usedJSHeapSize ?? 0
    })

    // Just ensure memory is reasonable (not checking growth)
    expect(memory).toBeGreaterThan(0)
    expect(memory).toBeLessThan(200 * 1024 * 1024) // Less than 200MB initial
  })
})
