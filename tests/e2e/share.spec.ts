import { test, expect } from '@playwright/test'
import { TestHelpers } from '../utils/test-helpers'

test.describe('Chat Sharing', () => {
  test.skip('should allow a user to share a chat', async ({ page }) => {
    const helpers = new TestHelpers(page)
    // 1. Log in
    // 2. Create a new chat
    // 3. Get the chat ID
    // 4. Find the share button and click it
    // 5. Get the share link
    // 6. Verify the share link is valid
  })

  test.skip('should allow an unauthenticated user to view a shared chat', async ({ page }) => {
    const helpers = new TestHelpers(page)
    // 1. Get a valid share link
    // 2. Navigate to the share link
    // 3. Verify the chat content is visible
    // 4. Verify that the user is prompted to log in to continue the conversation
  })

  test.skip('should not allow an authenticated user to view a shared chat they do not have access to', async ({ page }) => {
    const helpers = new TestHelpers(page)
    // 1. Log in as user A
    // 2. Create a chat and share it
    // 3. Log out
    // 4. Log in as user B
    // 5. Attempt to access the shared chat
    // 6. Verify that an error message is displayed
  })
})
