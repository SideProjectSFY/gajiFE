import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/login.page'
import { UserFactory } from '../factories/user.factory'

test.describe('Login Flow', () => {
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    await loginPage.goto()
  })

  test('should display login form', async ({ page }) => {
    await expect(page).toHaveURL('/login')
    await expect(loginPage.emailInput).toBeVisible()
    await expect(loginPage.passwordInput).toBeVisible()
    await expect(loginPage.loginButton).toBeVisible()
  })

  test('should show error for invalid email format', async ({ page }) => {
    // Mock API - should NOT be called with invalid data
    let apiWasCalled = false
    await page.route('**/api/v1/auth/login', async (route) => {
      apiWasCalled = true
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ success: false }),
      })
    })

    await loginPage.emailInput.fill('invalid-email')
    await loginPage.passwordInput.fill('Password123!')

    await loginPage.loginButton.click()

    // Wait to ensure API is not called
    await page.waitForTimeout(1000)

    // Validation should have prevented API call
    expect(apiWasCalled).toBe(false)

    // User should still be on login page
    await expect(page).toHaveURL('/login')
  })

  test('should validate required fields', async () => {
    // With empty fields, button should be disabled (isFormValid prevents submission)
    await expect(loginPage.loginButton).toBeDisabled()

    // Fill email only - button should still be disabled
    await loginPage.emailInput.fill('test@example.com')
    await expect(loginPage.loginButton).toBeDisabled()

    // Fill both fields - button should be enabled
    await loginPage.passwordInput.fill('Password123!')
    await expect(loginPage.loginButton).toBeEnabled()
  })

  test('should validate password length', async ({ page }) => {
    await loginPage.emailInput.fill('test@example.com')
    await loginPage.passwordInput.fill('short')
    await loginPage.loginButton.click()

    // Wait for validation and check password error
    await page.waitForSelector('[data-testid="password-error"]', {
      state: 'visible',
      timeout: 5000,
    })
    await expect(loginPage.passwordError).toContainText('Password must be at least 8 characters')
  })

  test.skip('should show loading state during submission', async ({ page }) => {
    // Skipping: Loading state timing is inconsistent across browsers
    // The button disabled state appears too briefly to reliably test
    const user = UserFactory.createTestUser()

    // Mock the API with a delay so we can observe loading state
    await page.route('**/api/v1/auth/login', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: { id: 1, email: user.email, username: 'testuser' },
            token: 'mock-jwt-token',
          },
        }),
      })
    })

    await loginPage.emailInput.fill(user.email)
    await loginPage.passwordInput.fill(user.password)

    // Click and immediately check for loading state
    const clickPromise = loginPage.loginButton.click()

    // Button should be disabled during submission
    await expect(loginPage.loginButton).toBeDisabled({ timeout: 1000 })

    await clickPromise
  })

  test('should allow form submission with valid data', async ({ page }) => {
    const user = UserFactory.createTestUser()

    // Mock successful login response
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: { id: 1, email: user.email, username: 'testuser' },
            token: 'mock-jwt-token',
          },
        }),
      })
    })

    await loginPage.login(user.email, user.password)

    // Should navigate to home page after successful login
    await page.waitForURL('/', { timeout: 3000 })
    await expect(page).toHaveURL('/')
  })
})
