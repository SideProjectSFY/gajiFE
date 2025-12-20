import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useConversationStore } from '../conversation'
import api from '@/services/api'

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('Conversation Store - Fork Functionality', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    // Mock localStorage
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('test-user-id')
  })

  describe('forkConversation', () => {
    it('should fork conversation successfully', async () => {
      const store = useConversationStore()
      const mockForkedConversation = {
        id: 'forked-conv-1',
        scenarioId: 'scenario-1',
        title: 'Forked Conversation',
        messages: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        isRoot: false,
        hasBeenForked: false,
        parentId: 'conv-1',
        forkDepth: 1,
      }

      // Setup parent conversation
      store.conversations.push({
        id: 'conv-1',
        scenarioId: 'scenario-1',
        title: 'Parent Conversation',
        messages: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        isRoot: true,
        hasBeenForked: false,
        forkDepth: 0,
      })
      store.setCurrentConversation(store.conversations[0])

      vi.mocked(api.post).mockResolvedValueOnce({ data: mockForkedConversation })

      const result = await store.forkConversation('conv-1', 'Test fork')

      expect(api.post).toHaveBeenCalledWith('/conversations/conv-1/fork', {
        description: 'Test fork',
      })
      expect(result).toEqual(mockForkedConversation)
    })

    it('should optimistically update parent conversation hasBeenForked flag', async () => {
      const store = useConversationStore()
      const mockForkedConversation = {
        id: 'forked-conv-1',
        scenarioId: 'scenario-1',
        title: 'Forked Conversation',
        messages: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        isRoot: false,
        hasBeenForked: false,
        parentId: 'conv-1',
        forkDepth: 1,
      }

      const parentConv = {
        id: 'conv-1',
        scenarioId: 'scenario-1',
        title: 'Parent Conversation',
        messages: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        isRoot: true,
        hasBeenForked: false,
        forkDepth: 0,
      }

      store.conversations.push(parentConv)
      store.setCurrentConversation(parentConv)

      vi.mocked(api.post).mockResolvedValueOnce({ data: mockForkedConversation })

      await store.forkConversation('conv-1')

      // Check that hasBeenForked is set to true
      expect(store.conversations[0].hasBeenForked).toBe(true)
      expect(store.currentConversation?.hasBeenForked).toBe(true)
    })

    it('should add forked conversation to conversations list', async () => {
      const store = useConversationStore()
      const mockForkedConversation = {
        id: 'forked-conv-1',
        scenarioId: 'scenario-1',
        title: 'Forked Conversation',
        messages: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        isRoot: false,
        hasBeenForked: false,
        parentId: 'conv-1',
        forkDepth: 1,
      }

      store.conversations.push({
        id: 'conv-1',
        scenarioId: 'scenario-1',
        title: 'Parent Conversation',
        messages: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        isRoot: true,
        hasBeenForked: false,
        forkDepth: 0,
      })

      vi.mocked(api.post).mockResolvedValueOnce({ data: mockForkedConversation })

      await store.forkConversation('conv-1')

      expect(store.conversations).toHaveLength(2)
      expect(store.conversations[1]).toEqual(mockForkedConversation)
    })

    it('should handle fork error', async () => {
      const store = useConversationStore()

      store.conversations.push({
        id: 'conv-1',
        scenarioId: 'scenario-1',
        title: 'Parent Conversation',
        messages: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        isRoot: true,
        hasBeenForked: false,
        forkDepth: 0,
      })

      const error = new Error('Fork failed')
      vi.mocked(api.post).mockRejectedValueOnce(error)

      await expect(store.forkConversation('conv-1')).rejects.toThrow('Fork failed')
      expect(store.error).toBe('Fork failed')
    })

    it('should set loading state during fork operation', async () => {
      const store = useConversationStore()
      const mockForkedConversation = {
        id: 'forked-conv-1',
        scenarioId: 'scenario-1',
        title: 'Forked Conversation',
        messages: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        isRoot: false,
        hasBeenForked: false,
        parentId: 'conv-1',
        forkDepth: 1,
      }

      store.conversations.push({
        id: 'conv-1',
        scenarioId: 'scenario-1',
        title: 'Parent Conversation',
        messages: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        isRoot: true,
        hasBeenForked: false,
        forkDepth: 0,
      })

      vi.mocked(api.post).mockResolvedValueOnce({ data: mockForkedConversation })

      expect(store.loading).toBe(false)
      const promise = store.forkConversation('conv-1')
      expect(store.loading).toBe(true)
      await promise
      expect(store.loading).toBe(false)
    })
  })
})
