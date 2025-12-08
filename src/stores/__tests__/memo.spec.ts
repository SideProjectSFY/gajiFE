import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMemoStore } from '../memo'
import * as conversationApi from '@/services/conversationApi'
import type { ConversationMemo } from '@/types'

vi.mock('@/services/conversationApi')

describe('Memo Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('fetchMemo', () => {
    it('fetches memo successfully', async () => {
      const mockMemo: ConversationMemo = {
        id: 'memo-1',
        conversationId: 'conv-1',
        userId: 'user-1',
        content: 'Test memo',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      vi.mocked(conversationApi.fetchConversationMemo).mockResolvedValue(mockMemo)

      const store = useMemoStore()
      const result = await store.fetchMemo('conv-1')

      expect(result).toEqual(mockMemo)
      expect(store.memos.get('conv-1')).toEqual(mockMemo)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('handles non-existent memo', async () => {
      vi.mocked(conversationApi.fetchConversationMemo).mockResolvedValue(null)

      const store = useMemoStore()
      const result = await store.fetchMemo('conv-1')

      expect(result).toBeNull()
      expect(store.memos.has('conv-1')).toBe(false)
      expect(store.loading).toBe(false)
    })

    it('handles fetch error', async () => {
      vi.mocked(conversationApi.fetchConversationMemo).mockRejectedValue(new Error('Network error'))

      const store = useMemoStore()
      const result = await store.fetchMemo('conv-1')

      expect(result).toBeNull()
      expect(store.error).toBe('Network error')
      expect(store.loading).toBe(false)
    })
  })

  describe('saveMemo', () => {
    it('creates new memo', async () => {
      const mockMemo: ConversationMemo = {
        id: 'memo-1',
        conversationId: 'conv-1',
        userId: 'user-1',
        content: 'New memo',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      vi.mocked(conversationApi.saveConversationMemo).mockResolvedValue(mockMemo)

      const store = useMemoStore()
      const result = await store.saveMemo('conv-1', 'New memo')

      expect(result).toEqual(mockMemo)
      expect(store.memos.get('conv-1')).toEqual(mockMemo)
      expect(conversationApi.saveConversationMemo).toHaveBeenCalledWith('conv-1', 'New memo')
    })

    it('updates existing memo', async () => {
      const existingMemo: ConversationMemo = {
        id: 'memo-1',
        conversationId: 'conv-1',
        userId: 'user-1',
        content: 'Old content',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      const updatedMemo: ConversationMemo = {
        ...existingMemo,
        content: 'Updated content',
        updatedAt: '2024-01-02T00:00:00Z',
      }

      vi.mocked(conversationApi.updateConversationMemo).mockResolvedValue(updatedMemo)

      const store = useMemoStore()
      store.memos.set('conv-1', existingMemo)

      const result = await store.saveMemo('conv-1', 'Updated content')

      expect(result).toEqual(updatedMemo)
      expect(conversationApi.updateConversationMemo).toHaveBeenCalledWith(
        'conv-1',
        'Updated content'
      )
    })

    it('handles save error', async () => {
      vi.mocked(conversationApi.saveConversationMemo).mockRejectedValue(new Error('Save failed'))

      const store = useMemoStore()

      await expect(store.saveMemo('conv-1', 'Content')).rejects.toThrow()
      expect(store.error).toBe('Save failed')
      expect(store.loading).toBe(false)
    })
  })

  describe('deleteMemo', () => {
    it('deletes memo successfully', async () => {
      const existingMemo: ConversationMemo = {
        id: 'memo-1',
        conversationId: 'conv-1',
        userId: 'user-1',
        content: 'To be deleted',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      vi.mocked(conversationApi.deleteConversationMemo).mockResolvedValue()

      const store = useMemoStore()
      store.memos.set('conv-1', existingMemo)

      await store.deleteMemo('conv-1')

      expect(store.memos.has('conv-1')).toBe(false)
      expect(conversationApi.deleteConversationMemo).toHaveBeenCalledWith('conv-1')
      expect(store.loading).toBe(false)
    })

    it('handles delete error', async () => {
      vi.mocked(conversationApi.deleteConversationMemo).mockRejectedValue(
        new Error('Delete failed')
      )

      const store = useMemoStore()

      await expect(store.deleteMemo('conv-1')).rejects.toThrow()
      expect(store.error).toBe('Delete failed')
      expect(store.loading).toBe(false)
    })
  })

  describe('getMemo', () => {
    it('returns memo if exists', () => {
      const memo: ConversationMemo = {
        id: 'memo-1',
        conversationId: 'conv-1',
        userId: 'user-1',
        content: 'Test',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      const store = useMemoStore()
      store.memos.set('conv-1', memo)

      expect(store.getMemo('conv-1')).toEqual(memo)
    })

    it('returns undefined if not exists', () => {
      const store = useMemoStore()
      expect(store.getMemo('conv-1')).toBeUndefined()
    })
  })

  describe('hasMemo', () => {
    it('returns true if memo exists', () => {
      const memo: ConversationMemo = {
        id: 'memo-1',
        conversationId: 'conv-1',
        userId: 'user-1',
        content: 'Test',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      const store = useMemoStore()
      store.memos.set('conv-1', memo)

      expect(store.hasMemo('conv-1')).toBe(true)
    })

    it('returns false if memo does not exist', () => {
      const store = useMemoStore()
      expect(store.hasMemo('conv-1')).toBe(false)
    })
  })

  describe('clearError', () => {
    it('clears error', () => {
      const store = useMemoStore()
      store.error = 'Some error'

      store.clearError()

      expect(store.error).toBeNull()
    })
  })
})
