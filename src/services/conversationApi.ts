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
