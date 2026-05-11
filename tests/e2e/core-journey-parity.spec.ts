import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function gotoPath(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
}

const SEARCH_ERROR_PATTERN = /Search error: unable to search\. Please try again\.|오류/;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('accessToken', 'e2e-token');
  });
});

test('scenario journey parity: list, query semantics, detail tree', async ({ page }) => {
  const requestedUrls: string[] = [];
  let createPayload: Record<string, unknown> | null = null;

  await page.route('**/api/scenarios/search**', async (route) => {
    requestedUrls.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: [
          {
            id: 'scenario-1',
            title: 'Scenario One',
            description: 'desc',
            visibility: 'PUBLIC'
          }
        ],
        totalElements: 1,
        totalPages: 1,
        page: 0,
        size: 20
      })
    });
  });

  await page.route('**/api/scenarios/scenario-1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'scenario-1', title: 'Scenario One', description: 'desc', visibility: 'PUBLIC' })
    });
  });

  await page.route('**/api/scenarios/scenario-1/tree', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ root: { id: 'scenario-1', title: 'Scenario One' } })
    });
  });

  await page.route('**/api/scenarios', async (route) => {
    if (route.request().method() === 'POST') {
      createPayload = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'scenario-forked-1', title: 'Scenario Forked' })
      });
      return;
    }

    await route.fallback();
  });

  await gotoPath(page, '/scenarios?query=seed&page=1&size=10&filter=public&sort=latest');
  await expect(page.getByRole('link', { name: 'Scenario One' })).toBeVisible();
  expect(requestedUrls.some((value) => value.includes('query=seed'))).toBeTruthy();
  expect(requestedUrls.some((value) => value.includes('page=1'))).toBeTruthy();
  expect(requestedUrls.some((value) => value.includes('size=10'))).toBeTruthy();
  expect(requestedUrls.some((value) => value.includes('filter=public'))).toBeTruthy();

  await gotoPath(page, '/scenarios/scenario-1');
  await expect(page.getByRole('heading', { name: 'Scenario One' })).toBeVisible();
  await expect(page.getByText('시작점 · Scenario One')).toBeVisible();
  await page.getByRole('button', { name: /Fork Scenario|시나리오 포크|새 가지 만들기/ }).click();
  await expect(page).toHaveURL('/scenarios/new?forkFrom=scenario-1');
  expect(createPayload).toBeNull();
});

test('conversation journey parity: list, message send/poll, 404 parent-child null', async ({ page }) => {
  await page.route('**/api/conversations?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: [{ id: 'conv-1', title: 'Conversation One', updatedAt: '2026-02-18T00:00:00Z' }],
        totalElements: 1,
        totalPages: 1
      })
    });
  });

  await page.route('**/api/conversations/conv-1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'conv-1',
        title: 'Conversation One',
        messages: [{ role: 'assistant', content: 'hello from ai' }]
      })
    });
  });

  await page.route('**/api/conversations/conv-1/parent', async (route) => {
    await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'none' }) });
  });

  await page.route('**/api/conversations/conv-1/child', async (route) => {
    await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'none' }) });
  });

  await page.route('**/api/conversations/conv-1/like', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ liked: false }) });
      return;
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await page.route('**/api/conversations/conv-1/fork-relationship', async (route) => {
    await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'none' }) });
  });

  await page.route('**/api/conversations/conv-1/memo', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'none' }) });
      return;
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: 'memo text' }) });
  });

  await page.route('**/api/conversations/conv-1/messages', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'msg-user-1', role: 'user', content: 'hello' })
    });
  });

  await page.route('**/api/conversations/conv-1/messages/poll', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ role: 'assistant', content: 'response' }) });
  });

  await gotoPath(page, '/conversations?filter=mine&search=seed&genre=fantasy&sort=latest&page=0&size=20');
  await expect(page.getByRole('link', { name: 'Conversation One' })).toBeVisible();

  await gotoPath(page, '/conversations/conv-1');
  await expect(page.getByRole('heading', { name: 'Conversation One' })).toBeVisible();
  await expect(page.getByTestId('fork-conversation-button')).toBeVisible();

  await page.getByRole('textbox', { name: /메시지 입력|Message input/ }).fill('hello');
  await page.getByRole('button', { name: /전송|Send/ }).click();
  await expect(page.locator('.conversation-message--user')).toContainText('hello');
  await expect(page.locator('.conversation-message--assistant').last()).toContainText('response');

  await page.getByTestId('fork-conversation-button').click();
  await expect(page.getByTestId('fork-modal')).toBeVisible();
  await page.getByTestId('cancel-fork-button').click();
  await expect(page.getByTestId('fork-modal')).toBeHidden();
});

