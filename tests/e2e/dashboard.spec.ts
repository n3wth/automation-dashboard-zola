import { test, expect } from '@playwright/test'
import { TestHelpers } from '../utils/test-helpers'

test.describe('Dashboard', () => {
  test('should load and display the dashboard for an authenticated user', async ({ page }) => {
    const helpers = new TestHelpers(page)

    // Attempt login (uses env credentials or falls back to mock)
    await helpers.login()

    // Navigate to the dashboard
    await page.goto('/dashboard')
    await helpers.waitForPageLoad()

    // Check if the dashboard is displayed
    const dashboardHeading = page.locator('h1, h2, [role="heading"]').filter({ hasText: /dashboard/i })
    await expect(dashboardHeading).toBeVisible()

    // Check for some dashboard content
    const hasCharts = await page.locator('.chart, [data-testid="chart"]').isVisible()
    const hasStats = await page.locator('.stat, [data-testid="stat"]').isVisible()
    const hasRecentActivity = await page.locator('.recent-activity, [data-testid="recent-activity"]').isVisible()

    expect(hasCharts || hasStats || hasRecentActivity).toBeTruthy()
  })

  test('should redirect unauthenticated users to the login page', async ({ page }) => {
    const helpers = new TestHelpers(page)

    // Make sure we are logged out
    await page.context().clearCookies()

    // Attempt to navigate to the dashboard
    await page.goto('/dashboard')
    await helpers.waitForPageLoad()

    // Check if we were redirected to the login page
    const isAtAuthPage = page.url().includes('/auth')
    expect(isAtAuthPage).toBeTruthy()
  })
})
