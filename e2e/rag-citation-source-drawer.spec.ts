import { expect, test, type Page, type Route } from '@playwright/test';

type RagVariant = 'grounded' | 'fallback' | 'source-unavailable';

const CONVERSATION_ID = 'conv-rag-e2e';
const ASSISTANT_MESSAGE_ID = 'assistant-msg-rag-e2e';
const RAG_METADATA_ID = '7f5ab245-e989-4a46-9973-6613d9a14511';

async function mockRagConversation(page: Page, variant: RagVariant) {
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api/v1', '');
    const method = request.method();

    if (method === 'GET' && path === `/conversations/${CONVERSATION_ID}`) {
      return route.fulfill({
        status: 200,
        json: {
          id: CONVERSATION_ID,
          scenarioId: 'scenario-rag-e2e',
          title: 'RAG citation E2E',
          messages: [],
          createdAt: '2026-05-07T09:00:00Z',
          updatedAt: '2026-05-07T09:00:00Z',
        },
      });
    }

    if (method === 'GET' && path === `/conversations/${CONVERSATION_ID}/like`) {
      return route.fulfill({ status: 200, json: { liked: false } });
    }

    if (method === 'GET' && path === '/scenarios/scenario-rag-e2e') {
      return route.fulfill({
        status: 200,
        json: {
          id: 'scenario-rag-e2e',
          title: 'Pride and Prejudice discussion',
          description: 'Discussing Darcy and Elizabeth with retrieved evidence.',
          scenarioType: 'CANONICAL',
          bookId: 'novel-rag-e2e',
          characterName: 'Elizabeth Bennet',
        },
      });
    }

    if (method === 'GET' && path === `/conversations/${CONVERSATION_ID}/fork-relationship`) {
      return route.fulfill({
        status: 200,
        json: {
          current: {
            id: CONVERSATION_ID,
            firstMessagePreview: null,
            isRoot: true,
            hasBeenForked: false,
            messageCount: 0,
            likeCount: 0,
            creator: { username: 'dev-bypass' },
          },
          parent: null,
          child: null,
          forkStatus: 'root_can_fork',
        },
      });
    }

    if (method === 'POST' && path === `/conversations/${CONVERSATION_ID}/messages/chat-completion/stream`) {
      return fulfillChatCompletionStream(route, variant);
    }

    if (method === 'POST' && path === `/conversations/${CONVERSATION_ID}/messages/chat-completion`) {
      return fulfillChatCompletion(route, variant);
    }

    if (method === 'GET' && path === `/conversations/${CONVERSATION_ID}/messages/${ASSISTANT_MESSAGE_ID}/rag-sources`) {
      return fulfillRagSources(route, variant);
    }

    return route.fulfill({
      status: 500,
      json: { message: `Unhandled E2E API route: ${method} ${path}` },
    });
  });
}

function fulfillChatCompletion(route: Route, variant: RagVariant) {
  return route.fulfill({
    status: 200,
    json: buildChatCompletionPayload(variant),
  });
}

function fulfillChatCompletionStream(route: Route, variant: RagVariant) {
  const payload = buildChatCompletionPayload(variant);
  const answer = payload.assistantMessage.content;
  const events = [
    { event: 'accepted', data: { status: 'accepted' } },
    { event: 'user_message', data: payload.userMessage },
    { event: 'delta', data: { text: answer } },
    { event: 'completed', data: payload },
  ];

  return route.fulfill({
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
    body: events.map((item) => `event: ${item.event}\ndata: ${JSON.stringify(item.data)}\n\n`).join(''),
  });
}

function buildChatCompletionPayload(variant: RagVariant) {
  const isFallback = variant === 'fallback';
  const citations = isFallback
    ? []
    : [
        {
          final_rank: 1,
          passage_id: 'gutenberg-1342:chunker-v1:chapter-03:chunk-0001:abcdef123456',
          vector_rank: 1,
          bm25_rank: 3,
          rrf_score: 0.0323,
          scores: {
            vector: 0.91,
            bm25: 8.32,
            rrf: 0.0323,
          },
        },
        {
          final_rank: 2,
          passage_id: 'gutenberg-1342:chunker-v1:chapter-34:chunk-0007:fedcba654321',
          vector_rank: 2,
          bm25_rank: 1,
          rrf_score: 0.0318,
          scores: {
            vector: 0.87,
            bm25: 9.14,
            rrf: 0.0318,
          },
        },
      ];

  return {
    userMessage: {
      id: 'user-msg-rag-e2e',
      conversationId: CONVERSATION_ID,
      role: 'user',
      content: 'Why does Darcy explain himself?',
      createdAt: '2026-05-07T09:01:00Z',
    },
    assistantMessage: {
      id: ASSISTANT_MESSAGE_ID,
      conversationId: CONVERSATION_ID,
      role: 'assistant',
      content: isFallback
        ? 'I can answer from general conversation context, but retrieved evidence was unavailable.'
        : 'Darcy explains himself because Elizabeth has challenged both his conduct and his character.',
      createdAt: '2026-05-07T09:01:01Z',
    },
    rag: {
      enabled: true,
      novel_id: 'novel-rag-e2e',
      mode: 'hybrid',
      ranking_policy: 'vector_primary_rrf_fallback',
      grounding_status: isFallback ? 'fallback_ungrounded' : 'grounded',
      fallback_used: isFallback,
      fallback_reason: isFallback ? 'provider_generation_exception' : null,
      passage_count: citations.length,
      citations,
    },
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    tokenUsage: 123,
    ragMetadataId: RAG_METADATA_ID,
    providerElapsedMs: 2437.4,
  };
}

