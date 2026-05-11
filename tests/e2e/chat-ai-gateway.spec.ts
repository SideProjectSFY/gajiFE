import { expect, type Page, type Route, test } from '@playwright/test';
import { seedAuth } from './helpers/parityApiMocks';

type ChatFlowMockOptions = {
  completionStatus?: number;
  legacyMessageStatus?: number;
};

function json(route: Route, status: number, body: unknown): Promise<void> {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body)
  });
}

async function installChatFlowMocks(page: Page, options: ChatFlowMockOptions = {}) {
  const state = {
    completionRequestBody: null as unknown
  };

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (path === '/api/conversations' && method === 'GET') {
      return json(route, 200, {
        content: [
          {
            id: 'conv-chat',
            title: 'Live Chat Conversation',
            bookTitle: 'Gaji Test Novel',
            bookAuthor: 'Gaji QA',
            scenarioDescription: 'A route-continuity test conversation.',
            messageCount: 1,
            updatedAt: '2026-05-08T00:00:00Z'
          }
        ],
        totalElements: 1,
        totalPages: 1
      });
    }

    if (path === '/api/conversations/conv-chat' && method === 'GET') {
      return json(route, 200, {
        id: 'conv-chat',
        title: 'Live Chat Conversation',
        userId: 'owner-1',
        isRoot: true,
        messages: [
          {
            id: 'assistant-seed',
            conversationId: 'conv-chat',
            role: 'assistant',
            content: '어서 오세요. 어떤 가지를 탐험해볼까요?',
            createdAt: '2026-05-08T00:00:00Z'
          }
        ]
      });
    }

    if (path === '/api/conversations/conv-chat/parent' && method === 'GET') {
      return json(route, 404, { message: 'none' });
    }

    if (path === '/api/conversations/conv-chat/child' && method === 'GET') {
      return json(route, 404, { message: 'none' });
    }

    if (path === '/api/conversations/conv-chat/like' && method === 'GET') {
      return json(route, 200, { liked: false });
    }

    if (path === '/api/conversations/conv-chat/memo' && method === 'GET') {
      return json(route, 404, { message: 'none' });
    }

    if (path === '/api/conversations/conv-chat/fork-relationship' && method === 'GET') {
      return json(route, 404, { message: 'none' });
    }

    if (path === '/api/conversations/conv-chat/messages/chat-completion' && method === 'POST') {
      state.completionRequestBody = request.postDataJSON();

      if (options.completionStatus && options.completionStatus >= 400) {
        return json(route, options.completionStatus, { message: 'failed' });
      }

      return json(route, 200, {
        userMessage: {
          id: 'user-live-1',
          conversationId: 'conv-chat',
          role: 'user',
          content: 'hello ai',
          createdAt: '2026-05-08T00:00:01Z'
        },
        assistantMessage: {
          id: 'assistant-live-1',
          conversationId: 'conv-chat',
          role: 'assistant',
          content: 'direct-ai-response',
          createdAt: '2026-05-08T00:00:02Z',
          rag: {
            groundingStatus: 'grounded',
            fallbackUsed: false,
            citations: []
          },
          providerElapsedMs: 123
        },
        provider: 'mock',
        model: 'e2e-model',
        tokenUsage: 42
      });
    }

    if (path === '/api/conversations/conv-chat/messages' && method === 'POST') {
      return json(route, options.legacyMessageStatus ?? 500, { message: 'legacy fallback failed' });
    }

    return route.fallback();
  });

  return state;
}

test.beforeEach(async ({ page }) => {
  await seedAuth(page);
});

test('chat entrypoint continues into a conversation and sends prompt through chat-completion', async ({ page }) => {
  const chatFlow = await installChatFlowMocks(page);

  await page.goto('/chat');
  await expect(page).toHaveURL(/\/conversations$/);
  await page.getByRole('link', { name: 'Live Chat Conversation' }).click();

  await expect(page).toHaveURL(/\/conversations\/conv-chat$/);
  await expect(page.getByRole('heading', { name: 'Live Chat Conversation' })).toBeVisible();

  await page.getByRole('textbox', { name: /메시지 입력|Message input/ }).fill('hello ai');
  await page.getByRole('button', { name: /전송|Send/ }).click();

  await expect(page.locator('.conversation-message--user')).toContainText('hello ai');
  await expect(page.locator('.conversation-message--assistant').last()).toContainText('direct-ai-response');
  await expect(page.locator('.rag-strip')).toContainText(/근거 확인됨|Sources verified/);
  expect(chatFlow.completionRequestBody).toEqual({ content: 'hello ai' });
});

test('conversation chat clears pending state and shows an error when completion and fallback fail', async ({ page }) => {
  await installChatFlowMocks(page, {
    completionStatus: 500,
    legacyMessageStatus: 500
  });

  await page.goto('/chat');
  await page.getByRole('link', { name: 'Live Chat Conversation' }).click();
  await page.getByRole('textbox', { name: /메시지 입력|Message input/ }).fill('hello ai');
  await page.getByRole('button', { name: /전송|Send/ }).click();

  await expect(page.getByText(/메시지를 보내지 못했습니다|Could not send the message/)).toBeVisible();
  await expect(page.getByTestId('typing-indicator')).toHaveCount(0);
});
