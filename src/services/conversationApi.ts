import api from './api'
import type { RagChatMetadata } from './aiApi'
import type { ForkRelationship } from '@/components/chat/ForkNavigationWidget.vue'
import { useAuthStore } from '@/stores/auth'

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
  bookId?: string
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
    if (!data?.current) {
      return null
    }
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
  params: {
    userId?: string
    filter?: string
    search?: string
    genre?: string
    sort?: string
    page?: number
    size?: number
  } = {}
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
  await api.delete(`/conversations/${conversationId}/unlike`)
}

/**
 * Check if conversation is liked
 */
export async function checkConversationLiked(conversationId: string): Promise<boolean> {
  try {
    console.log('[conversationApi] Checking liked status for conversation:', conversationId)
    const response = await api.get<{ isLiked?: boolean; liked?: boolean }>(
      `/conversations/${conversationId}/like`
    )
    console.log('[conversationApi] Like API response:', response.data)

    // Backend returns 'liked' but frontend expects 'isLiked'
    const isLiked = response.data.isLiked ?? response.data.liked ?? false

    console.log('[conversationApi] isLiked value:', isLiked, 'Type:', typeof isLiked)
    return isLiked
  } catch (error: any) {
    console.error('[conversationApi] Failed to check liked status:', error)
    console.error('[conversationApi] Error response:', error.response?.data)
    console.error('[conversationApi] Error status:', error.response?.status)
    return false
  }
}

/**
 * Delete a conversation
 */
export async function deleteConversation(conversationId: string): Promise<void> {
  await api.delete(`/conversations/${conversationId}`)
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
    rag?: RagChatMetadata | null
    ragMetadataId?: string | null
    providerElapsedMs?: number | null
  }
  // 턴 정보
  turnCount?: number
  maxTurns?: number
  rag?: RagChatMetadata | null
  provider?: string
  model?: string
  tokenUsage?: number
  ragMetadataId?: string | null
  providerElapsedMs?: number | null
}

interface SendMessageStreamHandlers {
  onAccepted?: (event: Record<string, unknown>) => void
  onCompleted?: (response: SendMessageResponse) => void
  onError?: (event: Record<string, unknown>) => void
}

interface ParsedSseEvent {
  event: string
  data: string
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
  // 턴 정보
  turnCount?: number
  maxTurns?: number
}

interface ConversationChatCompletionResponse {
  userMessage: MessageResponse
  assistantMessage: MessageResponse
  rag?: RagChatMetadata | null
  provider?: string
  model?: string
  tokenUsage?: number
  ragMetadataId?: string | null
  providerElapsedMs?: number | null
}

export interface RagCitationSource {
  citationId?: string
  passageId: string
  finalRank?: number | null
  vectorRank?: number | null
  bm25Rank?: number | null
  manifestId?: string | null
  chapter?: string | null
  sourceAvailable: boolean
  text?: string | null
  metadata?: Record<string, unknown> | null
}

export interface RagChatSourceResponse {
  conversationId: string
  assistantMessageId: string
  ragMetadataId: string
  novelId?: string | null
  groundingStatus?: string | null
  fallbackUsed?: boolean | null
  fallbackReason?: string | null
  citations: RagCitationSource[]
  missingPassageIds: string[]
}

const RAG_SOURCE_CACHE_LIMIT = 100
const ragSourceCache = new Map<string, Promise<RagChatSourceResponse> | RagChatSourceResponse>()

function ragSourceCacheKey(conversationId: string, assistantMessageId: string): string {
  return `${conversationId}:${assistantMessageId}`
}

function rememberRagSourceResponse(
  key: string,
  value: Promise<RagChatSourceResponse> | RagChatSourceResponse
): void {
  ragSourceCache.delete(key)
  ragSourceCache.set(key, value)
  while (ragSourceCache.size > RAG_SOURCE_CACHE_LIMIT) {
    const oldestKey = ragSourceCache.keys().next().value
    if (!oldestKey) break
    ragSourceCache.delete(oldestKey)
  }
}

export function clearRagSourceCache(): void {
  ragSourceCache.clear()
}

export async function sendMessage(
  conversationId: string,
  content: string
): Promise<SendMessageResponse> {
  try {
    const response = await api.post<ConversationChatCompletionResponse>(
      `/conversations/${conversationId}/messages/chat-completion`,
      { content }
    )
    return mapChatCompletionResponse(response.data)
  } catch (error: any) {
    const status = error?.response?.status
    if (status !== 404 && status !== 405) {
      throw error
    }
    console.warn('RAG chat completion endpoint unavailable, falling back to legacy polling')
  }

  // Submit user message
  const submitResponse = await api.post<MessageResponse>(
    `/conversations/${conversationId}/messages`,
    { content }
  )

  // Poll for AI response with retries (up to 30 seconds)
  const maxRetries = 30 // 30 attempts
  const retryDelay = 1000 // 1 second between attempts

  for (let attempt = 0; attempt < maxRetries; attempt++) {
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
            id: pollResponse.data.messageId || `local-${Date.now()}`,
            conversationId,
            role: 'assistant',
            content: pollResponse.data.content,
            timestamp: new Date().toISOString(),
          },
          // 턴 정보 포함
          turnCount: pollResponse.data.turnCount,
          maxTurns: pollResponse.data.maxTurns,
        }
      } else if (pollResponse.data.status === 'failed') {
        // If AI generation failed, break early
        console.error('AI generation failed:', pollResponse.data.error)
        break
      }

      // Status is 'processing' or 'queued', wait and retry
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay))
      }
    } catch (error) {
      console.warn(`AI poll attempt ${attempt + 1} failed:`, error)
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay))
      }
    }
  }

  // If we exhaust all retries, return placeholder
  console.warn('AI response timed out after', maxRetries, 'attempts')
  return {
    userMessage: {
      id: submitResponse.data.id,
      conversationId: submitResponse.data.conversationId,
      role: 'user',
      content: submitResponse.data.content,
      timestamp: submitResponse.data.createdAt,
    },
    assistantMessage: {
      id: `local-${Date.now()}`,
      conversationId,
      role: 'assistant',
      content: 'AI response timed out. Please try again.',
      timestamp: new Date().toISOString(),
    },
  }
}

