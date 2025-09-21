import { test, expect } from '@playwright/test'
import { TestHelpers, TEST_DATA } from '../utils/test-helpers'
import { TestDataFactory, MockApiResponses } from '../utils/test-data-factory'

test.describe('API Testing', () => {
  test('chat API responds correctly', async ({ page, request }) => {
    const helpers = new TestHelpers(page)

    // Mock chat API response
    const mockResponse = TestDataFactory.message({
      role: 'assistant',
      content: 'Hello! How can I help you today?'
    })

    await page.route('**/api/chat**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MockApiResponses.success(mockResponse))
      })
    })

    await helpers.navigateToChat(TEST_DATA.chatIds.automation)
    await helpers.waitForChatInterface()

    // Send a message
    await helpers.sendMessage('Hello API test')

    // Verify API was called
    const apiCalls = []
    page.on('request', request => {
      if (request.url().includes('/api/chat')) {
        apiCalls.push(request)
      }
    })

    // Verify response appears
    await expect(page.locator('text="Hello! How can I help you today?"')).toBeVisible()
  })

  test('handles API errors gracefully', async ({ page }) => {
    const helpers = new TestHelpers(page)

    // Mock API error
    await page.route('**/api/chat**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify(MockApiResponses.error(500, 'Service temporarily unavailable'))
      })
    })

    await helpers.navigateToChat(TEST_DATA.chatIds.automation)
    await helpers.waitForChatInterface()

    await helpers.sendMessage('This should fail')

    // Should show error state
    await expect(page.locator('text=/error|failed|unavailable/i')).toBeVisible()
  })

  test('API rate limiting', async ({ page }) => {
    const helpers = new TestHelpers(page)

    // Mock rate limit response
    await page.route('**/api/chat**', async route => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify(MockApiResponses.error(429, 'Rate limit exceeded'))
      })
    })

    await helpers.navigateToChat(TEST_DATA.chatIds.automation)
    await helpers.waitForChatInterface()

    await helpers.sendMessage('Rate limit test')

    // Should handle rate limiting
    await expect(page.locator('text=/rate limit|too many requests/i')).toBeVisible()
  })

  test('streaming response handling', async ({ page }) => {
    const helpers = new TestHelpers(page)

    // Mock streaming response
    const streamData = ['Hello', ' there!', ' How', ' are', ' you?']

    await page.route('**/api/chat**', async route => {
      const chunks = MockApiResponses.chatStream(streamData)

      // Simulate streaming
      let response = ''
      for (const chunk of chunks) {
        response += `data: ${JSON.stringify(chunk)}\n\n`
      }
      response += 'data: [DONE]\n\n'

      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: response
      })
    })

    await helpers.navigateToChat(TEST_DATA.chatIds.automation)
    await helpers.waitForChatInterface()

    await helpers.sendMessage('Stream test')

    // Should show streaming response
    await expect(page.locator('text="Hello there! How are you?"')).toBeVisible()
  })

  test('authentication API calls', async ({ page }) => {
    const helpers = new TestHelpers(page)

    // Track auth-related API calls
    const authCalls: string[] = []

    page.on('request', request => {
      if (request.url().includes('/api/auth') || request.url().includes('/auth/')) {
        authCalls.push(request.url())
      }
    })

    await page.goto('/')
    await helpers.waitForPageLoad()

    // Should make auth check calls
    await page.waitForTimeout(2000) // Wait for auth checks

    expect(authCalls.length).toBeGreaterThan(0)
  })

  test('WebSocket connection testing', async ({ page }) => {
    const helpers = new TestHelpers(page)

    // Monitor WebSocket connections
    const wsConnections: any[] = []

    page.on('websocket', ws => {
      wsConnections.push(ws)
      console.log('WebSocket connected:', ws.url())

      ws.on('framesent', event => {
        console.log('WS Frame sent:', event.payload)
      })

      ws.on('framereceived', event => {
        console.log('WS Frame received:', event.payload)
      })
    })

    await helpers.navigateToChat(TEST_DATA.chatIds.automation)
    await helpers.waitForChatInterface()

    // Wait for potential WebSocket connections
    await page.waitForTimeout(3000)

    // Log connection status
    console.log(`WebSocket connections found: ${wsConnections.length}`)
  })
})