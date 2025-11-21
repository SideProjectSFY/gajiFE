import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import router from './router'
import App from './App.vue'
import './styles/main.css'

const app = createApp(App)
const pinia = createPinia()

// IMPORTANT: Pinia must be installed before the router
// The router's navigation guards use useAuthStore(), which requires Pinia to be initialized first
app.use(pinia)
app.use(router)
app.use(PrimeVue, { unstyled: true }) // Use unstyled mode to apply PandaCSS

app.mount('#app')
