import { createI18n } from 'vue-i18n'
import ko from './locales/ko.json'
import en from './locales/en.json'

export type MessageSchema = typeof ko

const i18n = createI18n<[MessageSchema], 'ko' | 'en'>({
  legacy: false,
  locale: localStorage.getItem('locale') || 'ko',
  fallbackLocale: 'ko',
  messages: {
    ko,
    en,
  },
})

export default i18n
