'use server';

import 'server-only';

interface CompletionResult {
  answer: string;
}

const JSON_CONTENT_TYPE = 'application/json';

function getSpringBaseUrl(): string {
  return process.env.SPRING_API_BASE_URL ?? 'http://localhost:8080';
}

function buildForwardHeaders(request: Request, correlationId: string): Headers {
  const headers = new Headers();
  headers.set('Content-Type', JSON_CONTENT_TYPE);
  headers.set('Accept', JSON_CONTENT_TYPE);
  headers.set('X-Correlation-ID', correlationId);

  const authorization = request.headers.get('authorization');
  if (authorization) {
    headers.set('Authorization', authorization);
  }

  const cookie = request.headers.get('cookie');
  if (cookie) {
    headers.set('Cookie', cookie);
  }

  return headers;
}

async function requestViaSpring(request: Request, prompt: string, correlationId: string): Promise<Response> {
  return fetch(`${getSpringBaseUrl()}/api/v1/ai/chat/completions`, {
    method: 'POST',
    headers: buildForwardHeaders(request, correlationId),
    body: JSON.stringify({ prompt }),
    cache: 'no-store'
  });
}

export async function requestAiCompletion(request: Request, prompt: string): Promise<CompletionResult> {
  const correlationId = request.headers.get('x-correlation-id') ?? crypto.randomUUID();
  const response = await requestViaSpring(request, prompt, correlationId);

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    console.error(`[AI Spring] Request failed: ${response.status} ${response.statusText}`, errorText);
    throw new Error('AI completion failed');
  }

  return (await response.json()) as CompletionResult;
}
