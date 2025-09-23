import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should show Google sign-in instead of dev auth', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000')

    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Check that dev auth elements are NOT present
    const devAuthEmail = page.locator('text=guest@dev.local')
    await expect(devAuthEmail).not.toBeVisible()

    const proDevEmail = page.locator('text=pro@dev.local')
    await expect(proDevEmail).not.toBeVisible()

    // Click on the Login link in the header
    const loginLink = page.locator('text=Login').first()
    await expect(loginLink).toBeVisible()
    await loginLink.click()

    // Wait for navigation to login page
    await page.waitForURL('**/auth')

    // Check for Google sign-in button on the login page
    const googleSignIn = page.locator('button:has-text("Continue with Google")')
    await expect(googleSignIn).toBeVisible()

    // Verify the button is ready and would trigger OAuth
    // We can't actually follow the OAuth redirect in tests, but we verify the button exists
    await expect(googleSignIn).toBeEnabled()

    console.log('✅ Authentication flow test passed - no dev auth found, Google OAuth button ready')
  })

  test('should not have any dev auth references in the UI', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')

    // Search for any dev auth related text
    const pageContent = await page.content()

    // These should NOT be present
    expect(pageContent).not.toContain('guest@dev.local')
    expect(pageContent).not.toContain('Dev Mode')
    expect(pageContent).not.toContain('DEV_AUTH')

    console.log('✅ No dev auth references found in UI')
  })
})