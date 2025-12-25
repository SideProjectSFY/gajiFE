import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
} from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useAnalytics } from '@/composables/useAnalytics'
import { captureApiError, addBreadcrumb } from '@/utils/sentry'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 60000, // 60s for AI operations
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies
})

// Request interceptor - Add JWT token and User ID, track start time
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

    // Track request start time for performance monitoring
    ;(config as InternalAxiosRequestConfig & { metadata?: { startTime: number } }).metadata = {
      startTime: Date.now(),
    }

    // Sentry Breadcrumb: API 요청 시작
    addBreadcrumb('api.request', `${config.method?.toUpperCase()} ${config.url}`, {
      method: config.method,
      url: config.url,
    })

    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle 401, 403, token refresh, and track performance
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Track API call duration
    const config = response.config as InternalAxiosRequestConfig & {
      metadata?: { startTime: number }
    }
    if (config.metadata?.startTime) {
      const duration = Date.now() - config.metadata.startTime
      const { trackApiCallDuration } = useAnalytics()

      trackApiCallDuration({
        endpoint: config.url || 'unknown',
        durationMs: duration,
        statusCode: response.status,
        method: config.method?.toUpperCase() || 'GET',
      })

      // Track LLM response time separately for AI endpoints
      if (config.url?.includes('/ai/') || config.url?.includes('/conversations')) {
        const { trackLLMResponseTime } = useAnalytics()
        trackLLMResponseTime({
          scenarioId: response.data?.scenarioId || 'unknown',
          conversationId: response.data?.conversationId,
          durationMs: duration,
          wasError: false,
        })
      }
    }

    return response
  },
  async (error: AxiosError) => {
    // Track API error duration
    const config = error.config as InternalAxiosRequestConfig & {
      metadata?: { startTime: number }
      _retry?: boolean
    }

    if (config?.metadata?.startTime) {
      const duration = Date.now() - config.metadata.startTime
      const { trackApiCallDuration } = useAnalytics()

      trackApiCallDuration({
        endpoint: config.url || 'unknown',
        durationMs: duration,
        statusCode: error.response?.status || 0,
        method: config.method?.toUpperCase() || 'GET',
      })

      // Track LLM error
      if (config.url?.includes('/ai/') || config.url?.includes('/conversations')) {
        const { trackLLMResponseTime } = useAnalytics()
        trackLLMResponseTime({
          scenarioId: 'error',
          durationMs: duration,
          wasError: true,
        })
      }
    }

    // Sentry: API 에러 캡처 (중요한 엔드포인트만)
    const shouldCaptureError =
      config?.url && shouldCaptureApiError(config.url, error.response?.status)

    if (shouldCaptureError) {
      captureApiError(error, {
        endpoint: config?.url || 'unknown',
        method: config?.method?.toUpperCase() || 'GET',
        statusCode: error.response?.status,
        requestData: config?.data,
        responseData: error.response?.data,
      })
    }

    // Sentry Breadcrumb: API 에러
    addBreadcrumb(
      'api.error',
      `${config?.method?.toUpperCase()} ${config?.url} - ${error.response?.status || 'Network Error'}`,
      {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: config?.url,
      },
      'error'
    )

    const originalRequest = config

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
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

/**
 * API 에러 캡처 여부 결정
 * 중요한 엔드포인트와 심각한 에러만 Sentry에 캡처
 */
function shouldCaptureApiError(url: string, statusCode?: number): boolean {
  // 401 (인증 실패)는 일반적인 경우이므로 캡처하지 않음
  if (statusCode === 401) return false

  // 404는 정보성이므로 중요 엔드포인트만 캡처
  if (statusCode === 404) {
    const criticalEndpoints = ['/books/', '/scenarios/', '/conversations/']
    return criticalEndpoints.some((endpoint) => url.includes(endpoint))
  }

  // 500번대 에러는 항상 캡처
  if (statusCode && statusCode >= 500) return true

  // Timeout 에러 (타임아웃은 statusCode가 없음)
  if (!statusCode) return true

  // 핵심 기능 엔드포인트는 모든 에러 캡처
  const criticalEndpoints = [
    '/conversations', // AI 대화 (핵심)
    '/scenarios', // 시나리오 관리
    '/chat/message', // 메시지 전송
  ]

  return criticalEndpoints.some((endpoint) => url.includes(endpoint))
}

export default api
