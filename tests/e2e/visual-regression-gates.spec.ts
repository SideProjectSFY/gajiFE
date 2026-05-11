import { expect, test } from '@playwright/test';
import { installParityApiMocks, seedAuth } from './helpers/parityApiMocks';

test.describe.configure({ timeout: 120000 });

function demoJwt(payload: Record<string, string>): string {
  return `e30.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.sig`;
}

test.beforeEach(async ({ page }) => {
  await seedAuth(page);
  await installParityApiMocks(page, 'success');
});

test('visual parity baseline: public and auth shell pages', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '지금 이어갈 수 있는 작업' })).toBeVisible();
  await expect(page).toHaveScreenshot('visual-home.png');

  await page.goto('/about');
  await expect(page).toHaveScreenshot('visual-about.png');

  await page.goto('/login');
  await expect(page).toHaveScreenshot('visual-login.png');

  await page.goto('/register');
  await expect(page).toHaveScreenshot('visual-register.png');
});

test('visual parity baseline: catalog and scenario/search pages', async ({ page }) => {
  await page.goto('/books');
  await expect(page.getByRole('link', { name: 'First Book' })).toBeVisible();
  await expect(page).toHaveScreenshot('visual-books.png');

  await page.goto('/books/book-1');
  await expect(page.getByRole('heading', { name: 'First Book' })).toBeVisible();
  await expect(page).toHaveScreenshot('visual-book-detail.png');

  await page.goto('/search?query=hero&page=0&size=6');
  await expect(page.getByRole('link', { name: 'Conv' })).toBeVisible();
  await expect(page).toHaveScreenshot('visual-search.png');

  await page.goto('/scenarios');
  await expect(page.getByRole('link', { name: 'Scenario One' })).toBeVisible();
  await expect(page).toHaveScreenshot('visual-scenarios.png');

  await page.goto('/scenarios/scenario-1');
  await expect(page.getByRole('heading', { name: 'Scenario One' })).toBeVisible();
  await expect(page).toHaveScreenshot('visual-scenario-detail.png');
});

test('visual parity baseline: conversation and social pages', async ({ page }) => {
  await page.goto('/conversations');
  await expect(page.getByRole('link', { name: 'Conversation One' })).toBeVisible();
  await expect(page).toHaveScreenshot('visual-conversations.png');

  await page.goto('/conversations/conv-1');
  await expect(page.getByRole('heading', { name: 'Conversation One' })).toBeVisible();
  await expect(page).toHaveScreenshot('visual-conversation-detail.png');

  await page.goto('/liked');
  await expect(page.getByRole('heading', { name: '좋아요한 대화' })).toBeVisible();
  await expect(page).toHaveScreenshot('visual-liked.png');

  await page.goto('/profile/alice');
  await expect(page.getByRole('heading', { name: 'alice' })).toBeVisible();
  await expect(page).toHaveScreenshot('visual-profile.png');

  await page.goto('/profile/alice/followers');
  await expect(page.getByRole('heading', { name: 'alice님의 팔로워' })).toBeVisible();
  await expect(page).toHaveScreenshot('visual-followers.png');

  await page.goto('/profile/alice/following');
  await expect(page.getByRole('heading', { name: 'alice님의 팔로잉' })).toBeVisible();
  await expect(page).toHaveScreenshot('visual-following.png');
});

test('visual polish: fork form and memo input states', async ({ page }) => {
  const ownerToken = demoJwt({ sub: 'user-1', username: 'alice' });
  await page.addInitScript((token) => {
    window.localStorage.setItem('accessToken', token);
  }, ownerToken);

  await page.goto('/scenarios/new?forkFrom=scenario-1');
  await expect(page.getByText('원본 맥락')).toBeVisible();
  await expect(page.locator('#scenario-description')).toHaveCSS('resize', 'none');
  await expect(page.locator('.scenario-origin-summary')).toBeVisible();
  await expect(page).toHaveScreenshot('visual-input-scenario-form.png');

  await page.goto('/conversations/conv-1');
  await expect(page.locator('.conversation-memo-status')).toContainText('메모 없음');
  await expect(page.locator('.conversation-memo-field textarea')).toHaveCSS('resize', 'none');
  await page.locator('.conversation-memo-field textarea').fill('다음 대화에서 인물이 숨긴 동기를 더 묻기.');
  await expect(page.locator('.conversation-memo-status')).toContainText('수정 중');
  await expect(page).toHaveScreenshot('visual-input-conversation-memo.png');
});
