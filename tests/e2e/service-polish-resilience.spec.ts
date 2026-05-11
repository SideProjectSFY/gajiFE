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

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function seedAuth(page: Page) {
  await page.addInitScript((token) => {
    window.localStorage.setItem('accessToken', token);
  }, demoJwt({ sub: 'user-1', username: 'alice' }));
}

async function installBaseMocks(page: Page) {
  await page.route('**/api/books/liked**', (route) => json(route, 200, { content: [], totalElements: 0, totalPages: 0 }));
  await page.route('**/api/scenarios/search**', (route) => json(route, 200, {
    content: [{ id: 'scenario-1', title: '편지가 먼저 도착한다면', description: '첫 편지가 먼저 도착하는 가지입니다.', bookTitle: 'Pride and Prejudice' }],
    totalElements: 1,
    totalPages: 1
  }));
}

test('home onboarding and card search explain the first path clearly', async ({ page }) => {
  await seedAuth(page);
  await installBaseMocks(page);

  await page.route('**/api/conversations**', (route) => json(route, 200, {
    content: [{ id: 'conv-1', title: 'Elizabeth와 첫인상에 대해 묻기', bookTitle: 'Pride and Prejudice' }],
    totalElements: 1,
    totalPages: 1
  }));
  await page.route('**/api/search**', (route) => json(route, 200, {
    books: [{ id: 'book-1', title: 'Pride and Prejudice', author: 'Jane Austen', scenarioCount: 3 }],
    scenarios: [{ id: 'scenario-1', title: '편지가 먼저 도착한다면', description: 'Darcy의 편지가 먼저 도착합니다.', bookTitle: 'Pride and Prejudice' }],
    conversations: [{ id: 'conv-1', title: '첫인상에 대해 묻기', bookTitle: 'Pride and Prejudice' }],
    users: [{ id: 'user-2', username: 'hana', bio: '고전을 다시 읽는 독자' }]
  }));

  await page.goto('/');
  await expect(page.getByRole('heading', { name: '세 단계로 첫 대화까지 가보세요' })).toBeVisible();
  await expect(page.getByRole('link', { name: /책 고르기/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /가지 선택 또는 생성/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /첫 질문 시작/ })).toBeVisible();

  await page.goto('/search?query=편지&page=0&size=6');
  await expect(page.getByRole('heading', { name: '시나리오 (1)' })).toBeVisible();
  await expect(page.getByRole('link', { name: /편지가 먼저 도착한다면/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Pride and Prejudice/ }).first()).toBeVisible();

  await page.route('**/api/search**', (route) => json(route, 200, { books: [], scenarios: [], conversations: [], users: [] }));
  await page.goto('/search?query=없는키워드&page=0&size=6');
  await expect(page.getByRole('heading', { name: '검색 결과가 없습니다' })).toBeVisible();
  await expect(page.getByRole('link', { name: '책 목록에서 다시 시작하기' })).toBeVisible();
});

test('scenario create prevents duplicate submits while the network is slow', async ({ page }) => {
  await seedAuth(page);
  let createCalls = 0;

  await page.route('**/api/scenarios', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    createCalls += 1;
    await wait(650);
    return json(route, 200, { id: 'scenario-slow', title: route.request().postDataJSON().title });
  });
  await page.route('**/api/scenarios/scenario-slow', (route) => json(route, 200, {
    id: 'scenario-slow',
    title: '느린 저장에도 한 번만 만드는 가지',
    description: '느린 네트워크에서 저장되는 가지입니다.',
    visibility: 'PUBLIC',
    bookTitle: 'Pride and Prejudice',
    characterName: 'Elizabeth Bennet'
  }));
  await page.route('**/api/scenarios/scenario-slow/tree', (route) => json(route, 200, {
    root: { id: 'scenario-slow', title: '느린 저장에도 한 번만 만드는 가지' }
  }));

  await page.goto('/scenarios/new');
  await page.locator('#scenario-title').fill('느린 저장에도 한 번만 만드는 가지');
  await page.locator('#scenario-description').fill('Darcy의 편지가 먼저 도착해 Elizabeth의 선택이 달라집니다.');
  await page.getByRole('button', { name: '가지 만들기' }).click();
  await expect(page.getByRole('button', { name: '저장 중입니다' })).toBeDisabled();
  await expect.poll(() => createCalls).toBe(1);
  await expect(page).toHaveURL(/\/scenarios\/scenario-slow/);
});

