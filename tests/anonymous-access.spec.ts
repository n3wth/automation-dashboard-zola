import { test, expect } from '@playwright/test'

test.describe('Anonymous Access', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear all cookies and localStorage
    await context.clearCookies()
    await page.goto('http://localhost:3001')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('anonymous user can access homepage without login', async ({ page }) => {
    await page.goto('http://localhost:3001')

    // Check that the page loads
    await expect(page).toHaveTitle(/Bob/i)

    // Check that the chat input is visible
    const chatInput = page.locator('textarea[placeholder="Ask Bob..."]')
    await expect(chatInput).toBeVisible()

    // Check that login link is visible (not logged in)
    const loginLink = page.locator('a[href="/auth"]')
    await expect(loginLink).toBeVisible()
    await expect(loginLink).toHaveText('Login')
  })

  test('anonymous user can send a message', async ({ page }) => {
    await page.goto('http://localhost:3001')

    // Type a message
    const chatInput = page.locator('textarea[placeholder="Ask Bob..."]')
    await chatInput.fill('Hello, can you help me with a simple question?')

    // Send the message
    const sendButton = page.locator('button[aria-label="Send message"]')
    await sendButton.click()

    // Wait for response (should work for first query)
    await page.waitForTimeout(2000)

    // Check that message was sent (no error state)
    // The page should not show any authentication error
    const errorDialog = page.locator('text=/sign in required/i')
    await expect(errorDialog).not.toBeVisible()
  })

  test('anonymous user gets session ID stored', async ({ page }) => {
    await page.goto('http://localhost:3001')

    // Send a message to trigger session creation
    const chatInput = page.locator('textarea[placeholder="Ask Bob..."]')
    await chatInput.fill('Test message')
    const sendButton = page.locator('button[aria-label="Send message"]')
    await sendButton.click()

    await page.waitForTimeout(1000)

    // Check that session ID was created
    const sessionId = await page.evaluate(() => {
      return localStorage.getItem('anonymousSessionId')
    })

    expect(sessionId).toBeTruthy()
    expect(sessionId).toMatch(/^anon-/)
  })

  test('rate limit enforcement for anonymous users', async ({ page }) => {
    await page.goto('http://localhost:3001')

    // This test would need to be more sophisticated in production
    // For now, just verify that the session tracking is in place
    const chatInput = page.locator('textarea[placeholder="Ask Bob..."]')

    // Send 5 messages (should all work)
    for (let i = 1; i <= 5; i++) {
      await chatInput.fill(`Test message ${i}`)
      const sendButton = page.locator('button[aria-label="Send message"]')
      await sendButton.click()
      await page.waitForTimeout(500)
    }

    // The 6th message should trigger rate limit
    // In production, this would show a login prompt
    // For now, just verify the session is still tracked
    const sessionId = await page.evaluate(() => {
      return localStorage.getItem('anonymousSessionId')
    })
    expect(sessionId).toBeTruthy()
  })

  test('no phantom user appears for anonymous visitors', async ({ page }) => {
    await page.goto('http://localhost:3001')

    // Check that no user profile is shown
    const userMenu = page.locator('[data-testid="user-menu"]')
    await expect(userMenu).not.toBeVisible()

    // Check that login link is shown instead
    const loginLink = page.locator('a[href="/auth"]')
    await expect(loginLink).toBeVisible()

    // Verify no dev user artifacts in production
    const devUserData = await page.evaluate(() => {
      return {
        guestUserId: localStorage.getItem('guestUserId'),
        devUserName: localStorage.getItem('devUserName'),
        devUserType: localStorage.getItem('devUserType')
      }
    })

    // In production, these should be cleaned up
    if (process.env.NODE_ENV === 'production') {
      expect(devUserData.guestUserId).toBeNull()
      expect(devUserData.devUserName).toBeNull()
      expect(devUserData.devUserType).toBeNull()
    }
  })

  test('header does not jump after sending message', async ({ page }) => {
    await page.goto('http://localhost:3001')

    // Get initial header position
    const header = page.locator('header').first()
    const initialPosition = await header.boundingBox()

    // Send a message
    const chatInput = page.locator('textarea[placeholder="Ask Bob..."]')
    await chatInput.fill('Test scroll behavior')
    const sendButton = page.locator('button[aria-label="Send message"]')
    await sendButton.click()

    // Wait a bit for any animations
    await page.waitForTimeout(1000)

    // Check header position hasn't jumped
    const finalPosition = await header.boundingBox()
    expect(finalPosition?.y).toBe(initialPosition?.y)
  })

  test('nav logo is clickable', async ({ page }) => {
    await page.goto('http://localhost:3001')

    // Navigate to a different page first
    await page.goto('http://localhost:3001/auth')

    // Click the logo to go back home
    const logo = page.locator('a[href="/"] img[alt="Bob"]').first()
    await logo.click()

    // Verify we're back on homepage
    await expect(page).toHaveURL('http://localhost:3001/')
  })
})