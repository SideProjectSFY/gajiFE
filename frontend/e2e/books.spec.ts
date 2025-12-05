import { test, expect } from '@playwright/test'
import { BooksPage } from './pages/books.page'
import { BookDetailPage } from './pages/book-detail.page'

test.describe('Books and Book Detail Flow', () => {
  let booksPage: BooksPage
  let bookDetailPage: BookDetailPage

  test.beforeEach(async ({ page }) => {
    booksPage = new BooksPage(page)
    bookDetailPage = new BookDetailPage(page)
  })

  test.describe('Books Page', () => {
    test('should display books list', async ({ page }) => {
      await booksPage.goto()
      await expect(page).toHaveURL('/books')
      await expect(booksPage.pageTitle).toBeVisible()
    })

    test('should filter books by genre', async ({ page }) => {
      await booksPage.goto()

      // Click Classic genre filter
      await booksPage.selectGenre('Classic')

      // Wait for filtering to apply
      await page.waitForTimeout(500)

      // Should still show books (most books have Classic tag)
      const bookCards = page.locator('article')
      await expect(bookCards.first()).toBeVisible()
    })

    test('should navigate to book detail when clicking View Characters', async ({ page }) => {
      await booksPage.goto()

      // Click first book's View Characters button
      await booksPage.clickViewCharacters(0)

      // Should navigate to book detail page
      await expect(page).toHaveURL(/\/books\/\d+/)
    })
  })

  test.describe('Book Detail Page', () => {
    test('should display book information for The Great Gatsby', async ({ page }) => {
      await bookDetailPage.goto(1)

      // Check book info is displayed
      await expect(bookDetailPage.bookTitle).toContainText('The Great Gatsby')
      await expect(page.locator('text=/F. Scott Fitzgerald/')).toBeVisible()
      await expect(page.locator('text=/Set in the summer of 1922/')).toBeVisible()

      // Check tags
      const tags = page.locator('span').filter({ hasText: /Classic|Drama|American/ })
      await expect(tags.first()).toBeVisible()
    })

    test('should display book information for Pride and Prejudice', async ({ page }) => {
      await bookDetailPage.goto(2)

      // Check book info is displayed
      await expect(bookDetailPage.bookTitle).toContainText('Pride and Prejudice')
      await expect(page.locator('text=/Jane Austen/')).toBeVisible()

      // Check tags
      const tags = page.locator('span').filter({ hasText: /Romance|Classic|Social Commentary/ })
      await expect(tags.first()).toBeVisible()
    })

    test('should display book information for 1984', async ({ page }) => {
      await bookDetailPage.goto(3)

      // Check book info is displayed
      await expect(bookDetailPage.bookTitle).toContainText('1984')
      await expect(page.locator('text=/George Orwell/')).toBeVisible()

      // Check tags
      const tags = page.locator('span').filter({ hasText: /Dystopian|Political|Classic/ })
      await expect(tags.first()).toBeVisible()
    })

    test('should display characters list by default', async ({ page }) => {
      await bookDetailPage.goto(1)

      // Characters tab should be active
      await expect(bookDetailPage.charactersTab).toBeVisible()

      // Should display character names
      await expect(page.locator('text=/Jay Gatsby/')).toBeVisible()
      await expect(page.locator('text=/Tom Buchanan/')).toBeVisible()
      await expect(page.locator('text=/Nick Carraway/')).toBeVisible()
      await expect(page.locator('text=/Daisy Buchanan/')).toBeVisible()
    })

    test('should display featured badges for featured characters', async ({ page }) => {
      await bookDetailPage.goto(1)

      // Should have featured characters
      const featuredBadges = page.locator('span').filter({ hasText: /⭐ Featured/i })
      const count = await featuredBadges.count()
      expect(count).toBeGreaterThan(0)
    })

    test('should switch between Characters and Relations tabs', async ({ page }) => {
      await bookDetailPage.goto(1)

      // Click Relations tab
      await bookDetailPage.switchToRelationsTab()
      await page.waitForTimeout(300)

      // Should show relations view
      await expect(page.locator('text=/Relationship Network/i')).toBeVisible()

      // Switch back to Characters tab
      await bookDetailPage.switchToCharactersTab()
      await page.waitForTimeout(300)

      // Should show characters list again
      await expect(page.locator('text=/Jay Gatsby/')).toBeVisible()
    })

    test('should not navigate away when clicking Start Chat button', async ({ page }) => {
      await bookDetailPage.goto(1)

      const currentUrl = page.url()

      // Click Start Chat button
      await bookDetailPage.clickStartChat(0)

      // Wait a bit to ensure no navigation happens
      await page.waitForTimeout(500)

      // Should stay on the same page
      expect(page.url()).toBe(currentUrl)
      await expect(page).toHaveURL(/\/books\/1/)
    })

    test('should not navigate away when clicking Try To Book button', async ({ page }) => {
      await bookDetailPage.goto(1)

      const currentUrl = page.url()

      // Click Try To Book button
      await bookDetailPage.clickTryToBook(0)

      // Wait a bit to ensure no navigation happens
      await page.waitForTimeout(500)

      // Should stay on the same page
      expect(page.url()).toBe(currentUrl)
      await expect(page).toHaveURL(/\/books\/1/)
    })

    test('should navigate back to books list when clicking breadcrumb', async ({ page }) => {
      await bookDetailPage.goto(1)

      // Click breadcrumb
      await bookDetailPage.clickBreadcrumb()

      // Should navigate back to books list
      await expect(page).toHaveURL('/books')
      await expect(booksPage.pageTitle).toBeVisible()
    })

    test('should display correct character counts for each book', async ({ page }) => {
      // The Great Gatsby - 4 characters
      await bookDetailPage.goto(1)
      await expect(page.locator('text=/Jay Gatsby/')).toBeVisible()
      await expect(page.locator('text=/Tom Buchanan/')).toBeVisible()
      await expect(page.locator('text=/Nick Carraway/')).toBeVisible()
      await expect(page.locator('text=/Daisy Buchanan/')).toBeVisible()

      // Pride and Prejudice - 5 characters
      await bookDetailPage.goto(2)
      await expect(page.locator('text=/Elizabeth Bennet/')).toBeVisible()
      await expect(page.locator('text=/Mr. Darcy/')).toBeVisible()
      await expect(page.locator('text=/Jane Bennet/')).toBeVisible()
      await expect(page.locator('text=/Mr. Bingley/')).toBeVisible()
      await expect(page.locator('text=/Mr. Wickham/')).toBeVisible()

      // 1984 - 4 characters
      await bookDetailPage.goto(3)
      await expect(page.locator('text=/Winston Smith/')).toBeVisible()
      await expect(page.locator('text=/Julia/')).toBeVisible()
      await expect(page.locator("text=/O'Brien/")).toBeVisible()
      await expect(page.locator('text=/Big Brother/')).toBeVisible()
    })

    test('should handle non-existent book gracefully', async ({ page }) => {
      await bookDetailPage.goto(999)

      // Should show "Book Not Found" message
      await expect(page.locator('text=/Book Not Found/i')).toBeVisible()
    })
  })

  test.describe('Integration Flow: Books -> Detail -> Back', () => {
    test('should complete full navigation flow', async ({ page }) => {
      // Start at books page
      await booksPage.goto()
      await expect(booksPage.pageTitle).toBeVisible()

      // Click View Characters on first book (The Great Gatsby)
      await booksPage.clickViewCharacters(0)

      // Should be on book detail page
      await expect(page).toHaveURL(/\/books\/1/)
      await expect(bookDetailPage.bookTitle).toContainText('The Great Gatsby')

      // View characters
      await expect(page.locator('text=/Jay Gatsby/')).toBeVisible()

      // Click a character button (should not navigate)
      await bookDetailPage.clickStartChat(0)
      await page.waitForTimeout(300)
      await expect(page).toHaveURL(/\/books\/1/)

      // Go back to books list
      await bookDetailPage.clickBreadcrumb()
      await expect(page).toHaveURL('/books')
      await expect(booksPage.pageTitle).toBeVisible()
    })

    test('should navigate between different books', async ({ page }) => {
      // Go to The Great Gatsby
      await bookDetailPage.goto(1)
      await expect(bookDetailPage.bookTitle).toContainText('The Great Gatsby')

      // Go back to list
      await bookDetailPage.clickBreadcrumb()

      // Click second book (Pride and Prejudice)
      await booksPage.clickViewCharacters(1)
      await expect(page).toHaveURL(/\/books\/2/)
      await expect(bookDetailPage.bookTitle).toContainText('Pride and Prejudice')

      // Go back to list
      await bookDetailPage.clickBreadcrumb()

      // Click third book (1984)
      await booksPage.clickViewCharacters(2)
      await expect(page).toHaveURL(/\/books\/3/)
      await expect(bookDetailPage.bookTitle).toContainText('1984')
    })
  })
})
