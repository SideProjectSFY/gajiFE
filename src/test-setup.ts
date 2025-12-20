import { config } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from './i18n/locales/en.json'
import ko from './i18n/locales/ko.json'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en,
    ko,
  },
})

config.global.plugins = [i18n]
config.global.mocks = {
  $t: (msg: string) => msg,
}
