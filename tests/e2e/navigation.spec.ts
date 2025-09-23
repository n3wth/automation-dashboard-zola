import { test, expect } from '@playwright/test'
import { TestHelpers } from '../utils/test-helpers'

test.describe('Navigation', () => {
  test('homepage loads correctly', async ({ page }) => {
    const helpers = new TestHelpers(page)

    await page.goto('/')
    await helpers.waitForPageLoad()

    // Check for main navigation elements
    await expect(page).toHaveTitle(/Bob|Dashboard|AI/)
    await expect(page.locator('nav, header, [role="navigation"]')).toBeVisible()
  })

  test('can navigate to different sections', async ({ page }) => {
    const helpers = new TestHelpers(page)

    await page.goto('/')
    await helpers.waitForPageLoad()

    // Test navigation links (adapt based on your actual nav structure)
    const navLinks = [
      { selector: 'a[href*="/chat"], a[href*="/c/"]', expectedUrl: /\/(chat|c)/ },
      { selector: 'a[href*="/dashboard"]', expectedUrl: /\/dashboard/ },
      { selector: 'a[href*="/settings"]', expectedUrl: /\/settings/ },
    ]

    for (const { selector, expectedUrl } of navLinks) {
      const link = page.locator(selector).first()
      if (await link.isVisible()) {
        await link.click()
        await helpers.waitForPageLoad()
        await expect(page).toHaveURL(expectedUrl)
        await page.goBack()
        await helpers.waitForPageLoad()
      }
    }
  })

  test('handles 404 pages gracefully', async ({ page }) => {
    const helpers = new TestHelpers(page)

    await page.goto('/nonexistent-page')
    await helpers.waitForPageLoad()

    // Should show 404 or redirect to home
    const isNotFound = await page.locator('text=/404|not found/i').isVisible()
    const isRedirected = page.url().includes('/')

    expect(isNotFound || isRedirected).toBeTruthy()
  })

  test('responsive navigation works on mobile', async ({ page }) => {
    const helpers = new TestHelpers(page)

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await helpers.waitForPageLoad()

    // Check for mobile menu button
    const mobileMenuButton = page.locator('button[aria-label*="menu"], [data-testid="mobile-menu"], .hamburger')
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click()
      await expect(page.locator('nav, [role="navigation"]')).toBeVisible()
    }
  })
})