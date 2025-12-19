import api from './api'
import type { ForkRelationship } from '@/components/chat/ForkNavigationWidget.vue'

export interface ConversationSummary {
  id: string
  scenarioId: string
  title: string
  createdAt: string
  updatedAt: string
  isRoot: boolean
  hasBeenForked: boolean
  parentId?: string
  messageCount?: number
  likeCount?: number
  bookTitle?: string
  bookAuthor?: string
  bookCoverUrl?: string
  scenarioDescription?: string
}

export interface ConversationDetail {
  id: string
  scenarioId: string
  userId: string
  title: string
  isPrivate: boolean
  isRoot: boolean
  hasBeenForked: boolean
  depth: number
  createdAt: string
  updatedAt: string
  messages: Array<{
    id: string
    conversationId: string
    role: 'system' | 'user' | 'assistant'
    content: string
    timestamp: string
  }>
}

export interface ForkRelationshipResponse {
  current: {
    id: string
    first_message_preview: string
    is_root: boolean
    has_been_forked: boolean
    message_count: number
    like_count: number
    creator?: {
      username: string
      avatar_url?: string
    }
  }
  parent: {
    id: string
    first_message_preview: string
    is_root: boolean
    has_been_forked: boolean
    message_count: number
    like_count: number
    creator?: {
      username: string
      avatar_url?: string
    }
  } | null
  child: {
    id: string
    first_message_preview: string
    is_root: boolean
    has_been_forked: boolean
    message_count: number
    like_count: number
    copied_message_count?: number
    creator?: {
      username: string
      avatar_url?: string
    }
  } | null
  fork_status: 'root_can_fork' | 'root_forked' | 'fork'
}

/**
 * Validate UUID format
 */
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Get fork relationship for a conversation
 * Returns parent, current, and child conversation information
 * @throws {Error} If conversationId is invalid or API call fails
 */
export async function getForkRelationship(
  conversationId: string
): Promise<ForkRelationship | null> {
  // Validate conversation ID
  if (!conversationId || typeof conversationId !== 'string') {
    console.error('Invalid conversation ID: must be a non-empty string')
    return null
  }

  if (!isValidUUID(conversationId)) {
    console.error('Invalid conversation ID format: must be a valid UUID')
    return null
  }

  try {
    const response = await api.get<ForkRelationshipResponse>(
      `/conversations/${conversationId}/fork-relationship`
    )

    // Transform snake_case API response to camelCase for Vue component
    const data = response.data
    return {
      current: {
        id: data.current.id,
        firstMessagePreview: data.current.first_message_preview,
        isRoot: data.current.is_root,
        hasBeenForked: data.current.has_been_forked,
        messageCount: data.current.message_count,
        likeCount: data.current.like_count,
        creator: data.current.creator
          ? {
              username: data.current.creator.username,
              avatarUrl: data.current.creator.avatar_url,
            }
          : undefined,
      },
      parent: data.parent
        ? {
            id: data.parent.id,
            firstMessagePreview: data.parent.first_message_preview,
            isRoot: data.parent.is_root,
            hasBeenForked: data.parent.has_been_forked,
            messageCount: data.parent.message_count,
            likeCount: data.parent.like_count,
            creator: data.parent.creator
              ? {
                  username: data.parent.creator.username,
                  avatarUrl: data.parent.creator.avatar_url,
                }
              : undefined,
          }
        : null,
      child: data.child
        ? {
            id: data.child.id,
            firstMessagePreview: data.child.first_message_preview,
            isRoot: data.child.is_root,
            hasBeenForked: data.child.has_been_forked,
            messageCount: data.child.message_count,
            likeCount: data.child.like_count,
            creator: data.child.creator
              ? {
                  username: data.child.creator.username,
                  avatarUrl: data.child.creator.avatar_url,
                }
              : undefined,
          }
        : null,
      forkStatus: data.fork_status,
    }
  } catch (error) {
    console.error('Failed to fetch fork relationship:', error)
    // Return null instead of throwing to allow graceful degradation
    return null
  }
}

/**
 * Get conversation by ID with messages
 * GET /api/v1/conversations/:id
 */
export const getConversations = async (
  params: { userId?: string; filter?: string; page?: number; size?: number } = {}
): Promise<ConversationSummary[]> => {
  const response = await api.get('/conversations', { params })
  return response.data
}

export const getConversation = async (id: string): Promise<ConversationDetail> => {
  const response = await api.get<ConversationDetail>(`/conversations/${id}`)
  return response.data
}

/**
 * Get parent conversation (if exists)
 */
export async function getParentConversation(
  conversationId: string
): Promise<ConversationSummary | null> {
  try {
    const response = await api.get<ConversationSummary>(`/conversations/${conversationId}/parent`)
    return response.data
  } catch (error) {
    // 404 means no parent (root conversation)
    return null
  }
}

/**
 * Get child conversation (if exists)
 */
