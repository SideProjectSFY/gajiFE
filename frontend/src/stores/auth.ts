import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // State
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))

  // Getters
  const isAuthenticated = computed(() => !!accessToken.value)

  // Actions
  function setTokens(access: string, refresh: string): void {
    accessToken.value = access
    refreshToken.value = refresh
    localStorage.setItem('accessToken', access)
    localStorage.setItem('refreshToken', refresh)
  }

  function clearTokens(): void {
    accessToken.value = null
    refreshToken.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  async function refreshAccessToken(): Promise<boolean> {
    if (!refreshToken.value) {
      return false
    }

    try {
      // This will be implemented when we integrate with the backend
      // For now, just return false
      return false
    } catch (error) {
      clearTokens()
      return false
    }
  }

  function logout(): void {
    clearTokens()
  }

  return {
    accessToken,
    refreshToken,
    isAuthenticated,
    setTokens,
    clearTokens,
    refreshAccessToken,
    logout,
  }
})
