import { config } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { vi } from 'vitest'
import en from './i18n/locales/en.json'
import ko from './i18n/locales/ko.json'

const gsapTimeline = {
  fromTo: vi.fn(() => gsapTimeline),
  to: vi.fn(() => gsapTimeline),
}

vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    timeline: vi.fn(() => gsapTimeline),
    to: vi.fn(),
    fromTo: vi.fn(),
  },
}))

vi.mock('gsap/ScrollTrigger', () => ({
  default: {
    create: vi.fn(),
  },
}))

vi.mock('@tresjs/core', () => ({
  TresCanvas: { name: 'TresCanvas', template: '<div><slot /></div>' },
  useLoop: () => ({ onBeforeRender: vi.fn() }),
}))

vi.mock('@tresjs/cientos', () => ({
  ContactShadows: { name: 'ContactShadows', template: '<div />' },
  MouseParallax: { name: 'MouseParallax', template: '<div />' },
  OrbitControls: { name: 'OrbitControls', template: '<div />' },
  Stars: { name: 'Stars', template: '<div />' },
}))

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
