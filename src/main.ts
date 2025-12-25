import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import 'primeicons/primeicons.css'
import router from './router'
import App from './App.vue'
import './styles/main.css'
import { useAuthStore } from './stores/auth'
import i18n from './i18n'
import { initWebVitals } from './utils/webVitals'
import { useAnalytics } from './composables/useAnalytics'
import { initSentry, setSentryUser } from './utils/sentry'

// Google Analytics 4 초기화
const GA4_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID

// Define gtag function type
function gtag(...args: unknown[]): void {
  if (window.dataLayer) {
    window.dataLayer.push(args)
  }
}

if (GA4_MEASUREMENT_ID && GA4_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
  // GA4 스크립트 동적 로드
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`
  document.head.appendChild(script)

  // gtag 함수 초기화
  window.dataLayer = window.dataLayer || []

  gtag('js', new Date())
  gtag('config', GA4_MEASUREMENT_ID, {
    send_page_view: false, // Vue Router에서 수동으로 추적
  })

  // gtag을 window 객체에 할당
  window.gtag = gtag

  // Web Vitals 추적 초기화
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      initWebVitals()
    })
  }
}

const app = createApp(App)
const pinia = createPinia()

// IMPORTANT: Pinia must be installed before the router
// The router's navigation guards use useAuthStore(), which requires Pinia to be initialized first
app.use(pinia)

// Initialize auth state from cookies after Pinia is installed
const authStore = useAuthStore()
authStore.initializeFromCookies()

// Sentry 초기화 (Pinia 설치 후, Router 설치 전)
initSentry(app, router)

// Sentry 사용자 정보 설정
if (authStore.isAuthenticated && authStore.user) {
  setSentryUser({
    id: authStore.user.id,
    username: authStore.user.username,
    email: authStore.user.email,
  })
}

// 사용자 속성 초기화
const { setUserProperties } = useAnalytics()
if (authStore.isAuthenticated) {
  setUserProperties({
    user_type: 'returning',
    device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent)
      ? 'mobile'
      : /iPad|Tablet/i.test(navigator.userAgent)
        ? 'tablet'
        : 'desktop',
  })
} else {
  setUserProperties({
    user_type: 'new',
    device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent)
      ? 'mobile'
      : /iPad|Tablet/i.test(navigator.userAgent)
        ? 'tablet'
        : 'desktop',
  })
}

app.use(router)
app.use(PrimeVue, { unstyled: true }) // Use unstyled mode to apply PandaCSS
app.use(ToastService)
app.use(ConfirmationService)
app.use(i18n)

app.mount('#app')
