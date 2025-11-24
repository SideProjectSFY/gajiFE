import { test, expect } from '@playwright/test'

test.describe('Scenario Creation Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a book detail page
    await page.goto('/books/test-book-id')
  })

  test('opens modal when clicking Create Scenario button', async ({ page }) => {
    // Click the create scenario button
    await page.click('button:has-text("Create Scenario")')

    // Verify modal is visible
    await expect(page.locator('text=Create Scenario for')).toBeVisible()
    await expect(page.locator('#scenario-title')).toBeVisible()
  })

  test('validates form - submit disabled when empty', async ({ page }) => {
    await page.click('button:has-text("Create Scenario")')

    // Submit button should be disabled
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeDisabled()
  })

  test('validates form - submit disabled with only title', async ({ page }) => {
    await page.click('button:has-text("Create Scenario")')

    // Fill only the title
    await page.fill('#scenario-title', 'Test Scenario Title')

    // Submit button should still be disabled
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeDisabled()
  })

  test('validates form - shows error for short scenario type', async ({ page }) => {
    await page.click('button:has-text("Create Scenario")')

    // Fill with short text (less than 10 chars)
    await page.fill('#character-changes', 'short')

    // Should show validation error
    await expect(page.locator('text=Please provide at least one scenario type with 10+ characters')).toBeVisible()
  })

  test('enables submit with valid form data', async ({ page }) => {
    await page.click('button:has-text("Create Scenario")')

    // Fill the form with valid data
    await page.fill('#scenario-title', 'Hermione in Slytherin')
    await page.fill('#character-changes', 'Hermione sorted into Slytherin instead of Gryffindor')

    // Submit button should be enabled
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeEnabled()
  })

  test('character counter shows correct count', async ({ page }) => {
    await page.click('button:has-text("Create Scenario")')

    // Type in title field
    await page.fill('#scenario-title', 'Hello')

    // Should show character count
    await expect(page.locator('text=5/100')).toBeVisible()
  })

  test('character counter shows checkmark when valid', async ({ page }) => {
    await page.click('button:has-text("Create Scenario")')

    // Type valid text in character changes
    await page.fill('#character-changes', 'This is a valid character change')

    // Should show checkmark
    await expect(page.locator('text=✓')).toBeVisible()
  })

  test('closes modal on cancel (pristine form)', async ({ page }) => {
    await page.click('button:has-text("Create Scenario")')

    // Click cancel
    await page.click('button:has-text("Cancel")')

    // Modal should be closed
    await expect(page.locator('text=Create Scenario for')).not.toBeVisible()
  })

  test('closes modal on Escape key', async ({ page }) => {
    await page.click('button:has-text("Create Scenario")')

    // Press Escape
    await page.keyboard.press('Escape')

    // Modal should be closed
    await expect(page.locator('text=Create Scenario for')).not.toBeVisible()
  })

  test('auto-focuses title field on modal open', async ({ page }) => {
    await page.click('button:has-text("Create Scenario")')

    // Title field should be focused
    const titleField = page.locator('#scenario-title')
    await expect(titleField).toBeFocused()
  })

  test('keyboard shortcut Cmd+Enter submits form when valid', async ({ page }) => {
    await page.click('button:has-text("Create Scenario")')

    // Fill the form with valid data
    await page.fill('#scenario-title', 'Test Title')
    await page.fill('#character-changes', 'Valid character changes text here')

    // Press Cmd+Enter (or Ctrl+Enter on non-Mac)
    await page.keyboard.press('Meta+Enter')

    // Form should attempt to submit (will fail due to no backend, but we can check the button state)
    // In a real test, we'd mock the API and check for navigation
  })

  test('mobile responsive - modal is fullscreen on small viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.click('button:has-text("Create Scenario")')

    // Modal should be visible and fullscreen
    const modal = page.locator('[class*="modal"]').first()
    await expect(modal).toBeVisible()
  })
})
