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

// Response interceptor - Handle 401 and token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
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

    return Promise.reject(error)
  }
)

export default api