export async function sendMessageStream(
  conversationId: string,
  content: string,
  handlers: SendMessageStreamHandlers = {}
): Promise<SendMessageResponse> {
  const authStore = useAuthStore()
  const headers: Record<string, string> = {
    Accept: 'text/event-stream',
    'Content-Type': 'application/json',
  }
  if (authStore.accessToken) {
    headers.Authorization = `Bearer ${authStore.accessToken}`
  }
  if (authStore.user?.id) {
    headers['X-User-Id'] = authStore.user.id
  }

  const streamUrl = buildApiUrl(`/conversations/${conversationId}/messages/chat-completion/stream`)
  const streamRequest = (): Promise<Response> =>
    fetch(streamUrl, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ content }),
    })

  let response = await streamRequest()
  if (response.status === 401 && (await authStore.refreshAccessToken())) {
    if (authStore.accessToken) {
      headers.Authorization = `Bearer ${authStore.accessToken}`
    }
    response = await streamRequest()
  }

  if (response.status === 404 || response.status === 405) {
    return sendMessage(conversationId, content)
  }
  if (!response.ok) {
    throw new Error(`Streaming chat request failed with HTTP ${response.status}`)
  }
  if (!response.body) {
    return sendMessage(conversationId, content)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let completedResponse: SendMessageResponse | null = null

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parsed = drainSseEvents(buffer)
    buffer = parsed.remaining
    for (const event of parsed.events) {
      const payload = parseSseJson(event.data)
      if (event.event === 'accepted') {
        handlers.onAccepted?.(payload)
      } else if (event.event === 'completed') {
        completedResponse = mapChatCompletionResponse(payload as unknown as ConversationChatCompletionResponse)
        handlers.onCompleted?.(completedResponse)
      } else if (event.event === 'error') {
        handlers.onError?.(payload)
        throw new Error(String(payload.message || 'AI chat completion failed'))
      }
    }
  }
  buffer += decoder.decode()

  if (buffer.trim()) {
    for (const event of parseSseBlock(buffer)) {
      const payload = parseSseJson(event.data)
      if (event.event === 'completed') {
        completedResponse = mapChatCompletionResponse(payload as unknown as ConversationChatCompletionResponse)
        handlers.onCompleted?.(completedResponse)
      }
    }
  }

  if (!completedResponse) {
    throw new Error('Streaming chat ended before completion')
  }
  return completedResponse
}

function buildApiUrl(path: string): string {
  const baseUrl = String(import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '')
  return `${baseUrl}${path}`
}

function drainSseEvents(buffer: string): { events: ParsedSseEvent[]; remaining: string } {
  const normalized = buffer.replace(/\r\n/g, '\n')
  const parts = normalized.split('\n\n')
  const remaining = parts.pop() ?? ''
  return {
    events: parts.flatMap(parseSseBlock),
    remaining,
  }
}

function parseSseBlock(block: string): ParsedSseEvent[] {
  if (!block.trim()) return []
  let event = 'message'
  const dataLines: string[] = []
  for (const rawLine of block.split('\n')) {
    const line = rawLine.trimEnd()
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim()
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trimStart())
    }
  }
  if (dataLines.length === 0) return []
  return [{ event, data: dataLines.join('\n') }]
}

function parseSseJson(data: string): Record<string, unknown> {
  try {
    return JSON.parse(data) as Record<string, unknown>
  } catch {
    return { message: data }
  }
}

function mapChatCompletionResponse(
  response: ConversationChatCompletionResponse
): SendMessageResponse {
  return {
    userMessage: {
      id: response.userMessage.id,
      conversationId: response.userMessage.conversationId,
      role: 'user',
      content: response.userMessage.content,
      timestamp: response.userMessage.createdAt || new Date().toISOString(),
    },
    assistantMessage: {
      id: response.assistantMessage.id,
      conversationId: response.assistantMessage.conversationId,
      role: 'assistant',
      content: response.assistantMessage.content,
      timestamp: response.assistantMessage.createdAt || new Date().toISOString(),
      rag: response.rag ?? null,
      ragMetadataId: response.ragMetadataId ?? null,
      providerElapsedMs: response.providerElapsedMs ?? null,
    },
    rag: response.rag ?? null,
    provider: response.provider,
    model: response.model,
    tokenUsage: response.tokenUsage,
    ragMetadataId: response.ragMetadataId ?? null,
    providerElapsedMs: response.providerElapsedMs ?? null,
  }
}

export async function getRagSources(
  conversationId: string,
  assistantMessageId: string,
  options: { forceRefresh?: boolean } = {}
): Promise<RagChatSourceResponse> {
  const cacheKey = ragSourceCacheKey(conversationId, assistantMessageId)
  if (!options.forceRefresh) {
    const cached = ragSourceCache.get(cacheKey)
    if (cached) return cached
  }

  const request = api
    .get<RagChatSourceResponse>(
      `/conversations/${conversationId}/messages/${assistantMessageId}/rag-sources`
    )
    .then((response) => response.data)

  rememberRagSourceResponse(cacheKey, request)
  try {
    const data = await request
    rememberRagSourceResponse(cacheKey, data)
    return data
  } catch (error) {
    ragSourceCache.delete(cacheKey)
    throw error
  }
}
