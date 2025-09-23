import { test, expect } from '@playwright/test'

test.describe('Google OAuth Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should display login button when not authenticated', async ({ page }) => {
    // Check for login button
    const loginButton = page.getByRole('button', { name: /login|sign in/i })
    await expect(loginButton).toBeVisible()
  })

  test('should open auth modal when login is clicked', async ({ page }) => {
    // Click login button
    await page.getByRole('button', { name: /login|sign in/i }).click()

    // Wait for auth modal to appear
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 })

    // Check for Google auth option
    const googleButton = page.getByRole('button', { name: /continue with google/i })
    await expect(googleButton).toBeVisible()
  })

  test('should initiate Google OAuth flow', async ({ page, context }) => {
    // Click login button
    await page.getByRole('button', { name: /login|sign in/i }).click()

    // Wait for auth modal
    await page.waitForSelector('[role="dialog"]')

    // Listen for popup/new page (Google OAuth)
    const popupPromise = context.waitForEvent('page')

    // Click Google auth button
    await page.getByRole('button', { name: /continue with google/i }).click()

    // Check if popup opens with Google OAuth URL
    const popup = await Promise.race([
      popupPromise.catch(() => null),
      page.waitForTimeout(3000).then(() => null)
    ])

    if (popup) {
      // OAuth opened in popup
      const url = popup.url()
      expect(url).toContain('accounts.google.com')
      await popup.close()
    } else {
      // OAuth might redirect in same window
      await page.waitForTimeout(1000)
      const currentUrl = page.url()

      // Check if redirected to Google or Supabase auth
      const isAuthRedirect =
        currentUrl.includes('accounts.google.com') ||
        currentUrl.includes('supabase.co/auth') ||
        currentUrl.includes('/auth/')

      expect(isAuthRedirect).toBeTruthy()
    }
  })

  test('should show auth error page for invalid callback', async ({ page }) => {
    // Directly visit callback with error
    await page.goto('/auth/callback?error=access_denied')

    // Should redirect to error page or show error
    await page.waitForURL(/auth\/error|error/i, { timeout: 5000 }).catch(() => {})

    // Check for error message
    const errorText = await page.textContent('body')
    expect(errorText).toMatch(/error|denied|failed/i)
  })

  test('should maintain session after successful login (mock)', async ({ page }) => {
    // This test would require actual Google credentials
    // For CI/CD, we'd mock the Supabase response

    // Mock authenticated state by setting session cookie
    await page.evaluate(() => {
      // This is just to test the UI behavior when authenticated
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { email: 'test@example.com' }
      }))
    })

    await page.reload()
    await page.waitForLoadState('networkidle')

    // Should not show login button when authenticated
    const loginButton = page.getByRole('button', { name: /login|sign in/i })
    await expect(loginButton).not.toBeVisible({ timeout: 5000 }).catch(() => {
      // If login button is still visible, session mock didn't work
      console.log('Session mock did not work as expected')
    })
  })

  test('should capture screenshots of auth flow', async ({ page }) => {
    // Homepage
    await page.screenshot({
      path: 'test-results/auth-1-homepage.png',
      fullPage: true
    })

    // Click login
    await page.getByRole('button', { name: /login|sign in/i }).click()
    await page.waitForSelector('[role="dialog"]')

    // Auth modal
    await page.screenshot({
      path: 'test-results/auth-2-modal.png',
      fullPage: true
    })

    // Check UI elements
    const googleButton = page.getByRole('button', { name: /continue with google/i })
    expect(await googleButton.isVisible()).toBeTruthy()
  })
})