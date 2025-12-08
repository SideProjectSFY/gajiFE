import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface User {
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl?: string
  createdAt: string
}

export const useUserStore = defineStore('user', () => {
  // State
  const currentUser = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  function setUser(user: User): void {
    currentUser.value = user
  }

  function clearUser(): void {
    currentUser.value = null
  }

  async function fetchCurrentUser(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      // This will be implemented when we integrate with the backend
      // For now, just clear the loading state
      loading.value = false
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch user'
      loading.value = false
    }
  }

  return {
    currentUser,
    loading,
    error,
    setUser,
    clearUser,
    fetchCurrentUser,
  }
})
