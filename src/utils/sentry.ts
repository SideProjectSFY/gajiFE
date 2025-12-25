/**
 * Sentry 에러 추적 및 성능 모니터링 설정
 * Gaji 플랫폼의 실제 사용 환경에 최적화된 설정
 */

import * as Sentry from '@sentry/vue'
import type { App } from 'vue'
import type { Router } from 'vue-router'

/**
 * Sentry 초기화 및 설정
 */
export function initSentry(app: App, router: Router): void {
  const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN
  const ENVIRONMENT = import.meta.env.MODE || 'development'
  const RELEASE = import.meta.env.VITE_APP_VERSION || '1.0.0'

  // 개발 환경이거나 DSN이 없으면 초기화하지 않음
  if (ENVIRONMENT === 'development' || !SENTRY_DSN) {
    console.log('[Sentry] 개발 환경 또는 DSN 미설정으로 초기화 생략')
    return
  }

  Sentry.init({
    app,
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: RELEASE,

    // Vue Router 통합
    integrations: [
      Sentry.browserTracingIntegration({ router }),
      Sentry.replayIntegration({
        // Session Replay: 에러 발생 시 사용자 세션 녹화
        maskAllText: true, // 민감 정보 마스킹
        blockAllMedia: true, // 미디어 블록
      }),
    ],

    // 성능 모니터링
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0, // 프로덕션: 10%, 개발: 100%

    // Session Replay 샘플링
    replaysSessionSampleRate: 0.1, // 전체 세션의 10%
    replaysOnErrorSampleRate: 1.0, // 에러 발생 시 100% 녹화

    // 에러 필터링 및 전처리
    beforeSend(event, hint) {
      // 무시할 에러 패턴
      const ignoredErrors = [
        // 브라우저 확장 프로그램 에러
        /chrome-extension/i,
        /moz-extension/i,
        // ResizeObserver 에러 (무해한 브라우저 버그)
        /ResizeObserver loop limit exceeded/i,
        // 네트워크 취소 (사용자가 의도적으로 중단)
        /Request aborted/i,
        /Network request failed/i,
      ]

      const errorMessage = event.exception?.values?.[0]?.value || ''
      if (ignoredErrors.some((pattern) => pattern.test(errorMessage))) {
        return null // 무시
      }

      // 에러 컨텍스트 추가
      if (hint.originalException instanceof Error) {
        const error = hint.originalException
        event.contexts = {
          ...event.contexts,
          errorDetails: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        }
      }

      return event
    },

    // Breadcrumb 필터링
    beforeBreadcrumb(breadcrumb) {
      // 민감 정보가 포함된 URL 마스킹
      if (breadcrumb.category === 'fetch' || breadcrumb.category === 'xhr') {
        if (breadcrumb.data?.url) {
          breadcrumb.data.url = maskSensitiveUrl(breadcrumb.data.url)
        }
      }

      // 콘솔 로그는 에러만 추적
      if (breadcrumb.category === 'console' && breadcrumb.level !== 'error') {
        return null
      }

      return breadcrumb
    },

    // 추적할 트랜잭션 이름 정규화
    beforeSendTransaction(transaction) {
      // 동적 경로 매개변수 정규화
      if (transaction.transaction) {
        transaction.transaction = normalizeTransactionName(transaction.transaction)
      }
      return transaction
    },
  })

  // 전역 사용자 컨텍스트 설정
  setupGlobalContext()
}

/**
 * 민감 정보가 포함된 URL 마스킹
 */
function maskSensitiveUrl(url: string): string {
  try {
    const urlObj = new URL(url)

    // 쿼리 파라미터에서 토큰, 비밀번호 등 제거
    const sensitiveParams = ['token', 'password', 'secret', 'key', 'auth']
    sensitiveParams.forEach((param) => {
      if (urlObj.searchParams.has(param)) {
        urlObj.searchParams.set(param, '[REDACTED]')
      }
    })

    return urlObj.toString()
  } catch {
    return url
  }
}

/**
 * 트랜잭션 이름 정규화 (동적 ID를 :id로 대체)
 */
function normalizeTransactionName(name: string): string {
  return name
    .replace(/\/books\/[a-zA-Z0-9-]+/g, '/books/:id')
    .replace(/\/scenarios\/[a-zA-Z0-9-]+/g, '/scenarios/:id')
    .replace(/\/conversations\/[a-zA-Z0-9-]+/g, '/conversations/:id')
    .replace(/\/profile\/[a-zA-Z0-9-]+/g, '/profile/:username')
}

