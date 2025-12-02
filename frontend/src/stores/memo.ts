import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ConversationMemo } from '@/types'
import {
  fetchConversationMemo,
  saveConversationMemo,
  updateConversationMemo,
  deleteConversationMemo,
} from '@/services/conversationApi'

export const useMemoStore = defineStore('memo', () => {
  // State
  const memos = ref<Map<string, ConversationMemo>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchMemo(conversationId: string): Promise<ConversationMemo | null> {
    loading.value = true
    error.value = null

    try {
      const memo = await fetchConversationMemo(conversationId)
      if (memo) {
        memos.value.set(conversationId, memo)
      } else {
        memos.value.delete(conversationId)
      }
      return memo
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch memo'
      return null
    } finally {
      loading.value = false
    }
  }

  async function saveMemo(conversationId: string, content: string): Promise<ConversationMemo> {
    loading.value = true
    error.value = null

    try {
      // Check if memo exists
      const existingMemo = memos.value.get(conversationId)

      let savedMemo: ConversationMemo
      if (existingMemo) {
        // Update existing memo
        savedMemo = await updateConversationMemo(conversationId, content)
      } else {
        // Create new memo
        savedMemo = await saveConversationMemo(conversationId, content)
      }

      memos.value.set(conversationId, savedMemo)
      return savedMemo
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to save memo'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteMemo(conversationId: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await deleteConversationMemo(conversationId)
      memos.value.delete(conversationId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete memo'
      throw err
    } finally {
      loading.value = false
    }
  }

  function getMemo(conversationId: string): ConversationMemo | undefined {
    return memos.value.get(conversationId)
  }

  function hasMemo(conversationId: string): boolean {
    return memos.value.has(conversationId)
  }

  function clearError(): void {
    error.value = null
  }

  return {
    // State
    memos,
    loading,
    error,

    // Actions
    fetchMemo,
    saveMemo,
    deleteMemo,
    getMemo,
    hasMemo,
    clearError,
  }
})
