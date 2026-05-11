import { expect, test, type Page, type Route } from '@playwright/test';

function json(route: Route, status: number, body: unknown): Promise<void> {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body)
  });
}

function demoJwt(payload: Record<string, string>): string {
  return `e30.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.sig`;
}

async function installFlowMocks(page: Page): Promise<void> {
  let memoSaveAttempts = 0;

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (path === '/api/scenarios/scenario-1') {
      return json(route, 200, {
        id: 'scenario-1',
        title: 'Scenario One',
        description: 'desc',
        visibility: 'PUBLIC',
        username: 'alice',
        bookTitle: 'First Book',
        characterName: 'Hero'
      });
    }

    if (path === '/api/scenarios' && method === 'POST') {
      return json(route, 200, { id: 'scenario-saved', title: request.postDataJSON().title });
    }

    if (path === '/api/scenarios/scenario-saved') {
      return json(route, 200, {
        id: 'scenario-saved',
        title: '편지가 먼저 도착하는 가지',
        description: '저장된 가지입니다.',
        visibility: 'PRIVATE',
        username: 'alice',
        bookTitle: 'First Book',
        characterName: 'Hero'
      });
    }

    if (path === '/api/scenarios/scenario-saved/tree') {
      return json(route, 200, { root: { id: 'scenario-saved', title: '편지가 먼저 도착하는 가지' } });
    }

    if (path === '/api/scenarios/search') {
      return json(route, 200, {
        content: [{ id: 'scenario-1', title: 'Scenario One', description: 'desc', visibility: 'PUBLIC' }],
        totalElements: 1,
        totalPages: 1
      });
    }

    if (path === '/api/conversations') {
      return json(route, 200, {
        content: [{ id: 'conv-1', title: 'Conversation One', bookTitle: 'First Book' }],
        totalElements: 1,
        totalPages: 1
      });
    }

    if (path === '/api/conversations/conv-1') {
      return json(route, 200, {
        id: 'conv-1',
        userId: 'user-1',
        title: 'Conversation One',
        bookTitle: 'First Book',
        bookAuthor: 'Author A',
        characterName: 'Hero',
        scenarioTitle: 'Scenario One',
        scenarioDescription: 'desc',
        messageCount: 1,
        likeCount: 0,
        messages: [{ id: 'assistant-1', role: 'assistant', content: 'hello from ai' }]
      });
    }

    if (path === '/api/conversations/conv-1/parent' || path === '/api/conversations/conv-1/child' || path === '/api/conversations/conv-1/fork-relationship') {
      return json(route, 404, { message: 'none' });
    }

    if (path === '/api/conversations/conv-1/like') {
      return json(route, 200, method === 'GET' ? { liked: false } : {});
    }

    if (path === '/api/conversations/conv-1/memo') {
      if (method === 'GET') return json(route, 404, { message: 'none' });
      memoSaveAttempts += 1;
      if (memoSaveAttempts === 1) return json(route, 500, { message: 'failed' });
      return json(route, 200, { id: 'memo-1', conversationId: 'conv-1', content: request.postDataJSON().content });
    }

    if (path === '/api/books/liked') {
      return json(route, 200, {
        content: [{ id: 'book-1', title: 'First Book', author: 'Author A' }],
        totalElements: 1,
        totalPages: 1
      });
    }

    if (path === '/api/users' && url.searchParams.get('username') === 'alice') {
      return json(route, 200, { id: 'user-1', username: 'alice', bio: 'Reader and branch explorer' });
    }

    if (path === '/api/users/user-1/following' || path === '/api/users/user-1/followers') {
      return json(route, 200, {
        content: [{ id: 'user-2', username: 'bob' }],
        totalElements: 1,
        totalPages: 1
      });
    }

    return json(route, 200, {});
  });
}

test('draft preservation, memo failure recovery, and profile activity flow', async ({ page }) => {
  await page.addInitScript((token) => {
    window.localStorage.setItem('accessToken', token);
  }, demoJwt({ sub: 'user-1', username: 'alice' }));
  await installFlowMocks(page);

  await page.goto('/scenarios/new?forkFrom=scenario-1');
  await page.locator('#scenario-title').fill('편지가 먼저 도착하는 가지');
  await page.locator('#scenario-description').fill('Darcy의 편지가 하루 먼저 도착해 Elizabeth의 판단이 달라지는 초안입니다.');
  await expect(page.locator('.scenario-draft-status')).toContainText('초안이 이 브라우저에 저장되었습니다');

  await page.goto('/');
  await expect(page.getByText('작성 중인 가지').first()).toBeVisible();
  await expect(page.getByRole('link', { name: /편지가 먼저 도착하는 가지/ }).first()).toBeVisible();

  await page.getByRole('link', { name: /편지가 먼저 도착하는 가지/ }).first().click();
  await expect(page.locator('#scenario-title')).toHaveValue('편지가 먼저 도착하는 가지');
  await page.getByRole('button', { name: '비공개 가지' }).click();
  await page.getByRole('button', { name: '가지 만들기' }).click();
  await expect(page).toHaveURL(/\/scenarios\/scenario-saved/);

  await page.goto('/conversations/conv-1');
  await page.locator('.conversation-memo-field textarea').fill('다음 대화에서 Jane의 반응을 더 묻기.');
  await expect(page.locator('.conversation-memo-status')).toContainText('수정 중');
  await page.getByRole('button', { name: '저장' }).click();
  await expect(page.locator('.conversation-memo-status')).toContainText('저장 실패');
  await page.locator('.conversation-memo-field textarea').fill('다음 대화에서 Jane과 Darcy의 반응을 같이 묻기.');
  await page.getByRole('button', { name: '저장' }).click();
  await expect(page.locator('.conversation-memo-status')).toContainText('저장됨');

  await page.goto('/profile/alice');
  await expect(page.getByRole('heading', { name: '최근 움직임' })).toBeVisible();
});
