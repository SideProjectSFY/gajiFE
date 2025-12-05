import { Page, Locator } from '@playwright/test'

export class RegisterPage {
  readonly page: Page
  readonly usernameInput: Locator
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly confirmPasswordInput: Locator
  readonly registerButton: Locator
  readonly usernameError: Locator
  readonly emailError: Locator
  readonly passwordError: Locator
  readonly confirmPasswordError: Locator

  constructor(page: Page) {
    this.page = page
    this.usernameInput = page.getByTestId('username-input')
    this.emailInput = page.getByTestId('email-input')
    this.passwordInput = page.getByTestId('password-input')
    this.confirmPasswordInput = page.getByTestId('confirm-password-input')
    this.registerButton = page.getByTestId('register-button')
    this.usernameError = page.getByTestId('username-error')
    this.emailError = page.getByTestId('email-error')
    this.passwordError = page.getByTestId('password-error')
    this.confirmPasswordError = page.getByTestId('confirm-password-error')
  }

  async goto(): Promise<void> {
    await this.page.goto('/register')
  }

  async register(username: string, email: string, password: string): Promise<void> {
    await this.usernameInput.fill(username)
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.confirmPasswordInput.fill(password)
    await this.registerButton.click()
  }

  async isRegisterButtonDisabled(): Promise<boolean> {
    return await this.registerButton.isDisabled()
  }
}