/**
 * 전역 컨텍스트 설정
 */
function setupGlobalContext(): void {
  // 디바이스 정보
  Sentry.setContext('device', {
    type: getDeviceType(),
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    pixel_ratio: window.devicePixelRatio,
  })

  // 브라우저 정보
  Sentry.setContext('browser', {
    name: getBrowserName(),
    language: navigator.language,
    online: navigator.onLine,
  })

  // 네트워크 정보
  if ('connection' in navigator) {
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection
    if (connection) {
      Sentry.setContext('network', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
      })
    }
  }
}

/**
 * 디바이스 타입 감지
 */
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const ua = navigator.userAgent
  if (/Mobile|Android|iPhone/i.test(ua)) return 'mobile'
  if (/iPad|Tablet/i.test(ua)) return 'tablet'
  return 'desktop'
}

/**
 * 브라우저 이름 감지
 */
function getBrowserName(): string {
  const ua = navigator.userAgent
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Safari')) return 'Safari'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Edge')) return 'Edge'
  return 'Unknown'
}

/**
 * 사용자 정보 설정
 */
export function setSentryUser(user: { id: string; username?: string; email?: string }): void {
  Sentry.setUser({
    id: user.id,
    username: user.username,
    email: user.email,
  })
}

/**
 * 사용자 정보 제거 (로그아웃 시)
 */
export function clearSentryUser(): void {
  Sentry.setUser(null)
}

/**
 * API 에러 캡처
 */
export function captureApiError(
  error: Error,
  context: {
    endpoint: string
    method: string
    statusCode?: number
    requestData?: unknown
    responseData?: unknown
  }
): void {
  const level = getErrorLevel(context.statusCode)

  Sentry.captureException(error, {
    level,
    tags: {
      error_type: 'api_error',
      endpoint: context.endpoint,
      method: context.method,
      status_code: context.statusCode,
    },
    contexts: {
      api: {
        endpoint: context.endpoint,
        method: context.method,
        status_code: context.statusCode,
      },
    },
    extra: {
      request_data: context.requestData,
      response_data: context.responseData,
    },
  })
}

/**
 * LLM 응답 에러 캡처
 */
export function captureLLMError(
  error: Error,
  context: {
    scenarioId: string
    conversationId?: string
    messageContent?: string
    retryCount?: number
  }
): void {
  Sentry.captureException(error, {
    level: 'error',
    tags: {
      error_type: 'llm_error',
      scenario_id: context.scenarioId,
      retry_count: context.retryCount || 0,
    },
    contexts: {
      llm: {
        scenario_id: context.scenarioId,
        conversation_id: context.conversationId,
        retry_count: context.retryCount,
      },
    },
    extra: {
      message_content: context.messageContent,
    },
  })
}

/**
 * 이미지 로딩 에러 캡처
 */
export function captureImageError(
  imageUrl: string,
  context: {
    entityType: 'book' | 'scenario' | 'user'
    entityId: string
  }
): void {
  Sentry.captureMessage(`Image load failed: ${imageUrl}`, {
    level: 'warning',
    tags: {
      error_type: 'image_error',
      entity_type: context.entityType,
      cdn_provider: imageUrl.includes('cloudfront') ? 'cloudfront' : 's3',
    },
    contexts: {
      image: {
        url: imageUrl,
        entity_type: context.entityType,
        entity_id: context.entityId,
      },
    },
  })
}

/**
 * 성능 트랜잭션 시작
 */
export function startTransaction(
  name: string,
  op: 'pageload' | 'navigation' | 'api.call' | 'chat.send' | 'image.load'
): void {
  Sentry.startSpan(
    {
      name,
      op,
    },
    (span) => span
  )
}

/**
 * 커스텀 Breadcrumb 추가
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info'
): void {
  Sentry.addBreadcrumb({
    category,
    message,
    level,
    data,
    timestamp: Date.now() / 1000,
  })
}

/**
 * HTTP 상태 코드에 따른 Sentry 레벨 결정
 */
function getErrorLevel(statusCode?: number): Sentry.SeverityLevel {
  if (!statusCode) return 'error'

  if (statusCode >= 500) return 'error' // 서버 에러
  if (statusCode === 403) return 'warning' // 권한 없음
  if (statusCode === 401) return 'warning' // 인증 실패
  if (statusCode === 404) return 'info' // 리소스 없음

  return 'error'
}

// NetworkInformation 타입 정의
interface NetworkInformation {
  effectiveType?: string
  downlink?: number
  rtt?: number
}