test('conversation actions recover from delay, duplicate clicks, and failures', async ({ page }) => {
  await seedAuth(page);
  let chatCompletionAttempts = 0;
  let legacyMessageAttempts = 0;
  let memoAttempts = 0;
  let likeAttempts = 0;

  await page.route('**/api/conversations/conv-resilient', (route) => json(route, 200, {
    id: 'conv-resilient',
    userId: 'user-1',
    scenarioId: 'scenario-1',
    title: 'Elizabeth와 첫인상에 대해 묻기',
    bookTitle: 'Pride and Prejudice',
    bookAuthor: 'Jane Austen',
    characterName: 'Elizabeth Bennet',
    scenarioTitle: '편지가 먼저 도착한다면',
    scenarioDescription: 'Darcy의 편지가 먼저 도착하면서 판단의 속도가 달라지는 가지입니다.',
    messageCount: 4,
    likeCount: 0,
    messages: [
      { id: 'm1', role: 'user', content: '그 편지를 먼저 받았다면 어땠을까요?' },
      { id: 'm2', role: 'assistant', content: '저라면 먼저 제 판단이 흔들렸다는 사실부터 인정했을 거예요.' },
      { id: 'm3', role: 'user', content: 'Darcy를 더 빨리 이해했을까요?' },
      { id: 'm4', role: 'assistant', content: '이해는 빨라졌겠지만 자존심은 여전히 남아 있었을 겁니다.' }
    ]
  }));
  await page.route('**/api/conversations/conv-resilient/parent', (route) => json(route, 404, { message: 'none' }));
  await page.route('**/api/conversations/conv-resilient/child', (route) => json(route, 404, { message: 'none' }));
  await page.route('**/api/conversations/conv-resilient/fork-relationship', (route) => json(route, 404, { message: 'none' }));
  await page.route('**/api/conversations/conv-resilient/like', async (route) => {
    if (route.request().method() === 'GET') return json(route, 200, { liked: false });
    likeAttempts += 1;
    await wait(450);
    if (likeAttempts === 1) return json(route, 500, { message: 'failed' });
    return json(route, 200, {});
  });
  await page.route('**/api/conversations/conv-resilient/memo', async (route) => {
    if (route.request().method() === 'GET') return json(route, 404, { message: 'none' });
    memoAttempts += 1;
    await wait(450);
    if (memoAttempts === 1) return json(route, 500, { message: 'failed' });
    return json(route, 200, { id: 'memo-1', conversationId: 'conv-resilient', content: route.request().postDataJSON().content });
  });
  await page.route('**/api/conversations/conv-resilient/messages/chat-completion', async (route) => {
    chatCompletionAttempts += 1;
    await wait(450);
    if (chatCompletionAttempts === 1) return json(route, 429, { message: 'rate limited' });
    const content = route.request().postDataJSON().content;
    return json(route, 200, {
      userMessage: { id: `user-${chatCompletionAttempts}`, role: 'user', content },
      assistantMessage: { id: `assistant-${chatCompletionAttempts}`, role: 'assistant', content: '그 질문은 이 가지의 핵심을 더 선명하게 만듭니다.' }
    });
  });
  await page.route('**/api/conversations/conv-resilient/messages', async (route) => {
    legacyMessageAttempts += 1;
    await wait(100);
    return json(route, 429, { message: 'rate limited' });
  });

  await page.goto('/conversations/conv-resilient');
  await expect(page.getByRole('heading', { name: '지금까지의 흐름' })).toBeVisible();
  await page.getByRole('button', { name: /원작과 가장 달라지는 장면/ }).click();
  await expect(page.getByLabel('메시지 입력')).toHaveValue(/원작과 가장 달라지는 장면/);

  await page.getByLabel('메시지 입력').fill('다음 장면은 무엇이 달라지나요?');
  await page.getByRole('button', { name: '전송' }).click();
  await expect(page.getByRole('button', { name: '전송' })).toBeDisabled();
  await expect(page.getByText('전송에 실패했습니다')).toBeVisible();
  await expect.poll(() => chatCompletionAttempts).toBe(1);
  await expect.poll(() => legacyMessageAttempts).toBe(1);

  await page.getByLabel('메시지 입력').fill('다시 물어볼게요. Elizabeth는 무엇을 다르게 보나요?');
  await page.getByRole('button', { name: '전송' }).click();
  await expect(page.getByText('그 질문은 이 가지의 핵심을 더 선명하게 만듭니다.')).toBeVisible();
  await expect.poll(() => chatCompletionAttempts).toBe(2);

  await page.locator('.conversation-memo-field textarea').fill('느린 저장 뒤에도 메모가 살아 있어야 합니다.');
  await page.getByRole('button', { name: '저장' }).click();
  await expect(page.locator('.conversation-memo-status')).toContainText('저장 실패');
  await page.getByRole('button', { name: '저장' }).click();
  await expect(page.locator('.conversation-memo-status')).toContainText('저장됨');

  await page.getByRole('button', { name: '좋아요' }).click();
  await expect(page.getByRole('button', { name: /좋아요/ })).toBeDisabled();
  await expect(page.getByText('좋아요 변경에 실패했습니다')).toBeVisible();
  await page.getByRole('button', { name: '좋아요' }).click();
  await expect(page.getByRole('button', { name: '좋아요 취소' })).toBeVisible();
  await expect.poll(() => likeAttempts).toBe(2);
});

test('profile follow action rolls back on failure and succeeds on retry', async ({ page }) => {
  await seedAuth(page);
  let followAttempts = 0;

  await page.route('**/api/users?username=bob', (route) => json(route, 200, {
    id: 'user-2',
    username: 'bob',
    bio: '다른 독자의 공개 가지를 탐험합니다.'
  }));
  await page.route('**/api/books/liked**', (route) => json(route, 200, { content: [], totalElements: 0, totalPages: 0 }));
  await page.route('**/api/conversations**', (route) => json(route, 200, { content: [], totalElements: 0, totalPages: 0 }));
  await page.route('**/api/users/user-2/following', (route) => json(route, 200, { content: [], totalElements: 0, totalPages: 0 }));
  await page.route('**/api/users/user-2/followers', (route) => json(route, 200, { content: [], totalElements: 0, totalPages: 0 }));
  await page.route('**/api/users/user-2/follow', async (route) => {
    followAttempts += 1;
    await wait(450);
    if (followAttempts === 1) return json(route, 500, { message: 'failed' });
    return json(route, 200, {});
  });

  await page.goto('/profile/bob');
  await page.getByRole('button', { name: '팔로우' }).click();
  await expect(page.getByRole('button', { name: '처리 중' })).toBeDisabled();
  await expect(page.getByText('팔로우 상태를 바꾸지 못했습니다. 다시 시도해주세요.')).toBeVisible();
  await page.getByRole('button', { name: '팔로우' }).click();
  await expect(page.getByText('팔로우했습니다.')).toBeVisible();
  await expect(page.getByRole('button', { name: '팔로잉' })).toBeVisible();
  await expect.poll(() => followAttempts).toBe(2);
});
