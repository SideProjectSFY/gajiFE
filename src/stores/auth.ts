import { defineStore } from 'pinia'
import api from '@/services/api'
import { setCookie, getCookie, deleteCookie } from '@/utils/cookies'

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
  userId: string
  username: string
  email: string
  accessToken: string
  refreshToken: string
}

interface AuthResult {
  success: boolean
  message?: string
}

const COOKIE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_ID: 'gaji_user_id',
  USERNAME: 'gaji_username',
  USER_EMAIL: 'gaji_user_email',
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
    // Initialize auth state from cookies
    initializeFromCookies(): void {
      const accessToken = getCookie(COOKIE_KEYS.ACCESS_TOKEN)
      const refreshToken = getCookie(COOKIE_KEYS.REFRESH_TOKEN)
      const userId = getCookie(COOKIE_KEYS.USER_ID)
      const username = getCookie(COOKIE_KEYS.USERNAME)
      const email = getCookie(COOKIE_KEYS.USER_EMAIL)

      if (accessToken && userId && username && email) {
        this.accessToken = accessToken
        this.refreshToken = refreshToken
        this.user = {
          id: userId,
          username: username,
          email: email,
        }
      }
    },

    // Save auth data to cookies
    saveAuthToCookies(data: AuthResponse, rememberMe: boolean = false): void {
      const days = rememberMe ? 7 : 1 // 7 days if remember me, otherwise 1 day

      setCookie(COOKIE_KEYS.ACCESS_TOKEN, data.accessToken, { days })
      setCookie(COOKIE_KEYS.REFRESH_TOKEN, data.refreshToken, { days })
      setCookie(COOKIE_KEYS.USER_ID, data.userId, { days })
      setCookie(COOKIE_KEYS.USERNAME, data.username, { days })
      setCookie(COOKIE_KEYS.USER_EMAIL, data.email, { days })

      this.accessToken = data.accessToken
      this.refreshToken = data.refreshToken
      this.user = {
        id: data.userId,
        username: data.username,
        email: data.email,
      }
    },

    // Clear auth data from cookies
    clearAuthCookies(): void {
      deleteCookie(COOKIE_KEYS.ACCESS_TOKEN)
      deleteCookie(COOKIE_KEYS.REFRESH_TOKEN)
      deleteCookie(COOKIE_KEYS.USER_ID)
      deleteCookie(COOKIE_KEYS.USERNAME)
      deleteCookie(COOKIE_KEYS.USER_EMAIL)

      this.user = null
      this.accessToken = null
      this.refreshToken = null
    },

    async register(username: string, email: string, password: string): Promise<AuthResult> {
      try {
        const response = await api.post<AuthResponse>('/auth/register', {
          username,
          email,
          password,
        })

        this.saveAuthToCookies(response.data, false)

        return { success: true }
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } }
        return {
          success: false,
          message: err.response?.data?.message || 'Registration failed',
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

        this.saveAuthToCookies(response.data, rememberMe)

        return { success: true }
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } }
        return {
          success: false,
          message: err.response?.data?.message || 'Login failed',
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
        setCookie(COOKIE_KEYS.ACCESS_TOKEN, response.data.accessToken, { days: 1 })

        return true
      } catch (error) {
        this.clearAuthCookies()
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
        this.clearAuthCookies()
      }
    },
  },
})
