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

  return {
    // 기본 함수
    trackEvent,
    trackPageView,

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
  }
}
