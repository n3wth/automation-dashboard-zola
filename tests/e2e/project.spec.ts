import { test } from '@playwright/test'

test.describe('Projects', () => {
  test.skip('should allow a user to create a new project', async () => {
    // 1. Log in
    // 2. Navigate to the projects page
    // 3. Click the "New Project" button
    // 4. Fill in the project details
    // 5. Submit the form
    // 6. Verify the new project is displayed in the project list
  })

  test.skip('should allow a user to view a project', async () => {
    // 1. Log in
    // 2. Navigate to the projects page
    // 3. Click on a project in the list
    // 4. Verify the project details are displayed
  })

  test.skip('should allow a user to delete a project', async () => {
    // 1. Log in
    // 2. Create a new project
    // 3. Find the project in the list
    // 4. Click the delete button
    // 5. Confirm the deletion
    // 6. Verify the project is no longer in the list
  })
})
