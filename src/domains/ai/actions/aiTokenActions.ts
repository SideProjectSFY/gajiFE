'use server';

import 'server-only';

const JSON_CONTENT_TYPE = 'application/json';

function getSpringBaseUrl(): string {
  return process.env.SPRING_API_BASE_URL ?? 'http://localhost:8080';
}

function buildForwardHeaders(request: Request, correlationId: string): Headers {
  const headers = new Headers();
  headers.set('content-type', JSON_CONTENT_TYPE);
  headers.set('accept', JSON_CONTENT_TYPE);
  headers.set('x-correlation-id', correlationId);

  const authorization = request.headers.get('authorization');
  if (authorization) {
    headers.set('authorization', authorization);
  }

  const cookie = request.headers.get('cookie');
  if (cookie) {
    headers.set('cookie', cookie);
  }

  return headers;
}

export async function issueAiToken(
  request: Request,
  correlationId: string,
  model?: string
): Promise<{ accessToken: string }> {
  const response = await fetch(`${getSpringBaseUrl()}/api/v1/ai-token`, {
    method: 'POST',
    headers: buildForwardHeaders(request, correlationId),
    body: JSON.stringify({ model }),
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('Failed to issue AI access token');
  }

  return (await response.json()) as { accessToken: string };
}
