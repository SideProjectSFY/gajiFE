import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TypingIndicator from '../TypingIndicator.vue'

describe('TypingIndicator', () => {
  it('renders correctly', () => {
    const wrapper = mount(TypingIndicator)

    expect(wrapper.find('[data-testid="typing-indicator"]').exists()).toBe(true)
  })

  it('displays typing text', () => {
    const wrapper = mount(TypingIndicator)

    expect(wrapper.text()).toContain('AI가 생각하는 중')
  })

  it('has animated dots', () => {
    const wrapper = mount(TypingIndicator)

    const dots = wrapper.findAll('[aria-hidden="true"] div')
    expect(dots.length).toBe(3)
  })

  it('has accessibility attributes', () => {
    const wrapper = mount(TypingIndicator)

    const indicator = wrapper.find('[data-testid="typing-indicator"]')
    expect(indicator.attributes('aria-busy')).toBe('true')

    // Screen reader announcement
    const srText = wrapper.find('[aria-live="polite"]')
    expect(srText.exists()).toBe(true)
    expect(srText.text()).toContain('AI가 응답을 생성하고 있습니다')
  })
})