test('social journey parity: liked and followers/following pages', async ({ page }) => {
  await page.route('**/api/conversations?filter=liked**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [{ id: 'liked-1', title: 'Liked One' }], totalElements: 1, totalPages: 1 })
    });
  });

  await page.route('**/api/users/profile/alice', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'user-1', username: 'alice' })
    });
  });

  await page.route('**/api/users/user-1/followers**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [{ id: 'user-2', username: 'bob' }], totalElements: 1, totalPages: 1 })
    });
  });

  await page.route('**/api/users/user-1/following**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [{ id: 'user-3', username: 'carol' }], totalElements: 1, totalPages: 1 })
    });
  });

  await page.route('**/api/users/*/follow', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await page.route('**/api/users/*/unfollow', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await page.route('**/api/conversations/*/unlike', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await gotoPath(page, '/liked');
  await expect(page.getByRole('heading', { name: '좋아요한 대화' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Liked One' })).toBeVisible();
  await page.getByRole('button', { name: '좋아요 취소' }).click();

  await gotoPath(page, '/profile/alice/followers');
  await expect(page.getByRole('heading', { name: 'alice님의 팔로워' })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('link', { name: 'bob' })).toBeVisible();
  await expect(page.getByRole('button', { name: '팔로우' })).toBeVisible();

  await gotoPath(page, '/profile/alice/following');
  await expect(page.getByRole('heading', { name: 'alice님의 팔로잉' })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('link', { name: 'carol' })).toBeVisible();
  await expect(page.getByRole('button', { name: '팔로우 취소' })).toBeVisible();
});

test('search journey parity: aggregated results and empty/error states', async ({ page }) => {
  await page.route('**/api/search?query=hero**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        books: [{ id: 'book-1', title: 'Book' }],
        conversations: [{ id: 'conv-7', title: 'Conv' }],
        users: [{ id: 'user-7', username: 'hero-user' }],
        scenarios: [{ id: 'scenario-7', title: 'Scenario' }]
      })
    });
  });

  await page.route('**/api/search?query=none**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ books: [], conversations: [], users: [], scenarios: [] })
    });
  });

  await page.route('**/api/search?query=boom**', async (route) => {
    await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'fail' }) });
  });

  await gotoPath(page, '/search?query=hero&page=0&size=6');
  await expect(page.getByRole('button', { name: '전체' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '대화 (1)' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Conv' })).toBeVisible();

  await gotoPath(page, '/search?query=none&page=0&size=6');
  await expect(page.getByText('검색 결과가 없습니다')).toBeVisible();

  await gotoPath(page, '/search?query=boom&page=0&size=6');
  await expect(page.locator('.search-page__error-wrap')).toContainText(SEARCH_ERROR_PATTERN);
});

test('rollback-toggle parity: per-group cookie flag switches route handler immediately', async ({ request }) => {
  const checks = [
    { group: 'scenario', path: '/api/scenarios/search?query=x' },
    { group: 'conversation', path: '/api/conversations?page=0&size=1' },
    { group: 'social', path: '/api/users/user-1/followers?page=0&size=1' },
    { group: 'search', path: '/api/search?query=x' }
  ] as const;

  for (const check of checks) {
    const enabled = await request.get(check.path, {
      headers: { Cookie: `journey_rollback_${check.group}=true` }
    });
    expect(enabled.status()).toBe(503);
    expect(enabled.headers()['x-journey-rollback']).toContain(check.group);

    const disabled = await request.get(check.path, {
      headers: {
        Cookie: `journey_rollback_${check.group}=false`,
        'x-e2e-downstream-mock': 'true'
      }
    });
    expect(disabled.status()).toBe(200);
    const payload = (await disabled.json()) as { mocked?: boolean };
    expect(payload.mocked).toBeTruthy();
  }
});
