/**
 * Web Vitals 추적 유틸리티
 * Core Web Vitals (LCP, INP, CLS)를 측정하고 GA4로 전송
 */

import { useAnalytics } from '@/composables/useAnalytics'

type MetricRating = 'good' | 'needs-improvement' | 'poor'

/**
 * 메트릭 값에 따라 평가 등급 반환
 */
function getRating(name: string, value: number): MetricRating {
  switch (name) {
    case 'LCP':
      if (value <= 2500) return 'good'
      if (value <= 4000) return 'needs-improvement'
      return 'poor'
    case 'INP':
      if (value <= 200) return 'good'
      if (value <= 500) return 'needs-improvement'
      return 'poor'
    case 'CLS':
      if (value <= 0.1) return 'good'
      if (value <= 0.25) return 'needs-improvement'
      return 'poor'
    default:
      return 'poor'
  }
}

/**
 * Web Vitals 초기화 및 추적 시작
 */
export function initWebVitals(): void {
  const { trackWebVitals } = useAnalytics()

  // LCP (Largest Contentful Paint)
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
          renderTime?: number
          loadTime?: number
        }

        const value = lastEntry.renderTime || lastEntry.loadTime || 0
        const rating = getRating('LCP', value)

        trackWebVitals({
          metricName: 'LCP',
          value,
          rating,
          page: window.location.pathname,
        })
      })

      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
    } catch (e) {
      console.error('LCP 추적 초기화 실패:', e)
    }

    // INP (Interaction to Next Paint)
    try {
      const inpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach((entry) => {
          const duration = (entry as PerformanceEventTiming).duration || 0
          const rating = getRating('INP', duration)

          trackWebVitals({
            metricName: 'INP',
            value: duration,
            rating,
            page: window.location.pathname,
          })
        })
      })

      inpObserver.observe({ type: 'event', buffered: true })
    } catch (e) {
      console.error('INP 추적 초기화 실패:', e)
    }

    // CLS (Cumulative Layout Shift)
    try {
      let clsValue = 0
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries() as LayoutShift[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        }

        const rating = getRating('CLS', clsValue)

        trackWebVitals({
          metricName: 'CLS',
          value: clsValue,
          rating,
          page: window.location.pathname,
        })
      })

      clsObserver.observe({ type: 'layout-shift', buffered: true })
    } catch (e) {
      console.error('CLS 추적 초기화 실패:', e)
    }
  }
}

// PerformanceEventTiming 타입 확장
interface PerformanceEventTiming extends PerformanceEntry {
  duration: number
  processingStart: number
  processingEnd: number
}

// LayoutShift 타입 정의
interface LayoutShift extends PerformanceEntry {
  value: number
  hadRecentInput: boolean
}
