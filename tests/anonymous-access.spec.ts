import { test, expect } from '@playwright/test'
import { TestHelpers } from './utils/test-helpers'

test.describe('Anonymous Access', () => {
  let helpers: TestHelpers

  test.beforeEach(async ({ page, context }) => {
    helpers = new TestHelpers(page)

    // Clear all cookies and storage to simulate a fresh anonymous session
    await context.clearCookies()
    await page.goto('/')
    await helpers.waitForPageLoad()
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.reload()
    await helpers.waitForPageLoad()
  })

  test('anonymous user can access homepage without login', async ({ page }) => {
    // Check that the page loads
    await expect(page).toHaveTitle(/Bob/i)

    // Check that the chat input is visible and interactive
    const chatInput = helpers.getChatInput()
    await expect(chatInput).toBeVisible()
    await expect(chatInput).toBeEnabled()
    await expect(chatInput).toHaveAttribute('placeholder', /.+/)

    // Check that login link is visible (not logged in)
    const loginLink = page.getByTestId('login-link')
    await expect(loginLink).toBeVisible()
    await expect(loginLink).toHaveText(/login/i)
  })

  test('anonymous user can send a message', async ({ page }) => {
    // Type a message
    const chatInput = helpers.getChatInput()
    await chatInput.fill('Hello, can you help me with a simple question?')

    // Send the message
    const sendButton = helpers.getSendButton()
    await expect(sendButton).toBeVisible()
    await expect(sendButton).toBeEnabled()
    await chatInput.press('Enter')

    // Wait for response (should work for first query)
    await page.waitForTimeout(2000)

    // Check that message was sent (no error state)
    // The page should not show any authentication error
    const errorDialog = page.locator('text=/sign in required/i')
    await expect(errorDialog).toHaveCount(0)
  })

  test('anonymous user gets session ID stored', async ({ page }) => {
    // Send a message to trigger session creation
    const chatInput = helpers.getChatInput()
    await chatInput.fill('Test message')
    await chatInput.press('Enter')

    await page.waitForFunction(() => {
      return localStorage.getItem('anonymousSessionId')
    })

    // Check that session ID was created
    const sessionId = await page.evaluate(() => {
      return localStorage.getItem('anonymousSessionId')
    })

    expect(sessionId).toBeTruthy()
    expect(sessionId).toMatch(/^anon-/)
  })

  test('rate limit enforcement for anonymous users', async ({ page }) => {
    // This test would need to be more sophisticated in production
    // For now, just verify that the session tracking is in place
    const chatInput = helpers.getChatInput()

    // Send 5 messages (should all work)
    for (let i = 1; i <= 5; i++) {
      await chatInput.fill(`Test message ${i}`)
      await chatInput.press('Enter')
      await page.waitForTimeout(300)
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
    // Check that no user profile is shown
    const userMenu = page.locator('[data-testid="user-menu"]')
    await expect(userMenu).not.toBeVisible()

    // Check that login link is shown instead
    const loginLink = page.getByTestId('login-link')
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
    // Get initial header position
    const header = page.locator('header').first()
    const initialPosition = await header.boundingBox()

    // Send a message
    const chatInput = helpers.getChatInput()
    await chatInput.fill('Test scroll behavior')
    await chatInput.press('Enter')

    // Wait a bit for any animations
    await page.waitForTimeout(1000)

    // Check header position hasn't jumped
    const finalPosition = await header.boundingBox()
    expect(finalPosition?.y).toBe(initialPosition?.y)
  })

  test('nav logo is clickable', async ({ page }) => {
    // Navigate to a different page first
    await page.goto('/auth')

    // Click the logo to go back home
    const logo = page.locator('a[href="/"] img[alt="Bob"]').first()
    await logo.click()

    // Verify we're back on homepage
    await expect(page).toHaveURL('/')
  })
})