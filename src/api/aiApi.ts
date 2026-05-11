
export interface AiChatResponse {
  answer: string;
}

export async function postAiChat(prompt: string): Promise<AiChatResponse> {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt })
  });
  if (!response.ok) {
    throw new Error('AI request failed');
  }
  return (await response.json()) as AiChatResponse;
}
