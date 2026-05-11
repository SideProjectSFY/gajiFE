
export interface AiChatResponse {
  answer: string;
}

// === Standard/Premium Interfaces ===

export interface ChatHistoryItem {
  role: 'user' | 'model';
  content: string;
}

export interface StandardChatRequest {
  store_name: string;
  query: string;
  history?: ChatHistoryItem[];
}

export interface PremiumChatRequest {
  cache_name: string;
  query: string;
  history?: ChatHistoryItem[];
}

export interface CacheCreateRequest {
  novel_id: string;
  file_uri: string;
  character_persona: string;
  ttl_seconds?: number;
}

export interface FileUploadResponse {
  file_uri: string;
  store_name?: string;
}

export interface ChatResponse {
  response: string;
}

export interface CacheResponse {
  cache_name: string;
  message: string;
}

// === Existing Logic ===

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

// === New Tier Logic ===

export async function chatStandard(payload: StandardChatRequest): Promise<ChatResponse> {
  const response = await fetch('/api/ai/file-search/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Standard chat failed');
  return response.json();
}

export async function chatPremium(payload: PremiumChatRequest): Promise<ChatResponse> {
  const response = await fetch('/api/ai/cache/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Premium chat failed');
  return response.json();
}

export async function createCache(payload: CacheCreateRequest): Promise<CacheResponse> {
  const response = await fetch('/api/ai/cache/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Cache creation failed');
  return response.json();
}

export async function uploadFile(file: File, displayName?: string): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (displayName) {
    formData.append('display_name', displayName);
  }
  const response = await fetch('/api/ai/file-search/upload', {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new Error('Upload failed');
  return response.json();
}