function fulfillRagSources(route: Route, variant: RagVariant) {
  if (variant === 'source-unavailable') {
    return route.fulfill({
      status: 200,
      json: {
        conversationId: CONVERSATION_ID,
        assistantMessageId: ASSISTANT_MESSAGE_ID,
        ragMetadataId: RAG_METADATA_ID,
        novelId: 'novel-rag-e2e',
        groundingStatus: 'grounded',
        fallbackUsed: false,
        fallbackReason: null,
        citations: [
          {
            passageId: 'gutenberg-1342:chunker-v1:chapter-03:chunk-0001:abcdef123456',
            chapter: '3',
            sourceAvailable: false,
            text: null,
            finalRank: 1,
            vectorRank: 1,
            bm25Rank: 3,
          },
        ],
        missingPassageIds: ['gutenberg-1342:chunker-v1:chapter-03:chunk-0001:abcdef123456'],
      },
    });
  }

  return route.fulfill({
    status: 200,
    json: {
      conversationId: CONVERSATION_ID,
      assistantMessageId: ASSISTANT_MESSAGE_ID,
      ragMetadataId: RAG_METADATA_ID,
      novelId: 'novel-rag-e2e',
      groundingStatus: 'grounded',
      fallbackUsed: false,
      fallbackReason: null,
      citations: [
        {
          passageId: 'gutenberg-1342:chunker-v1:chapter-03:chunk-0001:abcdef123456',
          chapter: '3',
          text: 'Elizabeth hears that Darcy has slighted her at the assembly.',
          sourceAvailable: true,
          finalRank: 1,
          vectorRank: 1,
          bm25Rank: 3,
        },
        {
          passageId: 'gutenberg-1342:chunker-v1:chapter-34:chunk-0007:fedcba654321',
          chapter: '34',
          text: 'Darcy explains his conduct in a letter and defends his choices.',
          sourceAvailable: true,
          finalRank: 2,
          vectorRank: 2,
          bm25Rank: 1,
        },
      ],
      missingPassageIds: [],
    },
  });
}

test.describe('MVP-C citation source drawer and grounding UX', () => {
  test('shows citation chips, QA metadata, and source drawer after source lookup', async ({ page }) => {
    await mockRagConversation(page, 'grounded');

    await page.goto(`/conversations/${CONVERSATION_ID}`);
    await page.getByTestId('message-input').fill('Why does Darcy explain himself?');
    await page.getByTestId('send-message-button').click();

    await expect(page.getByTestId('assistant-message')).toContainText(
      'Darcy explains himself because Elizabeth has challenged',
    );
    await expect(page.getByTestId('rag-grounding-status')).toContainText('grounded');
    await expect(page.getByTestId('rag-fallback-status')).toContainText('fallback no');
    await expect(page.getByTestId('rag-metadata-id')).toContainText(`rag ${RAG_METADATA_ID.slice(0, 8)}`);
    await expect(page.getByTestId('rag-provider-latency')).toContainText('provider 2437 ms');
    await expect(page.getByTestId('rag-citation')).toHaveCount(2);
    await expect(page.getByText('Darcy explains his conduct in a letter')).toHaveCount(0);

    await page.getByTestId('rag-citation').nth(1).click();

    const drawer = page.getByTestId('rag-source-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer.getByTestId('rag-source-item').first()).toHaveAttribute('data-selected', 'true');
    await expect(drawer.getByTestId('rag-source-item').first()).toContainText('Darcy explains his conduct in a letter');
    await expect(drawer.getByTestId('rag-source-item').first()).toContainText('Chapter 34');
    await expect(drawer.getByTestId('rag-source-item').first()).toContainText('bm25 #1');
  });

  test('marks retrieval fallback answers as ungrounded and keeps source drawer closed', async ({ page }) => {
    await mockRagConversation(page, 'fallback');

    await page.goto(`/conversations/${CONVERSATION_ID}`);
    await page.getByTestId('message-input').fill('Can you answer when retrieval fails?');
    await page.getByTestId('send-message-button').click();

    await expect(page.getByTestId('assistant-message')).toContainText('retrieved evidence was unavailable');
    await expect(page.getByTestId('rag-grounding-status')).toContainText('fallback ungrounded');
    await expect(page.getByTestId('rag-fallback-status')).toContainText('fallback used');
    await expect(page.getByTestId('rag-fallback-reason')).toContainText('provider_generation_exception');
    await expect(page.getByTestId('rag-no-citations')).toBeVisible();
    await expect(page.getByTestId('rag-source-drawer')).toHaveCount(0);
  });

  test('shows source lookup policy state when cited passage text is unavailable', async ({ page }) => {
    await mockRagConversation(page, 'source-unavailable');

    await page.goto(`/conversations/${CONVERSATION_ID}`);
    await page.getByTestId('message-input').fill('Show me unavailable source policy.');
    await page.getByTestId('send-message-button').click();
    await page.getByTestId('rag-citation').first().click();

    await expect(page.getByTestId('rag-source-drawer')).toBeVisible();
    await expect(page.getByTestId('rag-missing-sources')).toContainText('Missing sources: 1');
    await expect(
      page.getByText('Source text is unavailable under the current source lookup policy.'),
    ).toBeVisible();
  });
});
