import { Page, Locator } from '@playwright/test'

export class BooksPage {
  readonly page: Page
  readonly pageTitle: Locator
  readonly genreFilters: Locator
  readonly bookCards: Locator
  readonly clearFiltersButton: Locator

  constructor(page: Page) {
    this.page = page
    this.pageTitle = page.getByRole('heading', { name: 'All Books' })
    this.genreFilters = page
      .locator('button')
      .filter({ hasText: /Romance|Classic|Social Commentary|Historical|Drama/ })
    this.bookCards = page.locator('[data-testid="book-card"]').or(page.locator('article'))
    this.clearFiltersButton = page.getByRole('button', { name: /Clear Filters/i })
  }

  async goto(): Promise<void> {
    await this.page.goto('/books')
  }

  async selectGenre(genre: string): Promise<void> {
    await this.page.getByRole('button', { name: genre, exact: true }).click()
  }

  async clickViewCharacters(bookIndex: number = 0): Promise<void> {
    const viewButtons = this.page.getByRole('button', { name: /View Characters/i })
    await viewButtons.nth(bookIndex).click()
  }

  async getBookCardByTitle(title: string): Promise<Locator> {
    return this.page.locator('article').filter({ hasText: title })
  }
}
