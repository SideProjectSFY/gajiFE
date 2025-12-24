/**
 * 이미지 로딩 성능 및 에러 추적을 위한 Composable
 */

import { ref, onMounted } from 'vue'
import { useAnalytics } from './useAnalytics'
import { captureImageError } from '@/utils/sentry'

interface ImageTrackingOptions {
  imageType: 'book_cover' | 'scenario_thumbnail' | 'user_avatar'
  entityId: string
  imageUrl: string
}

export function useImageTracking(options: ImageTrackingOptions): {
  isLoading: import('vue').Ref<boolean>
  hasError: import('vue').Ref<boolean>
  onImageLoad: () => void
  onImageError: (event?: Event) => void
  onImageClick: () => void
} {
  const { trackImageView, trackImageLoadError, trackImageLoadSlow, trackImageCDNTime } =
    useAnalytics()

  const isLoading = ref(true)
  const hasError = ref(false)
  const loadStartTime = ref(0)

  /**
   * 이미지 로딩 시작
   */
  const startTracking = (): void => {
    loadStartTime.value = Date.now()
  }

  /**
   * 이미지 로딩 성공
   */
  const onImageLoad = (): void => {
    isLoading.value = false
    const loadTime = Date.now() - loadStartTime.value

    // CDN 로딩 시간 추적
    trackImageCDNTime(options.imageUrl, loadTime)

    // 로딩 시간이 3초 이상이면 느린 로딩으로 추적
    if (loadTime > 3000) {
      trackImageLoadSlow({
        imageUrl: options.imageUrl,
        loadTimeMs: loadTime,
        imageType: options.imageType,
      })
    }

    // 이미지 조회 추적 (선택적)
    // trackImageView({
    //   imageType: options.imageType,
    //   entityId: options.entityId,
    //   imageUrl: options.imageUrl,
    // })
  }

  /**
   * 이미지 로딩 실패
   */
  const onImageError = (event?: Event): void => {
    isLoading.value = false
    hasError.value = true

    // 에러 타입 추론
    let errorType: 'not_found' | 'network_error' | 'cloudfront_error' = 'network_error'

    // CloudFront 에러 감지
    if (options.imageUrl.includes('cloudfront.net')) {
      errorType = 'cloudfront_error'
    } else if (event && (event as ErrorEvent).message?.includes('404')) {
      errorType = 'not_found'
    }

    const entityType: 'book' | 'scenario' | 'user' = options.imageType.includes('book')
      ? 'book'
      : options.imageType.includes('scenario')
        ? 'scenario'
        : 'user'

    // GA4 추적
    trackImageLoadError({
      imageUrl: options.imageUrl,
      errorType,
      entityType,
      entityId: options.entityId,
    })

    // Sentry 에러 캡처
    captureImageError(options.imageUrl, {
      entityType,
      entityId: options.entityId,
    })
  }

  /**
   * 이미지 클릭/확대 추적
   */
  const onImageClick = (): void => {
    trackImageView({
      imageType: options.imageType,
      entityId: options.entityId,
      imageUrl: options.imageUrl,
    })
  }

  onMounted(() => {
    startTracking()
  })

  return {
    isLoading,
    hasError,
    onImageLoad,
    onImageError,
    onImageClick,
  }
}
