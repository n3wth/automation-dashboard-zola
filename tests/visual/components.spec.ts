import { test, expect } from '@playwright/test'
import { TestHelpers, TEST_DATA } from '../utils/test-helpers'

test.describe('Visual Regression Tests', () => {
  test('homepage layout', async ({ page }) => {
    const helpers = new TestHelpers(page)

    await page.goto('/')
    await helpers.waitForPageLoad()
    await helpers.hideVariableContent()

    // Take screenshot of full page
    await expect(page).toHaveScreenshot('homepage-desktop.png', {
      fullPage: true,
      animations: 'disabled'
    })
  })

  test('chat interface layout', async ({ page }) => {
    const helpers = new TestHelpers(page)

    await helpers.navigateToChat(TEST_DATA.chatIds.automation)
    await helpers.waitForChatInterface()
    await helpers.hideVariableContent()

    // Chat interface screenshot
    await expect(page).toHaveScreenshot('chat-interface.png', {
      fullPage: true,
      animations: 'disabled'
    })

    // Chat input area specifically
    const chatInput = page.locator('textarea').first()
    await expect(chatInput).toHaveScreenshot('chat-input.png')
  })

  test('responsive layout - mobile', async ({ page }) => {
    const helpers = new TestHelpers(page)

    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/')
    await helpers.waitForPageLoad()
    await helpers.hideVariableContent()

    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      animations: 'disabled'
    })

    // Test chat on mobile
    await helpers.navigateToChat(TEST_DATA.chatIds.automation)
    await helpers.waitForChatInterface()
    await helpers.hideVariableContent()

    await expect(page).toHaveScreenshot('chat-mobile.png', {
      fullPage: true,
      animations: 'disabled'
    })
  })

  test('responsive layout - tablet', async ({ page }) => {
    const helpers = new TestHelpers(page)

    // Tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })

    await page.goto('/')
    await helpers.waitForPageLoad()
    await helpers.hideVariableContent()

    await expect(page).toHaveScreenshot('homepage-tablet.png', {
      fullPage: true,
      animations: 'disabled'
    })
  })

  test('dark mode layout', async ({ page }) => {
    const helpers = new TestHelpers(page)

    await page.goto('/')
    await helpers.waitForPageLoad()

    // Try to enable dark mode
    const darkModeToggle = page.locator('[data-theme="dark"], [aria-label*="dark"], .dark-mode-toggle')
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click()
      await page.waitForTimeout(500) // Wait for theme transition
    } else {
      // Force dark mode via localStorage
      await page.evaluate(() => {
        localStorage.setItem('theme', 'dark')
        document.documentElement.classList.add('dark')
      })
      await page.reload()
      await helpers.waitForPageLoad()
    }

    await helpers.hideVariableContent()

    await expect(page).toHaveScreenshot('homepage-dark.png', {
      fullPage: true,
      animations: 'disabled'
    })

    // Dark mode chat
    await helpers.navigateToChat(TEST_DATA.chatIds.automation)
    await helpers.waitForChatInterface()
    await helpers.hideVariableContent()

    await expect(page).toHaveScreenshot('chat-dark.png', {
      fullPage: true,
      animations: 'disabled'
    })
  })

  test('loading states', async ({ page }) => {
    const helpers = new TestHelpers(page)

    // Slow down network to capture loading states
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 1000)
    })

    await page.goto('/')

    // Capture loading state
    await expect(page).toHaveScreenshot('loading-state.png', {
      animations: 'disabled'
    })

    await helpers.waitForPageLoad()
  })

  test('error states', async ({ page }) => {
    const helpers = new TestHelpers(page)

    // Simulate network errors
    await page.route('**/api/**', route => route.abort())

    await helpers.navigateToChat(TEST_DATA.chatIds.automation)
    await helpers.waitForChatInterface()

    // Try to send a message to trigger error
    await helpers.sendMessage('This should fail')

    // Wait a bit for error state to appear
    await page.waitForTimeout(2000)
    await helpers.hideVariableContent()

    await expect(page).toHaveScreenshot('error-state.png', {
      animations: 'disabled'
    })
  })

  test('component library consistency', async ({ page }) => {
    const helpers = new TestHelpers(page)

    await page.goto('/')
    await helpers.waitForPageLoad()
    await helpers.hideVariableContent()

    // Test common UI components if they exist
    const components = [
      { selector: 'button:not([type="submit"])', name: 'buttons' },
      { selector: 'input[type="text"], input[type="email"]', name: 'inputs' },
      { selector: '[role="dialog"], .modal', name: 'modals' },
      { selector: '.dropdown, [role="menu"]', name: 'dropdowns' },
      { selector: '.tooltip, [role="tooltip"]', name: 'tooltips' }
    ]

    for (const { selector, name } of components) {
      const element = page.locator(selector).first()
      if (await element.isVisible()) {
        await expect(element).toHaveScreenshot(`component-${name}.png`)
      }
    }
  })

  test('form layouts', async ({ page }) => {
    const helpers = new TestHelpers(page)

    await page.goto('/')
    await helpers.waitForPageLoad()

    // Look for forms in the app
    const forms = page.locator('form')
    const formCount = await forms.count()

    for (let i = 0; i < formCount; i++) {
      const form = forms.nth(i)
      if (await form.isVisible()) {
        await helpers.hideVariableContent()
        await expect(form).toHaveScreenshot(`form-${i}.png`)
      }
    }
  })
})

test.describe('Visual Regression - Cross Browser', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`homepage consistency in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
      // Only run this test on the specified browser
      test.skip(currentBrowser !== browserName, `Skipping ${browserName} test`)

      const helpers = new TestHelpers(page)

      await page.goto('/')
      await helpers.waitForPageLoad()
      await helpers.hideVariableContent()

      await expect(page).toHaveScreenshot(`homepage-${browserName}.png`, {
        fullPage: true,
        animations: 'disabled',
        threshold: 0.3 // Allow slight browser differences
      })
    })
  })
})