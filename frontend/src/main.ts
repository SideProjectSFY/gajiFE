import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import router from './router'
import App from './App.vue'
import './styles/main.css'

// Google Analytics 4 초기화
const GA4_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID

if (GA4_MEASUREMENT_ID && GA4_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
  // GA4 스크립트 동적 로드
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`
  document.head.appendChild(script)

  // gtag 함수 초기화
  window.dataLayer = window.dataLayer || []
  function gtag(...args: any[]) {
    if (window.dataLayer) {
      window.dataLayer.push(args)
    }
  }
  gtag('js', new Date())
  gtag('config', GA4_MEASUREMENT_ID, {
    send_page_view: false, // Vue Router에서 수동으로 추적
  })

  // gtag을 window 객체에 할당
  window.gtag = gtag
}

const app = createApp(App)
const pinia = createPinia()

// IMPORTANT: Pinia must be installed before the router
// The router's navigation guards use useAuthStore(), which requires Pinia to be initialized first
app.use(pinia)
app.use(router)
app.use(PrimeVue, { unstyled: true }) // Use unstyled mode to apply PandaCSS

app.mount('#app')
