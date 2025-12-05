import { Page, Locator } from '@playwright/test'

export class BookDetailPage {
  readonly page: Page
  readonly breadcrumb: Locator
  readonly bookTitle: Locator
  readonly bookAuthor: Locator
  readonly bookDescription: Locator
  readonly bookTags: Locator
  readonly charactersTab: Locator
  readonly relationsTab: Locator
  readonly characterCards: Locator
  readonly featuredBadges: Locator
  readonly startChatButtons: Locator
  readonly tryToBookButtons: Locator

  constructor(page: Page) {
    this.page = page
    this.breadcrumb = page.locator('a', { hasText: '← Go to Book List' })
    this.bookTitle = page.locator('h1').first()
    this.bookAuthor = page.locator('text=/by .+/').first()
    this.bookDescription = page
      .locator('p')
      .filter({ hasText: /Set in|The novel follows|A dystopian/ })
      .first()
    this.bookTags = page.locator('span').filter({ hasText: /Classic|Drama|Romance/ })
    this.charactersTab = page.getByRole('button', { name: /All Characters/i })
    this.relationsTab = page.getByRole('button', { name: /Search Characters/i })
    this.characterCards = page.locator('[data-testid="character-card"]').or(page.locator('article'))
    this.featuredBadges = page.locator('span').filter({ hasText: /⭐ Featured/i })
    this.startChatButtons = page.getByRole('button', { name: /💬 Start Chat/i })
    this.tryToBookButtons = page.getByRole('button', { name: /📚 Try To Book/i })
  }

  async goto(bookId: string | number): Promise<void> {
    await this.page.goto(`/books/${bookId}`)
  }

  async clickBreadcrumb(): Promise<void> {
    await this.breadcrumb.click()
  }

  async switchToRelationsTab(): Promise<void> {
    await this.relationsTab.click()
  }

  async switchToCharactersTab(): Promise<void> {
    await this.charactersTab.click()
  }

  async clickStartChat(characterIndex: number = 0): Promise<void> {
    await this.startChatButtons.nth(characterIndex).click()
  }

  async clickTryToBook(characterIndex: number = 0): Promise<void> {
    await this.tryToBookButtons.nth(characterIndex).click()
  }

  async getCharacterByName(name: string): Promise<Locator> {
    return this.page.locator('article').filter({ hasText: name })
  }

  async getCharactersCount(): Promise<number> {
    return this.characterCards.count()
  }

  async getFeaturedCharactersCount(): Promise<number> {
    return this.featuredBadges.count()
  }
}
