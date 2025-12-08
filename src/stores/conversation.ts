import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface Conversation {
  id: string
  scenarioId: string
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
  isRoot: boolean
  hasBeenForked: boolean
  parentId?: string
  forkDepth: number
}

export type PollingStatus = 'idle' | 'polling' | 'error'

export interface PollResponse {
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'not_found'
  content?: string
  error?: string
  messageId?: string
}

export const useConversationStore = defineStore('conversation', () => {
  // State
  const conversations = ref<Conversation[]>([])
  const currentConversation = ref<Conversation | null>(null)
  const pollingStatus = ref<PollingStatus>('idle')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pollingRetries = ref(0)
  const maxRetries = 3

  // API base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

  // Actions
  function setConversations(newConversations: Conversation[]): void {
    conversations.value = newConversations
  }

  function setCurrentConversation(conversation: Conversation | null): void {
    currentConversation.value = conversation
  }

  function addMessage(message: Message): void {
    if (currentConversation.value) {
      currentConversation.value.messages.push(message)
    }
  }

  function updateLastMessage(content: string): void {
    if (currentConversation.value && currentConversation.value.messages.length > 0) {
      const lastMessage =
        currentConversation.value.messages[currentConversation.value.messages.length - 1]
      lastMessage.content = content
    }
  }

  function setPollingStatus(status: PollingStatus): void {
    pollingStatus.value = status
  }

  function setError(errorMessage: string | null): void {
    error.value = errorMessage
  }

  async function sendMessage(content: string): Promise<void> {
    if (!currentConversation.value) {
      throw new Error('No active conversation')
    }

    pollingStatus.value = 'polling'
    error.value = null

    try {
      // Add user message optimistically
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        conversationId: currentConversation.value.id,
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      }
      addMessage(userMessage)

      // Get user ID from localStorage or auth store
      const userId = localStorage.getItem('userId') || '00000000-0000-0000-0000-000000000000'

      // Submit message to backend
      await axios.post(
        `${API_BASE_URL}/api/conversations/${currentConversation.value.id}/messages`,
        {
          content,
          role: 'user',
        },
        {
          headers: {
            'X-User-Id': userId,
          },
        }
      )

      // Start polling for AI response
      await startPolling()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to send message'
      pollingStatus.value = 'error'
      throw err
    }
  }

  async function startPolling(): Promise<void> {
    if (!currentConversation.value) return

    pollingRetries.value = 0

    // Add a temporary AI message placeholder
    const aiMessagePlaceholder: Message = {
      id: `ai-temp-${Date.now()}`,
      conversationId: currentConversation.value.id,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    }
    addMessage(aiMessagePlaceholder)

    await pollForResponse()
  }

  async function pollForResponse(): Promise<void> {
    if (!currentConversation.value) return

    try {
      const response = await axios.get<PollResponse>(
        `${API_BASE_URL}/api/conversations/${currentConversation.value.id}/messages/poll`
      )

      const { status, content, error: apiError, messageId } = response.data

      if (status === 'completed') {
        // Update AI message with final content
        if (content && currentConversation.value.messages.length > 0) {
          const lastMessage =
            currentConversation.value.messages[currentConversation.value.messages.length - 1]
          if (lastMessage.role === 'assistant') {
            lastMessage.content = content
            if (messageId) {
              lastMessage.id = messageId
            }
          }
        }
        pollingStatus.value = 'idle'
        pollingRetries.value = 0
      } else if (status === 'failed') {
        // Show error in AI message
        if (currentConversation.value.messages.length > 0) {
          const lastMessage =
            currentConversation.value.messages[currentConversation.value.messages.length - 1]
          if (lastMessage.role === 'assistant') {
            lastMessage.content = `오류: ${apiError || '알 수 없는 오류가 발생했습니다.'}`
          }
        }
        pollingStatus.value = 'error'
        error.value = apiError || 'AI generation failed'
      } else if (status === 'processing' || status === 'queued') {
        // Update partial content if available
        if (content && currentConversation.value.messages.length > 0) {
          const lastMessage =
            currentConversation.value.messages[currentConversation.value.messages.length - 1]
          if (lastMessage.role === 'assistant') {
            lastMessage.content = content
          }
        }

        // Continue polling after 1 second
        setTimeout(() => pollForResponse(), 1000)
      } else {
        // Unknown status, retry
        throw new Error(`Unknown status: ${status}`)
      }
    } catch (err) {
      pollingRetries.value++

      if (pollingRetries.value < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const backoffDelay = Math.pow(2, pollingRetries.value - 1) * 1000
        setTimeout(() => pollForResponse(), backoffDelay)
      } else {
        // Max retries reached
        error.value = '네트워크 오류가 발생했습니다. 다시 시도해주세요.'
        pollingStatus.value = 'error'

        // Update AI message with error
        if (currentConversation.value && currentConversation.value.messages.length > 0) {
          const lastMessage =
            currentConversation.value.messages[currentConversation.value.messages.length - 1]
          if (lastMessage.role === 'assistant') {
            lastMessage.content = '연결이 끊어졌습니다. 다시 시도하려면 클릭하세요.'
          }
        }
      }
    }
  }

  function retryPolling(): void {
    pollingRetries.value = 0
    error.value = null
    pollingStatus.value = 'polling'
    pollForResponse()
  }

  async function forkConversation(
    conversationId: string,
    description?: string
  ): Promise<Conversation> {
    try {
      loading.value = true
      error.value = null

      const userId = localStorage.getItem('userId') || '00000000-0000-0000-0000-000000000000'

      const response = await axios.post<Conversation>(
        `${API_BASE_URL}/api/v1/conversations/${conversationId}/fork`,
        { description },
        {
          headers: {
            'X-User-Id': userId,
          },
        }
      )

      // Optimistically update parent conversation
      const parentConv = conversations.value.find((c) => c.id === conversationId)
      if (parentConv) {
        parentConv.hasBeenForked = true
      }
      if (currentConversation.value?.id === conversationId) {
        currentConversation.value.hasBeenForked = true
      }

      // Add new forked conversation to list
      conversations.value.push(response.data)

      return response.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fork conversation'
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    conversations,
    currentConversation,
    pollingStatus,
    loading,
    error,
    setConversations,
    setCurrentConversation,
    addMessage,
    updateLastMessage,
    setPollingStatus,
    setError,
    sendMessage,
    retryPolling,
    forkConversation,
  }
})
