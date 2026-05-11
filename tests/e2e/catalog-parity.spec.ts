import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function gotoPath(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
}

const booksPayload = {
  content: [
    {
      id: 'book-1',
      title: 'First Book',
      author: 'Author A',
      genre: 'Fantasy',
      description: 'A fantasy book',
      scenarioCount: 12,
      conversationCount: 34,
      likeCount: 56
    },
    {
      id: 'book-2',
      title: 'Second Book',
      author: 'Author B',
      genre: 'Mystery',
      description: 'A mystery book',
      scenarioCount: 2,
      conversationCount: 3,
      likeCount: 4
    }
  ],
  totalElements: 2,
  totalPages: 1,
  page: 0,
  size: 20
};

test('catalog browse parity happy path with filter/sort/search', async ({ page }) => {
  const requestedUrls: string[] = [];

  await page.route('**/api/catalog/books**', async (route) => {
    requestedUrls.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(booksPayload)
    });
  });

  await gotoPath(page, '/books');

  await expect(page.getByText('2 권의 책 이용 가능')).toBeVisible();
  await expect(page.getByRole('link', { name: 'First Book' })).toBeVisible();

  await page.getByRole('button', { name: '판타지' }).click();
  await expect(page).toHaveURL(/genre=Fantasy/, { timeout: 10000 });

  await page.getByRole('button', { name: '인기순' }).click();
  await expect(page).toHaveURL(/sort=popular/, { timeout: 10000 });

  expect(requestedUrls.some((value) => value.includes('genre=Fantasy'))).toBeTruthy();
  expect(requestedUrls.some((value) => value.includes('sort=popular'))).toBeTruthy();
});

test('catalog browse parity error path', async ({ page }) => {
  await page.route('**/api/catalog/books**', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'failed' })
    });
  });

  await gotoPath(page, '/books');

  await expect(page.getByRole('heading', { name: '페이지가 넘어가지 않아요...' })).toBeVisible();
});

test('catalog detail parity happy and error paths', async ({ page }) => {
  await page.route('**/api/catalog/books/book-1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'book-1',
        title: 'First Book',
        author: 'Author A',
        genre: 'Fantasy',
        description: 'A fantasy book',
        scenarioCount: 12,
        conversationCount: 34,
        likeCount: 56
      })
    });
  });

  await page.route('**/api/catalog/books/book-404', async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'not found' })
    });
  });

  await page.route('**/api/books/book-1/comments**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [], totalElements: 0, totalPages: 0 })
    });
  });

  await page.route('**/api/books/book-404/comments**', async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'not found' })
    });
  });

  await gotoPath(page, '/books/book-1');

  await expect(page.getByRole('heading', { name: 'First Book' })).toBeVisible();
  await expect(page.getByText('Author A')).toBeVisible();
  await expect(page.locator('article p').filter({ hasText: /^Fantasy$/ })).toBeVisible();

  await gotoPath(page, '/books/book-404');
  await expect(page.getByText('책 세부 정보를 불러오는데 실패했습니다')).toBeVisible();
});
