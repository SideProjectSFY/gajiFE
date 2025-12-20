import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatInput from '../ChatInput.vue'

describe('ChatInput', () => {
  it('renders correctly', () => {
    const wrapper = mount(ChatInput)

    expect(wrapper.find('[data-testid="chat-input-container"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="message-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="send-message-button"]').exists()).toBe(true)
  })

  it('emits send event with message content', async () => {
    const wrapper = mount(ChatInput)
    const textarea = wrapper.find('[data-testid="message-input"]')

    await textarea.setValue('Hello, world!')
    await wrapper.find('[data-testid="send-message-button"]').trigger('click')

    expect(wrapper.emitted('send')).toBeTruthy()
    expect(wrapper.emitted('send')?.[0]).toEqual(['Hello, world!'])
  })

  it('does not emit send for empty message', async () => {
    const wrapper = mount(ChatInput)

    await wrapper.find('[data-testid="send-message-button"]').trigger('click')

    expect(wrapper.emitted('send')).toBeFalsy()
  })

  it('sends message on Enter key', async () => {
    const wrapper = mount(ChatInput)
    const textarea = wrapper.find('[data-testid="message-input"]')

    await textarea.setValue('Test message')
    await textarea.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('send')).toBeTruthy()
  })

  it('does not send on Shift+Enter', async () => {
    const wrapper = mount(ChatInput)
    const textarea = wrapper.find('[data-testid="message-input"]')

    await textarea.setValue('Test message')
    await textarea.trigger('keydown', { key: 'Enter', shiftKey: true })

    expect(wrapper.emitted('send')).toBeFalsy()
  })

  it('disables input when disabled prop is true', () => {
    const wrapper = mount(ChatInput, {
      props: { disabled: true },
    })

    const textarea = wrapper.find('[data-testid="message-input"]')
    expect(textarea.attributes('disabled')).toBeDefined()
  })

  it('shows loading state when loading prop is true', () => {
    const wrapper = mount(ChatInput, {
      props: { loading: true },
    })

    expect(wrapper.find('[data-testid="send-message-button"]').attributes('aria-busy')).toBe('true')
  })

  it('shows loading placeholder when loading', () => {
    const wrapper = mount(ChatInput, {
      props: { loading: true },
    })

    const textarea = wrapper.find('[data-testid="message-input"]')
    expect(textarea.attributes('placeholder')).toContain('AI가 응답 중')
  })

  it('has proper accessibility labels', () => {
    const wrapper = mount(ChatInput)

    const textarea = wrapper.find('[data-testid="message-input"]')
    expect(textarea.attributes('aria-label')).toBeDefined()

    const button = wrapper.find('[data-testid="send-message-button"]')
    expect(button.attributes('aria-label')).toBeDefined()
  })
})
