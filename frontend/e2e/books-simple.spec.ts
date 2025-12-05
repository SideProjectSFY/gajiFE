import { test, expect } from '@playwright/test'

test.describe('Books and Book Detail - Simple Tests', () => {
  test('should display books page', async ({ page }) => {
    await page.goto('/books')
    await expect(page).toHaveURL('/books')

    // Check page title
    const title = page.getByRole('heading', { name: 'All Books' })
    await expect(title).toBeVisible()

    // Check books text is visible
    const booksCount = page.locator('text=/books available/')
    await expect(booksCount).toBeVisible()
  })

  test('should display book cards', async ({ page }) => {
    await page.goto('/books')

    // Check if book titles are visible
    await expect(page.locator('text=/The Great Gatsby/')).toBeVisible()
    await expect(page.locator('text=/Pride and Prejudice/')).toBeVisible()

    // Check if View Characters button exists
    const viewButtons = page.getByRole('button', { name: /View Characters/i })
    await expect(viewButtons.first()).toBeVisible()
  })

  test('should navigate to book detail page', async ({ page }) => {
    await page.goto('/books')

    // Click first View Characters button
    const viewButtons = page.getByRole('button', { name: /View Characters/i })
    await viewButtons.first().click()

    // Wait for navigation
    await page.waitForURL(/\/books\/\d+/)

    // Check URL changed
    await expect(page).toHaveURL(/\/books\/\d+/)
  })

  test('should display book detail for The Great Gatsby', async ({ page }) => {
    await page.goto('/books/1')

    // Check breadcrumb is visible
    const breadcrumb = page.locator('a', { hasText: '← Go to Book List' })
    await expect(breadcrumb).toBeVisible()

    // Check book title
    await expect(page.locator('text=/The Great Gatsby/')).toBeVisible()

    // Check author
    await expect(page.locator('text=/F. Scott Fitzgerald/')).toBeVisible()
  })

  test('should display characters on detail page', async ({ page }) => {
    await page.goto('/books/1')

    // Wait for page to load
    await page.waitForTimeout(1000)

    // Check character names are visible
    await expect(page.locator('text=/Jay Gatsby/')).toBeVisible()
    await expect(page.locator('text=/Tom Buchanan/')).toBeVisible()
    await expect(page.locator('text=/Nick Carraway/')).toBeVisible()
    await expect(page.locator('text=/Daisy Buchanan/')).toBeVisible()
  })

  test('should have Start Chat buttons that do not navigate', async ({ page }) => {
    await page.goto('/books/1')
    await page.waitForTimeout(1000)

    const currentUrl = page.url()

    // Click Start Chat button
    const startChatButtons = page.getByRole('button', { name: /Start Chat/i })
    await startChatButtons.first().click()

    // Wait a bit
    await page.waitForTimeout(500)

    // Should stay on same page
    expect(page.url()).toBe(currentUrl)
  })

  test('should navigate back to books list', async ({ page }) => {
    await page.goto('/books/1')

    // Click breadcrumb
    const breadcrumb = page.locator('a', { hasText: '← Go to Book List' })
    await breadcrumb.click()

    // Should be back at books page
    await expect(page).toHaveURL('/books')
    await expect(page.getByRole('heading', { name: 'All Books' })).toBeVisible()
  })

  test('should display different books correctly', async ({ page }) => {
    // Test Pride and Prejudice
    await page.goto('/books/2')
    await expect(page.locator('text=/Pride and Prejudice/')).toBeVisible()
    await expect(page.locator('text=/Jane Austen/')).toBeVisible()
    await expect(page.locator('text=/Elizabeth Bennet/')).toBeVisible()

    // Test 1984
    await page.goto('/books/3')
    await expect(page.locator('text=/1984/')).toBeVisible()
    await expect(page.locator('text=/George Orwell/')).toBeVisible()
    await expect(page.locator('text=/Winston Smith/')).toBeVisible()
  })
})
