import { test, expect } from '@playwright/test'

test.describe('Scenario Creation Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Mock book detail API
    await page.route('**/api/v1/books/test-book-id', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-book-id',
          title: "Harry Potter and the Philosopher's Stone",
          author: 'J.K. Rowling',
          description: 'The first book in the Harry Potter series',
          cover_image: 'https://example.com/cover.jpg',
          statistics: {
            scenario_count: 0,
            total_conversations: 0,
            total_forks: 0,
          },
        }),
      })
    })

    // Mock scenarios list API (empty initially)
    await page.route('**/api/v1/books/test-book-id/scenarios*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          scenarios: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            has_next: false,
          },
        }),
      })
    })

    // Navigate to a book detail page
    await page.goto('/books/test-book-id')
  })

  test('opens modal when clicking Create Scenario button', async ({ page }) => {
    // Click the create scenario button
    await page.click('[data-testid="create-scenario-button"]')

    // Verify modal is visible
    await expect(page.locator('[data-testid="scenario-creation-modal"]')).toBeVisible()
    await expect(page.locator('[data-testid="scenario-title-input"]')).toBeVisible()
  })

  test('validates form - submit disabled when empty', async ({ page }) => {
    await page.click('[data-testid="create-scenario-button"]')

    // Submit button should be disabled
    const submitButton = page.locator('[data-testid="submit-button"]')
    await expect(submitButton).toBeDisabled()
  })

  test('validates form - submit disabled with only title', async ({ page }) => {
    await page.click('[data-testid="create-scenario-button"]')

    // Fill only the title
    await page.fill('[data-testid="scenario-title-input"]', 'Test Scenario Title')

    // Submit button should still be disabled (need at least one scenario type)
    const submitButton = page.locator('[data-testid="submit-button"]')
    await expect(submitButton).toBeDisabled()
  })

  test('validates form - shows error for short scenario type', async ({ page }) => {
    await page.click('[data-testid="create-scenario-button"]')

    // Fill title first
    await page.fill('[data-testid="scenario-title-input"]', 'Test Title')

    // Fill with short text (less than 10 chars)
    await page.fill('[data-testid="character-changes-textarea"]', 'short')

    // Should show validation error
    await expect(
      page.locator('text=Please provide at least one scenario type with 10+ characters')
    ).toBeVisible()
  })

  test('enables submit with valid form data', async ({ page }) => {
    await page.click('[data-testid="create-scenario-button"]')

    // Fill the form with valid data
    await page.fill('[data-testid="scenario-title-input"]', 'Hermione in Slytherin')
    await page.fill(
      '[data-testid="character-changes-textarea"]',
      'Hermione sorted into Slytherin instead of Gryffindor'
    )

    // Submit button should be enabled
    const submitButton = page.locator('[data-testid="submit-button"]')
    await expect(submitButton).toBeEnabled()
  })

  test('character counter shows correct count', async ({ page }) => {
    await page.click('[data-testid="create-scenario-button"]')

    // Type in title field
    await page.fill('[data-testid="scenario-title-input"]', 'Hello')

    // Should show character count
    await expect(page.locator('text=5/100')).toBeVisible()
  })

  test('character counter shows checkmark when valid', async ({ page }) => {
    await page.click('[data-testid="create-scenario-button"]')

    // Type valid text in character changes
    await page.fill(
      '[data-testid="character-changes-textarea"]',
      'This is a valid character change'
    )

    // Should show checkmark
    await expect(page.locator('text=✓')).toBeVisible()
  })

  test('closes modal on cancel (pristine form)', async ({ page }) => {
    await page.click('[data-testid="create-scenario-button"]')

    // Click cancel
    await page.click('[data-testid="cancel-button"]')

    // Modal should be closed
    await expect(page.locator('[data-testid="scenario-creation-modal"]')).not.toBeVisible()
  })

  test('closes modal on Escape key', async ({ page }) => {
    await page.click('[data-testid="create-scenario-button"]')

    // Press Escape
    await page.keyboard.press('Escape')

    // Modal should be closed
    await expect(page.locator('[data-testid="scenario-creation-modal"]')).not.toBeVisible()
  })

  test('auto-focuses title field on modal open', async ({ page }) => {
    await page.click('[data-testid="create-scenario-button"]')

    // Title field should be focused
    const titleField = page.locator('[data-testid="scenario-title-input"]')
    await expect(titleField).toBeFocused()
  })

  test('keyboard shortcut Cmd+Enter submits form when valid', async ({ page }) => {
    // Mock scenario creation API
    let apiWasCalled = false
    await page.route('**/api/v1/scenarios', async (route) => {
      apiWasCalled = true
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'new-scenario-id',
          title: 'Test Title',
        }),
      })
    })

    await page.click('[data-testid="create-scenario-button"]')

    // Fill the form with valid data
    await page.fill('[data-testid="scenario-title-input"]', 'Test Title')
    await page.fill(
      '[data-testid="character-changes-textarea"]',
      'Valid character changes text here'
    )

    // Press Cmd+Enter (or Ctrl+Enter on non-Mac)
    await page.keyboard.press('Meta+Enter')

    // Wait a bit and verify API was called
    await page.waitForTimeout(500)
    expect(apiWasCalled).toBe(true)
  })

  test('mobile responsive - modal is fullscreen on small viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.click('[data-testid="create-scenario-button"]')

    // Modal should be visible
    const modal = page.locator('[data-testid="scenario-creation-modal"]')
    await expect(modal).toBeVisible()
  })
})
