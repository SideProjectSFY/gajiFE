import type { Page, Route } from '@playwright/test';

type ParityState = 'success' | 'empty' | 'error';

function json(route: Route, status: number, body: unknown): Promise<void> {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body)
  });
}

export async function installParityApiMocks(page: Page, state: ParityState): Promise<void> {
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const isError = state === 'error';
    const isEmpty = state === 'empty';

    if (path === '/api/catalog/books') {
      if (isError) return json(route, 500, { message: 'failed' });
      return json(route, 200, {
        content: isEmpty
          ? []
          : [
              {
                id: 'book-1',
                title: 'First Book',
                author: 'Author A',
                genre: 'Fantasy',
                description: 'A fantasy book',
                scenarioCount: 12,
                conversationCount: 34,
                likeCount: 56
              }
            ],
        totalElements: isEmpty ? 0 : 1,
        totalPages: 1
      });
    }

    if (path === '/api/catalog/books/book-1') {
      if (isError) return json(route, 500, { message: 'failed' });
      return json(route, 200, {
        id: 'book-1',
        title: 'First Book',
        author: 'Author A',
        genre: 'Fantasy',
        description: 'A fantasy book',
        scenarioCount: 12,
        conversationCount: 34,
        likeCount: 56
      });
    }

    if (path === '/api/books/book-1/comments') {
      if (isError) return json(route, 500, { message: 'failed' });
      return json(route, 200, { content: [], totalElements: 0, totalPages: 0 });
    }

    if (path === '/api/books/liked') {
      if (isError) return json(route, 500, { message: 'failed' });
      return json(route, 200, {
        content: isEmpty ? [] : [{ id: 'book-1', title: 'First Book', author: 'Author A' }],
        totalElements: isEmpty ? 0 : 1,
        totalPages: 1
      });
    }

    if (path === '/api/scenarios/search') {
      if (isError) return json(route, 500, { message: 'failed' });
      return json(route, 200, {
        content: isEmpty
          ? []
          : [
              {
                id: 'scenario-1',
                title: 'Scenario One',
                description: 'desc',
                visibility: 'PUBLIC',
                username: 'alice',
                bookTitle: 'First Book',
                characterName: 'Hero',
                originalScene: 'The first proposal',
                whatIfQuestion: 'What if the letter arrived first?'
              }
            ],
        totalElements: isEmpty ? 0 : 1,
        totalPages: 1,
        page: 0,
        size: 20
      });
    }

    if (path === '/api/scenarios/scenario-1') {
      if (isError) return json(route, 500, { message: 'failed' });
      return json(route, 200, {
        id: 'scenario-1',
        title: 'Scenario One',
        description: 'desc',
        visibility: 'PUBLIC',
        username: 'alice',
        bookTitle: 'First Book',
        characterName: 'Hero',
        originalScene: 'The first proposal',
        whatIfQuestion: 'What if the letter arrived first?'
      });
    }

    if (path === '/api/scenarios/scenario-1/tree') {
      if (isError) return json(route, 500, { message: 'failed' });
      return json(route, 200, { root: { id: 'scenario-1', title: 'Scenario One' } });
    }

    if (path === '/api/search') {
      const query = url.searchParams.get('query');
      if (isError || query === 'boom') return json(route, 500, { message: 'failed' });
      if (isEmpty || query === 'none') return json(route, 200, { books: [], conversations: [], users: [], scenarios: [] });
      return json(route, 200, {
        books: [{ id: 'book-1', title: 'Book', author: 'Author A', scenarioCount: 12 }],
        conversations: [{ id: 'conv-7', title: 'Conv', bookTitle: 'First Book' }],
        users: [{ id: 'user-7', username: 'hero-user', bio: 'Reader' }],
        scenarios: [{ id: 'scenario-7', title: 'Scenario', description: 'A changed choice', bookTitle: 'First Book' }]
      });
    }

    if (path === '/api/conversations') {
      const filter = url.searchParams.get('filter');
      if (isError) return json(route, 500, { message: 'failed' });
      if (filter === 'liked') {
        return json(route, 200, {
          content: isEmpty ? [] : [{ id: 'liked-1', title: 'Liked One' }],
          totalElements: isEmpty ? 0 : 1,
          totalPages: 1
        });
      }
      return json(route, 200, {
        content: isEmpty ? [] : [{ id: 'conv-1', title: 'Conversation One', updatedAt: '2026-02-18T00:00:00Z' }],
        totalElements: isEmpty ? 0 : 1,
        totalPages: 1
      });
    }

    if (path === '/api/conversations/conv-1') {
      if (isError) return json(route, 500, { message: 'failed' });
      return json(route, 200, {
        id: 'conv-1',
        userId: 'user-1',
        title: 'Conversation One',
        bookTitle: 'First Book',
        bookAuthor: 'Author A',
        characterName: 'Hero',
        scenarioTitle: 'Scenario One',
        scenarioDescription: 'desc',
        messageCount: isEmpty ? 0 : 1,
        likeCount: 0,
        messages: isEmpty ? [] : [{ role: 'assistant', content: 'hello from ai' }]
      });
    }

    if (path === '/api/conversations/conv-1/parent' || path === '/api/conversations/conv-1/child' || path === '/api/conversations/conv-1/fork-relationship') {
      if (isError) return json(route, 500, { message: 'failed' });
      return json(route, 404, { message: 'none' });
    }

    if (path === '/api/conversations/conv-1/like') {
      if (isError) return json(route, 500, { message: 'failed' });
      if (request.method() === 'GET') return json(route, 200, { liked: false });
      return json(route, 200, {});
    }

    if (path === '/api/conversations/conv-1/memo') {
      if (isError) return json(route, 500, { message: 'failed' });
      if (request.method() === 'GET') return json(route, 404, { message: 'none' });
      return json(route, 200, { content: 'memo text' });
    }

    if (path === '/api/conversations/conv-1/messages') {
      if (isError) return json(route, 500, { message: 'failed' });
      return json(route, 200, { id: 'msg-user-1', role: 'user', content: 'hello' });
    }

    if (path === '/api/conversations/conv-1/messages/poll') {
      if (isError) return json(route, 500, { message: 'failed' });
      return json(route, 200, { id: 'msg-assistant-1', role: 'assistant', content: 'response' });
    }

    if (path === '/api/users/profile/alice') {
      if (isError) return json(route, 500, { message: 'failed' });
      return json(route, 200, { id: 'user-1', username: 'alice' });
    }

    if (path === '/api/users' && url.searchParams.get('username') === 'alice') {
      if (isError) return json(route, 500, { message: 'failed' });
      return json(route, 200, { id: 'user-1', username: 'alice', bio: 'Reader and branch explorer' });
    }

    if (path === '/api/users/user-1/followers') {
      if (isError) return json(route, 500, { message: 'failed' });
      return json(route, 200, {
        content: isEmpty ? [] : [{ id: 'user-2', username: 'bob' }],
        totalElements: isEmpty ? 0 : 1,
        totalPages: 1
      });
    }

    if (path === '/api/users/user-1/following') {
      if (isError) return json(route, 500, { message: 'failed' });
      return json(route, 200, {
        content: isEmpty ? [] : [{ id: 'user-3', username: 'carol' }],
        totalElements: isEmpty ? 0 : 1,
        totalPages: 1
      });
    }

    if (path.endsWith('/follow') || path.endsWith('/unfollow') || path.endsWith('/unlike')) {
      if (isError) return json(route, 500, { message: 'failed' });
      return json(route, 200, {});
    }

    return route.fallback();
  });
}

export async function seedAuth(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('accessToken', 'e2e-token');
  });
}
