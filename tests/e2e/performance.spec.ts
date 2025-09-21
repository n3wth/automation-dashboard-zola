import { test, expect } from '@playwright/test'
import { TestHelpers, TEST_DATA } from '../utils/test-helpers'

test.describe('Performance Tests', () => {
  test('page load performance', async ({ page }) => {
    const helpers = new TestHelpers(page)

    const startTime = Date.now()
    await page.goto('/')
    await helpers.waitForPageLoad()
    const loadTime = Date.now() - startTime

    // Page should load within reasonable time (adjust threshold as needed)
    expect(loadTime).toBeLessThan(5000) // 5 seconds

    // Check Core Web Vitals
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals: any = {}

        // First Contentful Paint
        if ('performance' in window && 'getEntriesByType' in window.performance) {
          const paintEntries = window.performance.getEntriesByType('paint')
          const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')
          if (fcpEntry) vitals.fcp = fcpEntry.startTime
        }

        // Largest Contentful Paint
        if ('PerformanceObserver' in window) {
          try {
            new PerformanceObserver((list) => {
              const entries = list.getEntries()
              const lastEntry = entries[entries.length - 1]
              vitals.lcp = lastEntry.startTime
              resolve(vitals)
            }).observe({ entryTypes: ['largest-contentful-paint'] })

            // Fallback timeout
            setTimeout(() => resolve(vitals), 2000)
          } catch {
            resolve(vitals)
          }
        } else {
          resolve(vitals)
        }
      })
    })

    console.log('Web Vitals:', webVitals)

    // Assert reasonable performance metrics
    if (webVitals.fcp) {
      expect(webVitals.fcp).toBeLessThan(2000) // FCP < 2s
    }
    if (webVitals.lcp) {
      expect(webVitals.lcp).toBeLessThan(4000) // LCP < 4s
    }
  })

  test('chat response time', async ({ page }) => {
    const helpers = new TestHelpers(page)

    await helpers.navigateToChat(TEST_DATA.chatIds.automation)
    await helpers.waitForChatInterface()

    const startTime = Date.now()
    await helpers.sendMessage(TEST_DATA.messages.simple)

    // Wait for response to start (loading indicator)
    await page.waitForSelector('[class*="loading"], [class*="thinking"]', {
      state: 'visible',
      timeout: 10000
    }).catch(() => {})

    const responseStartTime = Date.now() - startTime

    // Response should start within reasonable time
    expect(responseStartTime).toBeLessThan(3000) // 3 seconds to start responding

    await helpers.waitForResponse()
    const totalResponseTime = Date.now() - startTime

    console.log(`Response start time: ${responseStartTime}ms`)
    console.log(`Total response time: ${totalResponseTime}ms`)

    // Total response should complete within reasonable time (adjust based on your AI provider)
    expect(totalResponseTime).toBeLessThan(30000) // 30 seconds max
  })

  test('memory usage', async ({ page }) => {
    const helpers = new TestHelpers(page)

    await page.goto('/')
    await helpers.waitForPageLoad()

    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null
    })

    if (initialMemory) {
      console.log('Initial memory usage:', initialMemory)

      // Perform some interactions
      await helpers.navigateToChat(TEST_DATA.chatIds.automation)
      await helpers.waitForChatInterface()
      await helpers.sendMessage(TEST_DATA.messages.simple)
      await helpers.waitForResponse()

      // Check memory after interactions
      const finalMemory = await page.evaluate(() => {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        }
      })

      console.log('Final memory usage:', finalMemory)

      // Memory shouldn't grow excessively
      const memoryGrowth = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024) // Less than 50MB growth
    }
  })

  test('bundle size impact', async ({ page }) => {
    const helpers = new TestHelpers(page)

    // Track network requests to measure bundle size
    const networkRequests: any[] = []

    page.on('response', response => {
      if (response.url().includes('/_next/static/') || response.url().includes('.js') || response.url().includes('.css')) {
        networkRequests.push({
          url: response.url(),
          size: response.headers()['content-length'],
          type: response.url().includes('.js') ? 'js' : response.url().includes('.css') ? 'css' : 'other'
        })
      }
    })

    await page.goto('/')
    await helpers.waitForPageLoad()

    // Calculate total bundle size
    const totalSize = networkRequests.reduce((total, req) => {
      const size = parseInt(req.size || '0', 10)
      return total + size
    }, 0)

    console.log('Network requests:', networkRequests.length)
    console.log('Total bundle size:', Math.round(totalSize / 1024), 'KB')

    // Assert reasonable bundle size (adjust based on your app's needs)
    expect(totalSize).toBeLessThan(5 * 1024 * 1024) // Less than 5MB total
  })

  test('multiple tabs performance', async ({ browser }) => {
    const helpers1 = new TestHelpers(await browser.newPage())
    const helpers2 = new TestHelpers(await browser.newPage())

    // Open same chat in multiple tabs
    await Promise.all([
      helpers1.navigateToChat(TEST_DATA.chatIds.automation),
      helpers2.navigateToChat(TEST_DATA.chatIds.automation)
    ])

    await Promise.all([
      helpers1.waitForChatInterface(),
      helpers2.waitForChatInterface()
    ])

    // Send messages from both tabs
    const startTime = Date.now()
    await Promise.all([
      helpers1.sendMessage('Message from tab 1'),
      helpers2.sendMessage('Message from tab 2')
    ])

    await Promise.all([
      helpers1.waitForResponse(),
      helpers2.waitForResponse()
    ])

    const totalTime = Date.now() - startTime

    // Multiple tabs shouldn't significantly impact performance
    expect(totalTime).toBeLessThan(45000) // 45 seconds for both responses

    await helpers1.page.close()
    await helpers2.page.close()
  })

  test('rapid interactions performance', async ({ page }) => {
    const helpers = new TestHelpers(page)

    await helpers.navigateToChat(TEST_DATA.chatIds.automation)
    await helpers.waitForChatInterface()

    const textarea = page.locator('textarea')

    // Rapid typing simulation
    const startTime = Date.now()
    for (let i = 0; i < 100; i++) {
      await textarea.type('a')
      if (i % 10 === 0) {
        await page.waitForTimeout(10) // Small pause to let React update
      }
    }
    const typingTime = Date.now() - startTime

    console.log(`Rapid typing time: ${typingTime}ms`)

    // Should handle rapid input without significant lag
    expect(typingTime).toBeLessThan(5000) // 5 seconds for 100 characters

    // UI should still be responsive
    await expect(textarea).toHaveValue('a'.repeat(100))
  })
})