import { expect, test } from '@playwright/test';

test('auth language selection localizes login and register pages', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: '이야기의 가지를 계속 탐험하세요' })).toBeVisible();

  await page.locator('.auth-language').click();
  await expect(page.getByRole('heading', { name: 'Continue exploring story branches' })).toBeVisible();

  await page.goto('/register');
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();

  await page.locator('.auth-language').click();
  await expect(page.getByRole('heading', { name: '계정 만들기' })).toBeVisible();
});

test('selected language is sent with catalog requests', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('locale', 'en');
    window.localStorage.setItem('locale-storage', JSON.stringify({ state: { locale: 'en' }, version: 0 }));
  });

  let observedLanguage = '';

  await page.route('**/api/catalog/books**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname !== '/api/catalog/books') {
      return route.fallback();
    }

    observedLanguage = route.request().headers()['accept-language'] ?? '';
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: [
          {
            id: 'book-1',
            title: 'First Book',
            author: 'Author A',
            genre: 'Fantasy',
            description: 'A fantasy book',
            scenarioCount: 1,
            conversationCount: 1,
            likeCount: 1
          }
        ],
        totalElements: 1,
        totalPages: 1
      })
    });
  });

  await page.goto('/books');
  await expect(page.getByRole('heading', { name: 'Books' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'First Book' })).toBeVisible();
  expect(observedLanguage).toBe('en');
});
