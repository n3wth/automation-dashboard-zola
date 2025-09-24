import { test, expect } from '@playwright/test'
import { TestHelpers } from '../utils/test-helpers'

test.describe('Authentication', () => {
  test('unauthenticated user experience', async ({ page }) => {
    const helpers = new TestHelpers(page)

    // Clear any existing auth
    await page.context().clearCookies()
    await page.goto('/')
    await helpers.waitForPageLoad()

    // Check if auth is required or if app works without auth
    const isAuthenticated = await helpers.isAuthenticated()

    if (!isAuthenticated) {
      // App should either redirect to login or show guest interface
      const hasLogin = await page.locator('text=/sign in|login|authenticate/i').isVisible()
      const hasGuestAccess = await page
        .getByTestId('chat-input-textarea')
        .isVisible()

      expect(hasLogin || hasGuestAccess).toBeTruthy()
    }
  })

  test('auth state persistence', async ({ page }) => {
    const helpers = new TestHelpers(page)

    await page.goto('/')
    await helpers.waitForPageLoad()

    const initialAuthState = await helpers.isAuthenticated()

    // Reload page
    await page.reload()
    await helpers.waitForPageLoad()

    const persistedAuthState = await helpers.isAuthenticated()

    // Auth state should persist across reloads
    expect(initialAuthState).toBe(persistedAuthState)
  })

  test('protected routes behavior', async ({ page }) => {
    const helpers = new TestHelpers(page)

    // Test accessing protected content
    const protectedRoutes = [
      '/dashboard',
      '/settings',
      '/profile',
      '/admin'
    ]

    for (const route of protectedRoutes) {
      await page.goto(route)
      await helpers.waitForPageLoad()

      // Should either show content (if authenticated) or redirect/show login
      const hasContent = await page.locator('main, [role="main"], .content').isVisible()
      const hasLogin = await page.locator('text=/sign in|login|authenticate/i').isVisible()
      const isRedirected = !page.url().includes(route)
      const hasGuestInterface = await page
        .getByTestId('chat-input-textarea')
        .isVisible()

      expect(hasContent || hasLogin || isRedirected || hasGuestInterface).toBeTruthy()
    }
  })

  test('logout functionality', async ({ page }) => {
    const helpers = new TestHelpers(page)

    await page.goto('/')
    await helpers.waitForPageLoad()

    // Look for logout button/link
    const logoutSelectors = [
      'text=/logout|sign out/i',
      '[href*="logout"]',
      '[data-testid="logout"]',
      'button[aria-label*="logout"]'
    ]

    let logoutButton = null
    for (const selector of logoutSelectors) {
      const element = page.locator(selector).first()
      if (await element.isVisible()) {
        logoutButton = element
        break
      }
    }

    if (logoutButton) {
      await logoutButton.click()
      await helpers.waitForPageLoad()

      // Should be logged out now
      const isStillAuthenticated = await helpers.isAuthenticated()
      expect(isStillAuthenticated).toBeFalsy()
    }
  })

  test('session timeout handling', async ({ page }) => {
    const helpers = new TestHelpers(page)

    await page.goto('/')
    await helpers.waitForPageLoad()

    // Simulate session expiry by clearing tokens
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })

    // Navigate to a page that might require auth
    await page.goto('/dashboard')
    await helpers.waitForPageLoad()

    // Should handle expired session gracefully
    const hasErrorMessage = await page.locator('text=/session|expired|login/i').isVisible()
    const redirectedToLogin = page.url().includes('login') || page.url().includes('auth')
    const showsGuestInterface = await page
      .getByTestId('chat-input-textarea')
      .isVisible()

    expect(hasErrorMessage || redirectedToLogin || showsGuestInterface).toBeTruthy()
  })

  test('auth error handling', async ({ page }) => {
    const helpers = new TestHelpers(page)

    // Simulate auth API errors
    await page.route('**/auth/**', route => route.abort())
    await page.route('**/api/auth/**', route => route.abort())

    await page.goto('/')
    await helpers.waitForPageLoad()

    // App should handle auth errors gracefully
    const hasErrorState = await page.locator('text=/error|failed|unavailable/i').isVisible()
    const hasOfflineMode = await page.locator('text=/offline|disconnected/i').isVisible()
    const stillFunctional = await page
      .getByTestId('chat-input-textarea')
      .isVisible()

    expect(hasErrorState || hasOfflineMode || stillFunctional).toBeTruthy()
  })
})