export async function getChildConversation(
  conversationId: string
): Promise<ConversationSummary | null> {
  try {
    const response = await api.get<ConversationSummary>(`/conversations/${conversationId}/child`)
    return response.data
  } catch (error) {
    // 404 means no child (not forked yet)
    return null
  }
}

/**
 * Memo API Functions (Story 6.9)
 */
import type { ConversationMemo, CreateMemoRequest, UpdateMemoRequest } from '@/types'

/**
 * Fetch memo for a conversation
 */
export async function fetchConversationMemo(
  conversationId: string
): Promise<ConversationMemo | null> {
  try {
    const response = await api.get<ConversationMemo>(`/conversations/${conversationId}/memo`)
    return response.data
  } catch (error) {
    // 404 means no memo exists
    return null
  }
}

/**
 * Save memo for a conversation
 */
export async function saveConversationMemo(
  conversationId: string,
  content: string
): Promise<ConversationMemo> {
  const request: CreateMemoRequest = { content }
  const response = await api.post<ConversationMemo>(
    `/conversations/${conversationId}/memo`,
    request
  )
  return response.data
}

/**
 * Update memo for a conversation
 */
export async function updateConversationMemo(
  conversationId: string,
  content: string
): Promise<ConversationMemo> {
  const request: UpdateMemoRequest = { content }
  const response = await api.put<ConversationMemo>(`/conversations/${conversationId}/memo`, request)
  return response.data
}

/**
 * Delete memo for a conversation
 */
export async function deleteConversationMemo(conversationId: string): Promise<void> {
  await api.delete(`/conversations/${conversationId}/memo`)
}

/**
 * Like a conversation
 */
export async function likeConversation(conversationId: string): Promise<void> {
  await api.post(`/conversations/${conversationId}/like`)
}

/**
 * Unlike a conversation
 */
export async function unlikeConversation(conversationId: string): Promise<void> {
  await api.delete(`/conversations/${conversationId}/like`)
}

/**
 * Fork a conversation
 * POST /api/v1/conversations/:id/fork
 */
export interface ForkConversationResponse {
  id: string
  parentConversationId: string
  copiedMessageCount: number
  messageCount: number
  isRoot: boolean
  depth: number
}

export async function forkConversation(
  conversationId: string,
  description?: string
): Promise<ForkConversationResponse> {
  const response = await api.post<ForkConversationResponse>(
    `/conversations/${conversationId}/fork`,
    { description }
  )
  return response.data
}

/**
 * List user's conversations
 * GET /api/v1/conversations
 */
export async function listConversations(page = 0, size = 20): Promise<ConversationSummary[]> {
  const response = await api.get<ConversationSummary[]>('/conversations', {
    params: { page, size },
  })
  return response.data
}

/**
 * Send a message in a conversation
 * POST /api/v1/conversations/:id/messages
 */
export interface SendMessageRequest {
  content: string
}

export interface SendMessageResponse {
  userMessage: {
    id: string
    conversationId: string
    role: 'user'
    content: string
    timestamp: string
  }
  assistantMessage: {
    id: string
    conversationId: string
    role: 'assistant'
    content: string
    timestamp: string
  }
}

interface MessageResponse {
  id: string
  conversationId: string
  role: string
  content: string
  createdAt: string
}

interface PollResponse {
  status: string
  content?: string
  messageId?: string
  error?: string
}

export async function sendMessage(
  conversationId: string,
  content: string
): Promise<SendMessageResponse> {
  // Submit user message
  const submitResponse = await api.post<MessageResponse>(
    `/conversations/${conversationId}/messages`,
    { content }
  )

  // Poll for AI response (max 30 seconds)
  const maxAttempts = 15 // 15 attempts * 2 seconds = 30 seconds
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000)) // Wait 2 seconds

    try {
      const pollResponse = await api.get<PollResponse>(
        `/conversations/${conversationId}/messages/poll`
      )

      if (pollResponse.data.status === 'completed' && pollResponse.data.content) {
        return {
          userMessage: {
            id: submitResponse.data.id,
            conversationId: submitResponse.data.conversationId,
            role: 'user',
            content: submitResponse.data.content,
            timestamp: submitResponse.data.createdAt,
          },
          assistantMessage: {
            id: pollResponse.data.messageId!,
            conversationId,
            role: 'assistant',
            content: pollResponse.data.content,
            timestamp: new Date().toISOString(),
          },
        }
      }

      if (pollResponse.data.status === 'failed') {
        // Don't catch this - propagate the error immediately
        const errorMessage = pollResponse.data.error || 'AI generation failed'
        console.error('AI generation failed:', errorMessage)
        throw new Error(errorMessage)
      }

      // Continue polling if status is 'processing' or 'queued'
    } catch (error) {
      // If it's a failed status error, propagate it
      if (error instanceof Error && error.message.includes('generation failed')) {
        throw error
      }
      // For network errors, log and continue polling
      console.error('Poll attempt failed:', error)
    }
  }

  // Timeout after max attempts
  throw new Error('AI response timeout after 30 seconds')
}
