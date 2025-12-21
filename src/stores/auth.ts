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
    isAuthenticated: (state): boolean => !!state.user,
    currentUser: (state): User | null => state.user,
  },

  actions: {
    // Initialize auth state from cookies
    initializeFromCookies(): void {
      // We don't read tokens from cookies because they are HttpOnly
      // We only read user info to restore the session state
      const userId = getCookie(COOKIE_KEYS.USER_ID)
      const username = getCookie(COOKIE_KEYS.USERNAME)
      const email = getCookie(COOKIE_KEYS.USER_EMAIL)

      if (userId && username && email) {
        this.user = {
          id: userId,
          username: username,
          email: email,
        }
        // We don't have the tokens in memory after refresh, but cookies are set
      }
    },

    // Save auth data to cookies
    saveAuthToCookies(data: AuthResponse, rememberMe: boolean = false): void {
      const days = rememberMe ? 7 : 1 // 7 days if remember me, otherwise 1 day

      // We don't set token cookies here because backend sets them as HttpOnly
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
      // We can't clear HttpOnly cookies from JS, but we can clear our user cookies
      // To clear HttpOnly cookies, we need to call the logout endpoint
      deleteCookie(COOKIE_KEYS.USER_ID)
      deleteCookie(COOKIE_KEYS.USERNAME)
      deleteCookie(COOKIE_KEYS.USER_EMAIL)
      // Also try to delete token cookies just in case they were set by JS previously
      deleteCookie(COOKIE_KEYS.ACCESS_TOKEN)
      deleteCookie(COOKIE_KEYS.REFRESH_TOKEN)

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
      // We rely on HttpOnly cookies for refresh token
      try {
        const response = await api.post<AuthResponse>('/auth/refresh')

        this.saveAuthToCookies(response.data, true)

        return true
      } catch (error) {
        this.clearAuthCookies()
        return false
      }
    },

    async logout(): Promise<void> {
      try {
        await api.post('/auth/logout')
      } catch (error) {
        console.error('Logout failed:', error)
      } finally {
        this.clearAuthCookies()
      }
    },
  },
})
