import { expect, test } from '@playwright/test';
import { installParityApiMocks, seedAuth } from './helpers/parityApiMocks';

const SEARCH_ERROR_PATTERN = /Search error: unable to search\. Please try again\.|오류/;

test.describe('app router parity gates', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test('not-found.tsx renders for invalid dynamic segments', async ({ page }) => {
    const invalidRoutes = [
      '/books/%24%24%24',
      '/conversations/%24%24%24',
      '/profile/%24%24%24'
    ];

    for (const path of invalidRoutes) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: '길을 잃으셨나요?' })).toBeVisible();
    }
  });

  test('error.tsx fallback rendering and recovery UX is available', async ({ page }) => {
    await installParityApiMocks(page, 'success');
    await page.goto('/books?__e2e_error=1');
    await expect(page.getByRole('heading', { name: 'Something went wrong' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.getByRole('heading', { name: 'Something went wrong' })).toBeVisible();
  });

  test('loading.tsx rendering appears while delayed server segment resolves', async ({ page }) => {
    await installParityApiMocks(page, 'success');
    await page.goto('/');
    const loadingPromise = page.waitForSelector('.loading-state', { timeout: 8000 });
    await page.goto('/books?__e2e_delay=1');
    await loadingPromise;
    await expect(page.getByRole('link', { name: 'First Book' })).toBeVisible();
  });

  test('metadata/title parity for migrated routes', async ({ page }) => {
    await installParityApiMocks(page, 'success');
    await page.goto('/about');
    await expect(page).toHaveTitle('소개 | Gaji');

    await page.goto('/books');
    await expect(page).toHaveTitle('책 | Gaji');

    await page.goto('/liked');
    await expect(page).toHaveTitle('좋아요한 대화 | Gaji');
  });

  test('protected routes enforce auth guard when token is absent', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem('accessToken');
      window.localStorage.removeItem('token');
    });

    await page.goto('/liked');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fliked/);
  });

  test('route-state matrix: empty and error variants are visible on migrated routes', async ({ page }) => {
    await installParityApiMocks(page, 'empty');

    await page.goto('/books');
    await expect(page.getByText('아직 이용 가능한 책이 없습니다.')).toBeVisible();

    await page.goto('/search?query=none');
    await expect(page.getByText('검색 결과가 없습니다')).toBeVisible();

    await page.goto('/liked');
    await expect(page.getByText('아직 좋아요한 대화가 없습니다')).toBeVisible();

    await installParityApiMocks(page, 'error');

    await page.goto('/books');
    await expect(page.getByRole('heading', { name: '페이지가 넘어가지 않아요...' })).toBeVisible();

    await page.goto('/search?query=boom');
    await expect(page.locator('.search-page__error-wrap')).toContainText(SEARCH_ERROR_PATTERN);

    await page.goto('/conversations');
    await expect(page.getByText('대화를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')).toBeVisible();
  });
});
