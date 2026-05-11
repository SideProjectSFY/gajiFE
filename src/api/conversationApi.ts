import { requestJson, requestJsonOrNullOn404 } from '@/api/http';
import type {
  Conversation,
  ConversationForkRelationship,
  ConversationMemo,
  ConversationMessage,
  PageResponse,
  RagChatMetadata,
  RagChatSourceResponse
} from '@/domains/journeys/types/core';

export interface ConversationListParams {
  page?: number;
  size?: number;
  filter?: string;
  search?: string;
  genre?: string;
  sort?: string;
}

function toQueryString(params: ConversationListParams): string {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.size !== undefined) searchParams.set('size', String(params.size));
  if (params.filter) searchParams.set('filter', params.filter);
  if (params.search) searchParams.set('search', params.search);
  if (params.genre) searchParams.set('genre', params.genre);
  if (params.sort) searchParams.set('sort', params.sort);

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

export function listConversations(params: ConversationListParams): Promise<PageResponse<Conversation>> {
  return requestJson<PageResponse<Conversation>>(`/api/conversations${toQueryString(params)}`);
}

export function getConversation(conversationId: string): Promise<Conversation> {
  return requestJson<Conversation>(`/api/conversations/${conversationId}`);
}

export function createConversation(payload: Record<string, unknown>): Promise<Conversation> {
  return requestJson<Conversation>('/api/conversations', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function sendConversationMessage(
  conversationId: string,
  payload: Record<string, unknown>
): Promise<ConversationMessage> {
  return requestJson<ConversationMessage>(`/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export interface SendConversationChatCompletionResponse {
  userMessage: ConversationMessage;
  assistantMessage: ConversationMessage;
  rag?: RagChatMetadata | null;
  provider?: string;
  model?: string;
  tokenUsage?: number;
  ragMetadataId?: string | null;
  providerElapsedMs?: number | null;
}

export function sendConversationChatCompletion(
  conversationId: string,
  payload: Record<string, unknown>
): Promise<SendConversationChatCompletionResponse> {
  return requestJson<SendConversationChatCompletionResponse>(
    `/api/conversations/${conversationId}/messages/chat-completion`,
    {
      method: 'POST',
      body: JSON.stringify(payload)
    }
  );
}

export function pollConversationMessage(conversationId: string): Promise<ConversationMessage> {
  return requestJson<ConversationMessage>(`/api/conversations/${conversationId}/messages/poll`);
}

export function forkConversation(conversationId: string): Promise<Conversation> {
  return requestJson<Conversation>(`/api/conversations/${conversationId}/fork`, {
    method: 'POST'
  });
}

export function getParentConversation(conversationId: string): Promise<Conversation | null> {
  return requestJsonOrNullOn404<Conversation>(`/api/conversations/${conversationId}/parent`);
}

export function getChildConversation(conversationId: string): Promise<Conversation | null> {
  return requestJsonOrNullOn404<Conversation>(`/api/conversations/${conversationId}/child`);
}

export function getForkRelationship(conversationId: string): Promise<ConversationForkRelationship> {
  return requestJson<ConversationForkRelationship>(`/api/conversations/${conversationId}/fork-relationship`);
}

export function likeConversation(conversationId: string): Promise<void> {
  return requestJson<void>(`/api/conversations/${conversationId}/like`, {
    method: 'POST'
  });
}

export function unlikeConversation(conversationId: string): Promise<void> {
  return requestJson<void>(`/api/conversations/${conversationId}/unlike`, {
    method: 'DELETE'
  });
}

export function isConversationLiked(conversationId: string): Promise<{ liked: boolean; isLiked?: boolean }> {
  return requestJson<{ liked: boolean; isLiked?: boolean }>(`/api/conversations/${conversationId}/like`);
}

export function getConversationMemo(conversationId: string): Promise<ConversationMemo | null> {
  return requestJsonOrNullOn404<ConversationMemo>(`/api/conversations/${conversationId}/memo`);
}

export function createConversationMemo(conversationId: string, content: string): Promise<ConversationMemo> {
  return requestJson<ConversationMemo>(`/api/conversations/${conversationId}/memo`, {
    method: 'POST',
    body: JSON.stringify({ content })
  });
}

export function updateConversationMemo(conversationId: string, content: string): Promise<ConversationMemo> {
  return requestJson<ConversationMemo>(`/api/conversations/${conversationId}/memo`, {
    method: 'PUT',
    body: JSON.stringify({ content })
  });
}

export function deleteConversationMemo(conversationId: string): Promise<void> {
  return requestJson<void>(`/api/conversations/${conversationId}/memo`, {
    method: 'DELETE'
  });
}

export function getRagSources(
  conversationId: string,
  assistantMessageId: string
): Promise<RagChatSourceResponse> {
  return requestJson<RagChatSourceResponse>(
    `/api/conversations/${conversationId}/messages/${assistantMessageId}/rag-sources`
  );
}
