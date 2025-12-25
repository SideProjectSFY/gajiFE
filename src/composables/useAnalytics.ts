/* eslint-disable @typescript-eslint/explicit-function-return-type */
/**
 * Google Analytics 4 추적을 위한 Composable
 *
 * 사용 예시:
 * const { trackScenarioCreated, trackConversationStarted } = useAnalytics()
 * trackScenarioCreated({ bookId: '123', bookTitle: 'Harry Potter', scenarioType: 'character' })
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

// 환경 변수에서 GA4 Measurement ID 가져오기
const GA4_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID || 'G-XXXXXXXXXX'

export interface ScenarioCreatedParams {
  bookId: string
  bookTitle: string
  scenarioType: 'character' | 'event' | 'setting' | 'mixed'
  hasForkParent: boolean
}

export interface ConversationParams {
  scenarioId: string
  isFork: boolean
}

export interface ForkParams {
  originalId: string
  forkDepth?: number
}

export interface SearchParams {
  searchTerm: string
  searchType: 'book' | 'scenario' | 'integrated'
  resultsCount?: number
}

export interface SocialActionParams {
  contentType: 'conversation' | 'scenario'
  contentId: string
  method?: string
}

// ============================================
// 콘텐츠 탐색 이벤트 인터페이스
// ============================================

export interface BookFilterParams {
  filterType: 'genre' | 'author' | 'language' | 'status'
  filterValue: string
}

export interface BookSortParams {
  sortBy: 'latest' | 'popular' | 'title' | 'author'
}

export interface BookDetailParams {
  bookId: string
  bookTitle: string
  author?: string
  genre?: string
}

export interface ScenarioFilterParams {
  filterType: 'book' | 'creator' | 'status'
  filterValue: string
}

// ============================================
// AI 대화 세션 이벤트 인터페이스
// ============================================

export interface ChatSessionStartParams {
  scenarioId: string
  scenarioTitle?: string
  conversationId?: string
  isFork: boolean
}

export interface ChatSessionEndParams {
  conversationId: string
  scenarioId: string
  duration: number // milliseconds
  messageCount: number
  wasCompleted: boolean // 정상 종료 vs 이탈
}

export interface ChatMessageParams {
  conversationId: string
  scenarioId: string
  messageLength: number
  messageNumber: number // 대화 내 순서
}

export interface ChatResponseParams {
  conversationId: string
  responseTimeMs: number
  wasError: boolean
}

export interface ChatRetryParams {
  conversationId: string
  messageId?: string
  retryCount: number
}

export interface ChatSaveParams {
  conversationId: string
  messageCount: number
}

// ============================================
// 이미지 인터랙션 인터페이스
// ============================================

export interface ImageViewParams {
  imageType: 'book_cover' | 'scenario_thumbnail' | 'user_avatar'
  entityId: string
  imageUrl?: string
}

export interface ImageLoadErrorParams {
  imageUrl: string
  errorType: 'not_found' | 'network_error' | 'cloudfront_error'
  entityType: 'book' | 'scenario' | 'user'
  entityId?: string
}

export interface ImageLoadSlowParams {
  imageUrl: string
  loadTimeMs: number
  imageType: 'book_cover' | 'scenario_thumbnail' | 'user_avatar'
}

// ============================================
// 성능 메트릭 인터페이스
// ============================================

export interface WebVitalsParams {
  metricName: 'LCP' | 'INP' | 'CLS'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  page: string
}

export interface ApiCallParams {
  endpoint: string
  durationMs: number
  statusCode: number
  method: string
}

export interface LLMResponseParams {
  scenarioId: string
  conversationId?: string
  durationMs: number
  wasError: boolean
}

// ============================================
// 전환 이벤트 인터페이스
// ============================================

export interface FirstChatCompletionParams {
  conversationId: string
  scenarioId: string
  messageCount: number
  duration: number
}

export interface EngagementParams {
  sessionDuration: number // minutes
  pagesVisited: number
  actionsPerformed: string[] // ['book_viewed', 'scenario_created', etc.]
}

// ============================================
// 사용자 속성 인터페이스
// ============================================

export interface UserProperties {
  user_type: 'new' | 'returning'
  favorite_genre?: string
  engagement_level: 'low' | 'medium' | 'high'
  device_type: 'mobile' | 'tablet' | 'desktop'
  total_scenarios_created?: number
  total_conversations?: number
}

export const useAnalytics = () => {
  /**
   * 기본 이벤트 추적 함수
   */
  const trackEvent = (eventName: string, params?: Record<string, unknown>): void => {
    if (typeof window !== 'undefined' && typeof window.gtag !== 'undefined') {
      window.gtag('event', eventName, params)
      console.log('[GA4 Event]', eventName, params) // 개발 환경에서 디버깅용
    }
  }

  /**
   * 페이지뷰 추적 (Vue Router와 함께 사용)
   */
  const trackPageView = (pagePath: string, pageTitle?: string) => {
    if (typeof window !== 'undefined' && typeof window.gtag !== 'undefined') {
      window.gtag('config', GA4_MEASUREMENT_ID, {
        page_path: pagePath,
        page_title: pageTitle,
      })
      console.log('[GA4 PageView]', pagePath, pageTitle)
    }
  }

  /**
   * 사용자 속성 설정
   */
  const setUserProperties = (properties: Partial<UserProperties>) => {
    if (typeof window !== 'undefined' && typeof window.gtag !== 'undefined') {
      window.gtag('set', 'user_properties', properties)
      console.log('[GA4 User Properties]', properties)
    }
  }

  // ============================================
  // 핵심 제품 메트릭 추적 (최우선)
  // ============================================

  /**
   * 시나리오 생성 완료 추적
   */
  const trackScenarioCreated = (params: ScenarioCreatedParams) => {
    trackEvent('scenario_created', {
      book_id: params.bookId,
      book_title: params.bookTitle,
      scenario_type: params.scenarioType,
      has_fork_parent: params.hasForkParent ? 'yes' : 'no',
    })
  }

  /**
   * 대화 시작 추적
   */
  const trackConversationStarted = (params: ConversationParams) => {
    trackEvent('conversation_started', {
      scenario_id: params.scenarioId,
      is_fork: params.isFork ? 'yes' : 'no',
    })
  }

  /**
   * 대화 포크 생성 추적
   */
  const trackConversationForked = (params: ForkParams) => {
    trackEvent('conversation_forked', {
      original_conversation_id: params.originalId,
      fork_depth: params.forkDepth || 1,
    })
  }

  /**
   * 시나리오 포크 생성 추적
   */
  const trackScenarioForked = (params: ForkParams & { bookId?: string }) => {
    trackEvent('scenario_forked', {
      original_scenario_id: params.originalId,
      fork_depth: params.forkDepth || 1,
      book_id: params.bookId,
    })
  }

  // ============================================
  // 참여도 메트릭
  // ============================================

  /**
   * 검색 추적
   */
  const trackSearch = (params: SearchParams) => {
    trackEvent('search', {
      search_term: params.searchTerm,
      search_type: params.searchType,
      results_count: params.resultsCount,
    })
  }

  /**
   * 좋아요 액션 추적
   */
  const trackLike = (params: SocialActionParams) => {
    trackEvent('like', {
      content_type: params.contentType,
      content_id: params.contentId,
    })
  }

  /**
   * 좋아요 취소 추적
   */
  const trackUnlike = (params: SocialActionParams) => {
    trackEvent('unlike', {
      content_type: params.contentType,
      content_id: params.contentId,
    })
  }

  /**
   * 팔로우 추적
   */
  const trackFollow = (userId: string) => {
    trackEvent('follow', {
      followed_user_id: userId,
    })
  }

  /**
   * 언팔로우 추적
   */
  const trackUnfollow = (userId: string) => {
    trackEvent('unfollow', {
      unfollowed_user_id: userId,
    })
  }

  /**
   * 공유 추적
   */
  const trackShare = (params: SocialActionParams) => {
    trackEvent('share', {
      content_type: params.contentType,
      content_id: params.contentId,
      method: params.method || 'copy_link',
    })
  }

  // ============================================
  // 사용자 여정 추적
  // ============================================

  /**
   * 회원가입 완료 추적
   */
  const trackSignUp = (method = 'email') => {
    trackEvent('sign_up', {
      method,
    })
  }

  /**
   * 로그인 추적
   */
  const trackLogin = (method = 'email') => {
    trackEvent('login', {
      method,
    })
  }

  /**
   * 로그아웃 추적
   */
  const trackLogout = () => {
    trackEvent('logout')
  }

  /**
   * 책 상세 페이지 조회 추적
   */
  const trackBookViewed = (bookId: string, bookTitle: string) => {
    trackEvent('book_viewed', {
      book_id: bookId,
      book_title: bookTitle,
    })
  }

  /**
   * 시나리오 상세 페이지 조회 추적
   */
  const trackScenarioViewed = (scenarioId: string, bookId?: string) => {
    trackEvent('scenario_viewed', {
      scenario_id: scenarioId,
      book_id: bookId,
    })
  }

  /**
   * 프로필 조회 추적
   */
  const trackProfileViewed = (userId: string, isOwnProfile: boolean) => {
    trackEvent('profile_viewed', {
      user_id: userId,
      is_own_profile: isOwnProfile ? 'yes' : 'no',
    })
  }

  /**
   * 대화 메시지 전송 추적
   */
  const trackMessageSent = (conversationId: string, messageLength: number) => {
    trackEvent('message_sent', {
      conversation_id: conversationId,
      message_length: messageLength,
    })
  }

  /**
   * 에러 추적
   */
  const trackError = (errorType: string, errorMessage: string, page?: string) => {
    trackEvent('error', {
      error_type: errorType,
      error_message: errorMessage,
      page: page || window.location.pathname,
    })
  }

  // ============================================
  // 콘텐츠 발견 단계 (Content Discovery)
  // ============================================

  /**
   * 책 검색 추적
   */
  const trackSearchBooks = (query: string, resultsCount: number) => {
    trackEvent('search_books', {
      query,
      results_count: resultsCount,
    })
  }

  /**
   * 책 필터링 추적
   */
  const trackFilterBooks = (params: BookFilterParams) => {
    trackEvent('filter_books', {
      filter_type: params.filterType,
      filter_value: params.filterValue,
    })
  }

  /**
   * 책 정렬 추적
   */
  const trackSortBooks = (params: BookSortParams) => {
    trackEvent('sort_books', {
      sort_by: params.sortBy,
    })
  }

  /**
   * 책 상세보기 클릭 추적 (기존 trackBookViewed 확장)
   */
  const trackViewBookDetail = (params: BookDetailParams) => {
    trackEvent('view_book_detail', {
      book_id: params.bookId,
      book_title: params.bookTitle,
      author: params.author,
      genre: params.genre,
    })
  }

  /**
   * 시나리오 필터링 추적
   */
  const trackFilterScenarios = (params: ScenarioFilterParams) => {
    trackEvent('filter_scenarios', {
      filter_type: params.filterType,
      filter_value: params.filterValue,
    })
  }

  // ============================================
  // AI 대화 세션 추적 (Chat Session)
  // ============================================

  /**
   * 대화 세션 시작 추적
   */
  const trackChatSessionStart = (params: ChatSessionStartParams) => {
    trackEvent('chat_session_start', {
      scenario_id: params.scenarioId,
      scenario_title: params.scenarioTitle,
      conversation_id: params.conversationId,
      is_fork: params.isFork ? 'yes' : 'no',
    })
  }

  /**
   * 대화 세션 종료 추적
   */
  const trackChatSessionEnd = (params: ChatSessionEndParams) => {
    trackEvent('chat_session_end', {
      conversation_id: params.conversationId,
      scenario_id: params.scenarioId,
      duration: params.duration,
      message_count: params.messageCount,
      was_completed: params.wasCompleted ? 'yes' : 'no',
    })
  }

  /**
   * 대화 메시지 전송 추적 (확장)
   */
  const trackChatMessageSent = (params: ChatMessageParams) => {
    trackEvent('chat_message_sent', {
      conversation_id: params.conversationId,
      scenario_id: params.scenarioId,
      message_length: params.messageLength,
      message_number: params.messageNumber,
    })
  }

  /**
   * AI 응답 수신 추적
   */
  const trackChatResponseReceived = (params: ChatResponseParams) => {
    trackEvent('chat_response_received', {
      conversation_id: params.conversationId,
      response_time_ms: params.responseTimeMs,
      was_error: params.wasError ? 'yes' : 'no',
    })
  }

  /**
   * 대화 재생성 (재시도) 추적
   */
  const trackChatRetry = (params: ChatRetryParams) => {
    trackEvent('chat_retry', {
      conversation_id: params.conversationId,
      message_id: params.messageId,
      retry_count: params.retryCount,
    })
  }

  /**
   * 대화 저장 추적
   */
  const trackChatSave = (params: ChatSaveParams) => {
    trackEvent('chat_save', {
      conversation_id: params.conversationId,
      message_count: params.messageCount,
    })
  }

  // ============================================
  // 이미지 인터랙션 (Image Interaction)
  // ============================================

  /**
   * 이미지 조회/확대 추적
   */
  const trackImageView = (params: ImageViewParams) => {
    trackEvent('image_view', {
      image_type: params.imageType,
      entity_id: params.entityId,
      image_url: params.imageUrl,
    })
  }

  /**
   * 이미지 로딩 에러 추적
   */
  const trackImageLoadError = (params: ImageLoadErrorParams) => {
    trackEvent('image_load_error', {
      image_url: params.imageUrl,
      error_type: params.errorType,
      entity_type: params.entityType,
      entity_id: params.entityId,
    })
  }

  /**
   * 이미지 로딩 지연 추적 (3초 이상)
   */
  const trackImageLoadSlow = (params: ImageLoadSlowParams) => {
    trackEvent('image_load_slow', {
      image_url: params.imageUrl,
      load_time_ms: params.loadTimeMs,
      image_type: params.imageType,
    })
  }

  // ============================================
  // 전환 이벤트 (Conversion Events)
  // ============================================

  /**
   * 첫 대화 완료 전환 (3개 이상 메시지 교환)
   */
  const trackFirstChatCompletion = (params: FirstChatCompletionParams) => {
    trackEvent('first_chat_completion', {
      conversation_id: params.conversationId,
      scenario_id: params.scenarioId,
      message_count: params.messageCount,
      duration: params.duration,
    })
  }

  /**
   * 참여형 사용자 전환 (5분 이상 체류 + 2개 이상 페이지)
   */
  const trackEngagedUser = (params: EngagementParams) => {
    trackEvent('engaged_user', {
      session_duration: params.sessionDuration,
      pages_visited: params.pagesVisited,
      actions_performed: params.actionsPerformed.join(','),
    })
  }

  /**
   * 파워 유저 전환 (하루에 3개 이상 시나리오와 대화)
   */
  const trackPowerUser = (scenariosCount: number, conversationsCount: number) => {
    trackEvent('power_user', {
      scenarios_count: scenariosCount,
      conversations_count: conversationsCount,
    })
  }

  /**
   * 재방문 사용자 전환 (7일 내 재방문)
   */
  const trackReturningUser = (daysSinceLastVisit: number) => {
    trackEvent('returning_user', {
      days_since_last_visit: daysSinceLastVisit,
    })
  }

  // ============================================
  // 성능 메트릭 (Performance Metrics)
  // ============================================

  /**
   * Web Vitals 추적 (LCP, INP, CLS)
   */
  const trackWebVitals = (params: WebVitalsParams) => {
    trackEvent('web_vitals', {
      metric_name: params.metricName,
      value: params.value,
      rating: params.rating,
      page: params.page,
    })
  }

  /**
   * API 호출 성능 추적
   */
  const trackApiCallDuration = (params: ApiCallParams) => {
    trackEvent('api_call_duration', {
      endpoint: params.endpoint,
      duration_ms: params.durationMs,
      status: params.statusCode,
      method: params.method,
    })
  }

  /**
   * LLM 응답 시간 추적
   */
  const trackLLMResponseTime = (params: LLMResponseParams) => {
    trackEvent('llm_response_time', {
      scenario_id: params.scenarioId,
      conversation_id: params.conversationId,
      duration_ms: params.durationMs,
      was_error: params.wasError ? 'yes' : 'no',
    })
  }

  /**
   * 이미지 CDN 로딩 시간 추적
   */
  const trackImageCDNTime = (imageUrl: string, cdnTimeMs: number, imageSize?: number) => {
    trackEvent('image_cdn_time', {
      image_url: imageUrl,
      cdn_time_ms: cdnTimeMs,
      image_size: imageSize,
    })
  }

  return {
    // 기본 함수
    trackEvent,
    trackPageView,
    setUserProperties,

    // 핵심 제품 메트릭
    trackScenarioCreated,
    trackConversationStarted,
    trackConversationForked,
    trackScenarioForked,

    // 참여도 메트릭
    trackSearch,
    trackLike,
    trackUnlike,
    trackFollow,
    trackUnfollow,
    trackShare,

    // 사용자 여정
    trackSignUp,
    trackLogin,
    trackLogout,
    trackBookViewed,
    trackScenarioViewed,
    trackProfileViewed,
    trackMessageSent,
    trackError,

    // 콘텐츠 발견 단계
    trackSearchBooks,
    trackFilterBooks,
    trackSortBooks,
    trackViewBookDetail,
    trackFilterScenarios,

    // AI 대화 세션
    trackChatSessionStart,
    trackChatSessionEnd,
    trackChatMessageSent,
    trackChatResponseReceived,
    trackChatRetry,
    trackChatSave,

    // 이미지 인터랙션
    trackImageView,
    trackImageLoadError,
    trackImageLoadSlow,

    // 전환 이벤트
    trackFirstChatCompletion,
    trackEngagedUser,
    trackPowerUser,
    trackReturningUser,

    // 성능 메트릭
    trackWebVitals,
    trackApiCallDuration,
    trackLLMResponseTime,
    trackImageCDNTime,
  }
}
