import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
} from 'axios'
import { useAuthStore } from '@/stores/auth'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 60000, // 60s for AI operations
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies
})

// Request interceptor - Add JWT token and User ID
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore()
    if (authStore.accessToken) {
      config.headers.Authorization = `Bearer ${authStore.accessToken}`
    }
    // Add X-User-Id header if user is authenticated
    if (authStore.user?.id) {
      config.headers['X-User-Id'] = authStore.user.id
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle 401, 403 and token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If the error comes from the login endpoint itself, do not attempt refresh
      if (originalRequest.url?.includes('/auth/login')) {
        return Promise.reject(error)
      }

      originalRequest._retry = true

      const authStore = useAuthStore()
      const refreshed = await authStore.refreshAccessToken()

      if (refreshed && originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${authStore.accessToken}`
        // Re-add X-User-Id header after refresh
        if (authStore.user?.id) {
          originalRequest.headers['X-User-Id'] = authStore.user.id
        }
        return api(originalRequest)
      } else {
        // Refresh failed, logout and redirect
        authStore.logout()

        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }

    // Handle 403 errors (forbidden) - clear auth and redirect to login
    if (error.response?.status === 403) {
      const authStore = useAuthStore()
      console.log('[API] 403 Forbidden - clearing auth and redirecting to login')
      authStore.logout()

      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    // Handle 404 errors (not found) - redirect to 404 page
    if (error.response?.status === 404) {
      console.log('[API] 404 Not Found - redirecting to 404 page')
      // Use dynamic import to avoid circular dependency
      const router = (await import('@/router')).default
      if (router.currentRoute.value.name !== 'NotFound') {
        router.push('/404')
      }
    }

    return Promise.reject(error)
  }
)

export default api
