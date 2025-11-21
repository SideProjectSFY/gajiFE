import { defineStore } from 'pinia'
import { ref } from 'vue'

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
}

export const useConversationStore = defineStore('conversation', () => {
  // State
  const conversations = ref<Conversation[]>([])
  const currentConversation = ref<Conversation | null>(null)
  const streaming = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

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
      lastMessage.content += content
    }
  }

  async function sendMessage(content: string): Promise<void> {
    if (!currentConversation.value) {
      throw new Error('No active conversation')
    }

    streaming.value = true
    error.value = null

    try {
      // Add user message
      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        conversationId: currentConversation.value.id,
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      }
      addMessage(userMessage)

      // This will be implemented with SSE when we integrate with the backend
      // For now, just clear the streaming state
      streaming.value = false
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to send message'
      streaming.value = false
    }
  }

  return {
    conversations,
    currentConversation,
    streaming,
    loading,
    error,
    setConversations,
    setCurrentConversation,
    addMessage,
    updateLastMessage,
    sendMessage,
  }
})
