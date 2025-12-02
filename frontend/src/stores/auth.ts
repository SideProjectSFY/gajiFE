import { defineStore } from 'pinia'
import api from '@/services/api'

interface User {
  id: string
  username: string
  email: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
}

interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

interface AuthResult {
  success: boolean
  message?: string
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    accessToken: null,
    refreshToken: null,
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.accessToken,
    currentUser: (state): User | null => state.user,
  },

  actions: {
    async register(username: string, email: string, password: string): Promise<AuthResult> {
      try {
        const response = await api.post<AuthResponse>('/auth/register', {
          username,
          email,
          password,
        })

        this.user = response.data.user
        this.accessToken = response.data.accessToken
        this.refreshToken = response.data.refreshToken

        return { success: true }
      } catch (error: any) {
        return {
          success: false,
          message: error.response?.data?.message || 'Registration failed',
        }
      }
    },

    async login(email: string, password: string, rememberMe: boolean = false): Promise<AuthResult> {
      try {
        const response = await api.post<AuthResponse>('/auth/login', {
          email,
          password,
          rememberMe,
        })

        this.user = response.data.user
        this.accessToken = response.data.accessToken
        this.refreshToken = response.data.refreshToken

        return { success: true }
      } catch (error: any) {
        return {
          success: false,
          message: error.response?.data?.message || 'Login failed',
        }
      }
    },

    async refreshAccessToken(): Promise<boolean> {
      if (!this.refreshToken) {
        return false
      }

      try {
        const response = await api.post<{ accessToken: string }>('/auth/refresh', {
          refreshToken: this.refreshToken,
        })

        this.accessToken = response.data.accessToken
        return true
      } catch (error) {
        this.logout()
        return false
      }
    },

    async logout(): Promise<void> {
      try {
        await api.post('/auth/logout', {
          refreshToken: this.refreshToken,
        })
      } catch (error) {
        console.error('Logout failed:', error)
      } finally {
        this.user = null
        this.accessToken = null
        this.refreshToken = null
      }
    },
  },
})
