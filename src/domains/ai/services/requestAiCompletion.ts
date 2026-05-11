'use server';

import 'server-only';

import { issueAiToken } from '@/domains/ai/actions/aiTokenActions';

interface CompletionResult {
  answer: string;
}

const JSON_CONTENT_TYPE = 'application/json';

function getAiBaseUrl(): string {
  // In development (local): http://localhost:8000
  // In production/docker: http://ai-service:8000 (internal) or public Caddy URL
  return process.env.AI_BASE_URL ?? process.env.NEXT_PUBLIC_AI_BASE_URL ?? 'http://localhost:8000';
}

async function requestViaDirectPath(request: Request, prompt: string, correlationId: string): Promise<Response> {
  // 1. Get short-lived access token from Spring Boot for AI service
  const { accessToken } = await issueAiToken(request, correlationId);

  // 2. Call AI Service directly (Pattern C)
  // URL: {AI_BASE_URL}/v1/chat/completions
  return fetch(getAiBaseUrl() + '/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': JSON_CONTENT_TYPE,
      'X-Correlation-ID': correlationId,
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ prompt }),
    cache: 'no-store'
  });
}

export async function requestAiCompletion(request: Request, prompt: string): Promise<CompletionResult> {
  const correlationId = request.headers.get('x-correlation-id') ?? crypto.randomUUID();

  // Always use DIRECT path (via Caddy or Docker Internal to AI Service)
  // No more Legacy Spring Proxy logic.
  const response = await requestViaDirectPath(request, prompt, correlationId);

  if (!response.ok) {
    // Basic error handling for AI service failure
    const errorText = await response.text().catch(() => 'Unknown error');
    console.error(`[AI Direct] Request failed: ${response.status} ${response.statusText}`, errorText);
    throw new Error('AI completion failed');
  }

  return (await response.json()) as CompletionResult;
}
