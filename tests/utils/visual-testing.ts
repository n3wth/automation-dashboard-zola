import { Page, expect } from '@playwright/test'

export class VisualTestingUtils {
  constructor(private page: Page) {}

  async prepareForScreenshot() {
    // Hide dynamic content for consistent screenshots
    await this.page.addStyleTag({
      content: `
        /* Hide dynamic content */
        [data-testid="timestamp"],
        .timestamp,
        [class*="time"],
        [data-time],
        .animate-pulse,
        .animate-spin,
        .animate-bounce {
          visibility: hidden !important;
        }

        /* Disable animations */
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }

        /* Hide cursors */
        .cursor-blink,
        .blinking-cursor {
          opacity: 0 !important;
        }
      `
    })

    // Wait for any pending animations to complete
    await this.page.waitForTimeout(500)
  }

  async captureComponent(selector: string, name: string) {
    await this.prepareForScreenshot()
    const element = this.page.locator(selector)
    await expect(element).toHaveScreenshot(`${name}.png`)
  }

  async captureFullPage(name: string) {
    await this.prepareForScreenshot()
    await expect(this.page).toHaveScreenshot(`${name}.png`, {
      fullPage: true,
      animations: 'disabled'
    })
  }

  async captureWithDarkMode(name: string) {
    // Enable dark mode
    await this.page.evaluate(() => {
      document.documentElement.classList.add('dark')
      localStorage.setItem('bob-theme', 'dark')
    })

    await this.page.waitForTimeout(500) // Wait for theme transition
    await this.prepareForScreenshot()
    await expect(this.page).toHaveScreenshot(`${name}-dark.png`, {
      fullPage: true,
      animations: 'disabled'
    })
  }

  async captureResponsive(name: string, viewports: Array<{ width: number; height: number; suffix: string }>) {
    for (const viewport of viewports) {
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height })
      await this.page.waitForTimeout(500) // Wait for layout shift
      await this.prepareForScreenshot()
      await expect(this.page).toHaveScreenshot(`${name}-${viewport.suffix}.png`, {
        fullPage: true,
        animations: 'disabled'
      })
    }
  }

  async captureHoverState(selector: string, name: string) {
    await this.prepareForScreenshot()
    const element = this.page.locator(selector)
    await element.hover()
    await this.page.waitForTimeout(300) // Wait for hover effects
    await expect(element).toHaveScreenshot(`${name}-hover.png`)
  }

  async captureFocusState(selector: string, name: string) {
    await this.prepareForScreenshot()
    const element = this.page.locator(selector)
    await element.focus()
    await this.page.waitForTimeout(300) // Wait for focus effects
    await expect(element).toHaveScreenshot(`${name}-focus.png`)
  }

  async captureLoadingState(triggerAction: () => Promise<void>, name: string) {
    await this.prepareForScreenshot()

    // Trigger the loading state
    await triggerAction()

    // Capture loading state quickly
    await this.page.waitForTimeout(100)
    await expect(this.page).toHaveScreenshot(`${name}-loading.png`, {
      animations: 'disabled'
    })
  }

  async captureErrorState(name: string) {
    // Simulate network error
    await this.page.route('**/*', route => route.abort())

    await this.page.reload()
    await this.page.waitForTimeout(2000) // Wait for error state

    await this.prepareForScreenshot()
    await expect(this.page).toHaveScreenshot(`${name}-error.png`, {
      fullPage: true,
      animations: 'disabled'
    })
  }

  // Compare screenshots with tolerance
  async compareWithTolerance(name: string, threshold = 0.2) {
    await this.prepareForScreenshot()
    await expect(this.page).toHaveScreenshot(`${name}.png`, {
      threshold,
      fullPage: true,
      animations: 'disabled'
    })
  }

  // Cross-browser visual testing
  async captureForBrowser(name: string, browserName: string) {
    await this.prepareForScreenshot()
    await expect(this.page).toHaveScreenshot(`${name}-${browserName}.png`, {
      fullPage: true,
      animations: 'disabled',
      threshold: 0.3 // Allow slight browser differences
    })
  }
}

// Predefined viewport configurations
export const VIEWPORTS = {
  mobile: { width: 375, height: 667, suffix: 'mobile' },
  tablet: { width: 768, height: 1024, suffix: 'tablet' },
  desktop: { width: 1440, height: 900, suffix: 'desktop' },
  wide: { width: 1920, height: 1080, suffix: 'wide' }
}

// Common responsive test configurations
export const RESPONSIVE_TESTS = [
  VIEWPORTS.mobile,
  VIEWPORTS.tablet,
  VIEWPORTS.desktop
]