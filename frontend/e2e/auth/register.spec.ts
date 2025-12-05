import { test, expect } from '@playwright/test'
import { RegisterPage } from '../pages/register.page'
import { UserFactory } from '../factories/user.factory'

test.describe('Register Flow', () => {
  let registerPage: RegisterPage

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page)
    await registerPage.goto()
  })

  test('should display registration form', async ({ page }) => {
    await expect(page).toHaveURL('/register')
    await expect(registerPage.usernameInput).toBeVisible()
    await expect(registerPage.emailInput).toBeVisible()
    await expect(registerPage.passwordInput).toBeVisible()
    await expect(registerPage.confirmPasswordInput).toBeVisible()
    await expect(registerPage.registerButton).toBeVisible()
  })

  test('should validate username length', async ({ page }) => {
    await registerPage.usernameInput.fill('ab')
    await registerPage.emailInput.fill('test@example.com')
    await registerPage.passwordInput.fill('TestPass123!')
    await registerPage.confirmPasswordInput.fill('TestPass123!')

    // Button should be enabled
    await expect(registerPage.registerButton).toBeEnabled()

    await registerPage.registerButton.click()

    // Wait for validation error to appear
    await page.waitForSelector('[data-testid="username-error"]', {
      state: 'visible',
      timeout: 5000,
    })
    await expect(registerPage.usernameError).toContainText('Username must be at least 3 characters')
  })

  test('should validate email format', async ({ page }) => {
    // Mock the API - should NOT be called with invalid data
    let apiWasCalled = false
    await page.route('**/api/v1/auth/register', async (route) => {
      apiWasCalled = true
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Should not be called' }),
      })
    })

    await registerPage.usernameInput.fill('testuser')
    await registerPage.emailInput.fill('invalid-email')
    await registerPage.passwordInput.fill('TestPass123!')
    await registerPage.confirmPasswordInput.fill('TestPass123!')

    await registerPage.registerButton.click()

    // Wait to ensure API is not called
    await page.waitForTimeout(1000)

    // Validation should have prevented API call
    expect(apiWasCalled).toBe(false)

    // User should still be on register page (not redirected)
    await expect(page).toHaveURL('/register')
  })

  test('should validate password strength', async ({ page }) => {
    await registerPage.usernameInput.fill('testuser')
    await registerPage.emailInput.fill('test@example.com')
    await registerPage.passwordInput.fill('weak')
    await registerPage.confirmPasswordInput.fill('weak')

    // Button should be enabled
    await expect(registerPage.registerButton).toBeEnabled()

    await registerPage.registerButton.click()

    // Wait for validation error
    await page.waitForSelector('[data-testid="password-error"]', {
      state: 'visible',
      timeout: 5000,
    })
    await expect(registerPage.passwordError).toContainText(
      'Password must be at least 8 characters with uppercase, lowercase, and number'
    )
  })

  test('should validate password match', async () => {
    const user = UserFactory.createTestUser()

    await registerPage.usernameInput.fill(user.username)
    await registerPage.emailInput.fill(user.email)
    await registerPage.passwordInput.fill(user.password)
    await registerPage.confirmPasswordInput.fill('DifferentPassword123!')

    // Button should be disabled because passwords don't match (isFormValid checks this)
    await expect(registerPage.registerButton).toBeDisabled()

    // Fix the password match
    await registerPage.confirmPasswordInput.fill(user.password)

    // Now button should be enabled
    await expect(registerPage.registerButton).toBeEnabled()
  })

  test('should disable register button with invalid form', async () => {
    // Empty form should have disabled button
    await expect(registerPage.registerButton).toBeDisabled()
  })

  test('should allow registration with valid data', async ({ page }) => {
    const user = UserFactory.createTestUser()

    // Mock successful registration response
    await page.route('**/api/v1/auth/register', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: { id: 1, email: user.email, username: user.username },
            token: 'mock-jwt-token',
          },
        }),
      })
    })

    await registerPage.register(user.username, user.email, user.password)

    // Should navigate to home page after successful registration
    await page.waitForURL('/', { timeout: 3000 })
    await expect(page).toHaveURL('/')
  })

  test('should validate all required fields', async () => {
    // With empty form, button should be disabled
    await expect(registerPage.registerButton).toBeDisabled()

    // Fill some fields but not all - button still disabled
    await registerPage.usernameInput.fill('testuser')
    await expect(registerPage.registerButton).toBeDisabled()

    await registerPage.emailInput.fill('test@example.com')
    await expect(registerPage.registerButton).toBeDisabled()

    // Fill password but not confirm - button still disabled
    await registerPage.passwordInput.fill('TestPass123!')
    await expect(registerPage.registerButton).toBeDisabled()

    // Fill confirm password - button should now be enabled
    await registerPage.confirmPasswordInput.fill('TestPass123!')
    await expect(registerPage.registerButton).toBeEnabled()
  })
})
