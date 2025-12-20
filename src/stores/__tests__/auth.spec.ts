import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'
import api from '@/services/api'

// Mock axios
vi.mock('@/services/api', () => ({
  default: {
    post: vi.fn(),
  },
}))

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with null user and tokens', () => {
      const store = useAuthStore()

      expect(store.user).toBeNull()
      expect(store.accessToken).toBeNull()
      expect(store.refreshToken).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('Register', () => {
    it('should register user successfully', async () => {
      const mockResponse = {
        data: {
          userId: '1',
          username: 'testuser',
          email: 'test@test.com',
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      }

      vi.mocked(api.post).mockResolvedValueOnce(mockResponse)

      const store = useAuthStore()
      const result = await store.register('testuser', 'test@test.com', 'Password123')

      expect(result.success).toBe(true)
      expect(store.user).toEqual({
        id: mockResponse.data.userId,
        username: mockResponse.data.username,
        email: mockResponse.data.email,
      })
      expect(store.accessToken).toBe('access-token')
      expect(store.refreshToken).toBe('refresh-token')
      expect(store.isAuthenticated).toBe(true)
    })

    it('should handle registration failure', async () => {
      vi.mocked(api.post).mockRejectedValueOnce({
        response: {
          data: {
            message: 'Email already exists',
          },
        },
      })

      const store = useAuthStore()
      const result = await store.register('testuser', 'test@test.com', 'Password123')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Email already exists')
      expect(store.isAuthenticated).toBe(false)
    })

    it('should handle network error during registration', async () => {
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Network error'))

      const store = useAuthStore()
      const result = await store.register('testuser', 'test@test.com', 'Password123')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Registration failed')
    })
  })

  describe('Login', () => {
    it('should login user successfully', async () => {
      const mockResponse = {
        data: {
          userId: '1',
          username: 'testuser',
          email: 'test@test.com',
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      }

      vi.mocked(api.post).mockResolvedValueOnce(mockResponse)

      const store = useAuthStore()
      const result = await store.login('test@test.com', 'Password123')

      expect(result.success).toBe(true)
      expect(store.user).toEqual({
        id: mockResponse.data.userId,
        username: mockResponse.data.username,
        email: mockResponse.data.email,
      })
      expect(store.accessToken).toBe('access-token')
      expect(store.refreshToken).toBe('refresh-token')
      expect(store.isAuthenticated).toBe(true)
    })

    it('should login with rememberMe flag', async () => {
      const mockResponse = {
        data: {
          userId: '1',
          username: 'testuser',
          email: 'test@test.com',
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      }

      vi.mocked(api.post).mockResolvedValueOnce(mockResponse)

      const store = useAuthStore()
      await store.login('test@test.com', 'Password123', true)

      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@test.com',
        password: 'Password123',
        rememberMe: true,
      })
    })

    it('should handle login failure', async () => {
      vi.mocked(api.post).mockRejectedValueOnce({
        response: {
          data: {
            message: 'Invalid credentials',
          },
        },
      })

      const store = useAuthStore()
      const result = await store.login('test@test.com', 'WrongPassword')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Invalid credentials')
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('Refresh Access Token', () => {
    it('should refresh access token successfully', async () => {
      const store = useAuthStore()
      // store.refreshToken = 'old-refresh-token' // No longer needed as we use cookies

      const mockResponse = {
        data: {
          userId: '1',
          username: 'testuser',
          email: 'test@test.com',
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      }

      vi.mocked(api.post).mockResolvedValueOnce(mockResponse)

      const result = await store.refreshAccessToken()

      expect(result).toBe(true)
      expect(store.accessToken).toBe('new-access-token')
      expect(api.post).toHaveBeenCalledWith('/auth/refresh')
    })

    // Removed "should return false if no refresh token" because we rely on cookies now

    it('should logout on refresh failure', async () => {
      const store = useAuthStore()
      store.user = { id: '1', username: 'testuser', email: 'test@test.com' }
      store.accessToken = 'access-token'
      store.refreshToken = 'refresh-token'

      vi.mocked(api.post).mockRejectedValueOnce(new Error('Refresh failed'))

      const result = await store.refreshAccessToken()

      expect(result).toBe(false)
      expect(store.user).toBeNull()
      expect(store.accessToken).toBeNull()
      expect(store.refreshToken).toBeNull()
    })
  })

  describe('Logout', () => {
    it('should logout successfully', async () => {
      const store = useAuthStore()
      store.user = { id: '1', username: 'testuser', email: 'test@test.com' }
      store.accessToken = 'access-token'
      store.refreshToken = 'refresh-token'

      vi.mocked(api.post).mockResolvedValueOnce({})

      await store.logout()

      expect(store.user).toBeNull()
      expect(store.accessToken).toBeNull()
      expect(store.refreshToken).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(api.post).toHaveBeenCalledWith('/auth/logout')
    })

    it('should clear tokens even if logout API fails', async () => {
      const store = useAuthStore()
      store.user = { id: '1', username: 'testuser', email: 'test@test.com' }
      store.accessToken = 'access-token'
      store.refreshToken = 'refresh-token'

      vi.mocked(api.post).mockRejectedValueOnce(new Error('Logout failed'))

      await store.logout()

      expect(store.user).toBeNull()
      expect(store.accessToken).toBeNull()
      expect(store.refreshToken).toBeNull()
    })
  })

  describe('Getters', () => {
    it('should compute isAuthenticated correctly', () => {
      const store = useAuthStore()

      expect(store.isAuthenticated).toBe(false)

      store.user = { id: '1', username: 'testuser', email: 'test@test.com' }
      expect(store.isAuthenticated).toBe(true)

      store.user = null
      expect(store.isAuthenticated).toBe(false)
    })

    it('should return current user', () => {
      const store = useAuthStore()
      const user = { id: '1', username: 'testuser', email: 'test@test.com' }

      expect(store.currentUser).toBeNull()

      store.user = user
      expect(store.currentUser).toEqual(user)
    })
  })
})
