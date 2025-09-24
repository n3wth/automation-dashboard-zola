import { test, expect } from '@playwright/test'
import { TestHelpers, TEST_DATA } from '../utils/test-helpers'

test.describe('Chat Functionality', () => {
  test('chat interface loads correctly', async ({ page }) => {
    const helpers = new TestHelpers(page)

    await helpers.navigateToChat(TEST_DATA.chatIds.automation)
    await helpers.waitForChatInterface()

    // Verify core chat elements
    const chatInput = helpers.getChatInput()
    await expect(chatInput).toBeVisible()
    await expect(chatInput).toBeEnabled()

    // Check for send button or enter functionality
    const sendButton = helpers.getSendButton()
    if (await sendButton.isVisible()) {
      await expect(sendButton).toBeEnabled()
    }

    // Verify page URL is correct
    await expect(page).toHaveURL(new RegExp(`/c/${TEST_DATA.chatIds.automation}`))
  })

  test('can send and receive messages', async ({ page }) => {
    const helpers = new TestHelpers(page)

    await helpers.navigateToChat(TEST_DATA.chatIds.automation)
    await helpers.waitForChatInterface()

    const testMessage = TEST_DATA.messages.simple

    // Send message
    await helpers.sendMessage(testMessage)

    // Verify message appears in chat
    await expect(page.locator(`text="${testMessage}"`)).toBeVisible()

    // Wait for AI response
    await helpers.waitForResponse()

    // Check for response (look for common response indicators)
    const responseSelectors = [
      '.message:not(:has-text("' + testMessage + '"))',
      '[data-role="assistant"]',
      '.ai-message',
      '.response-message'
    ]

    let responseFound = false
    for (const selector of responseSelectors) {
      if (await page.locator(selector).first().isVisible()) {
        responseFound = true
        break
      }
    }

    expect(responseFound).toBeTruthy()
  })

  test('preserves chat history on reload', async ({ page }) => {
    const helpers = new TestHelpers(page)

    await helpers.navigateToChat(TEST_DATA.chatIds.automation)
    await helpers.waitForChatInterface()

    const testMessage = `Test message ${Date.now()}`
    await helpers.sendMessage(testMessage)
    await expect(page.locator(`text="${testMessage}"`)).toBeVisible()

    // Reload page
    await page.reload()
    await helpers.waitForChatInterface()

    // Message should still be visible
    await expect(page.locator(`text="${testMessage}"`)).toBeVisible()
  })

  test('handles long messages correctly', async ({ page }) => {
    const helpers = new TestHelpers(page)

    await helpers.navigateToChat(TEST_DATA.chatIds.automation)
    await helpers.waitForChatInterface()

    const longMessage = 'This is a very long message that should test how the chat interface handles lengthy text input. '.repeat(10)

    await helpers.sendMessage(longMessage)
    await expect(helpers.getChatInput()).toHaveValue('')
    await expect(page.locator(`text*="${longMessage.substring(0, 50)}"`)).toBeVisible()
  })

  test('chat input placeholder and states', async ({ page }) => {
    const helpers = new TestHelpers(page)

    await helpers.navigateToChat(TEST_DATA.chatIds.automation)
    await helpers.waitForChatInterface()

    const textarea = helpers.getChatInput()

    // Check placeholder text
    await expect(textarea).toHaveAttribute('placeholder', /.+/)

    // Test typing state
    await textarea.type('Testing...')
    await expect(textarea).toHaveValue('Testing...')

    // Clear and check empty state
    await textarea.clear()
    await expect(textarea).toHaveValue('')
  })

  test('keyboard shortcuts work', async ({ page }) => {
    const helpers = new TestHelpers(page)

    await helpers.navigateToChat(TEST_DATA.chatIds.automation)
    await helpers.waitForChatInterface()

    const textarea = helpers.getChatInput()

    // Test Enter to send
    await textarea.fill(TEST_DATA.messages.simple)
    await textarea.press('Enter')
    await expect(textarea).toHaveValue('')

    // Test Shift+Enter for new line (if implemented)
    await textarea.fill('Line 1')
    await textarea.press('Shift+Enter')
    await textarea.type('Line 2')
    const value = await textarea.inputValue()
    expect(value.includes('\n')).toBeTruthy()
  })

  test('error handling for network issues', async ({ page }) => {
    const helpers = new TestHelpers(page)

    await helpers.navigateToChat(TEST_DATA.chatIds.automation)
    await helpers.waitForChatInterface()

    // Simulate network failure
    await page.route('**/api/**', route => route.abort())

    await helpers.sendMessage('This should fail')

    // Check for error message or retry mechanism
    const errorIndicators = [
      'text=/error/i',
      'text=/failed/i',
      'text=/retry/i',
      '[data-testid="error"]',
      '.error-message'
    ]

    let errorShown = false
    for (const selector of errorIndicators) {
      if (await page.locator(selector).isVisible()) {
        errorShown = true
        break
      }
    }

    expect(errorShown).toBeTruthy()
  })
})

test.describe('Model Selection', () => {
  test.skip('should allow a user to switch between different models', async ({ page }) => {
    // 1. Navigate to a chat
    // 2. Open the model selection menu
    // 3. Select a different model
    // 4. Verify the model has been changed
  })
})

test.describe('Chat History Management', () => {
  test.skip('should allow a user to create a new chat', async ({ page }) => {
    // 1. Click the "New Chat" button
    // 2. Verify a new chat is created and the URL is updated
  })

  test.skip('should allow a user to switch between chats', async ({ page }) => {
    // 1. Navigate to a chat
    // 2. Click on a different chat in the history sidebar
    // 3. Verify the new chat is loaded
  })

  test.skip('should allow a user to delete a chat', async ({ page }) => {
    // 1. Create a new chat
    // 2. Find the chat in the history sidebar
    // 3. Click the delete button
    // 4. Confirm the deletion
    // 5. Verify the chat is no longer in the history
  })
})
