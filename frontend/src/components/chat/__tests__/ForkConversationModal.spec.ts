import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ForkConversationModal from '../ForkConversationModal.vue'
import type { Message } from '@/stores/conversation'

describe('ForkConversationModal', () => {
  let targetElement: HTMLElement

  beforeEach(() => {
    setActivePinia(createPinia())
    // Create a target element for Teleport
    targetElement = document.createElement('div')
    targetElement.id = 'teleport-target'
    document.body.appendChild(targetElement)
  })

  afterEach(() => {
    // Clean up
    document.body.removeChild(targetElement)
  })

  const mockMessages: Message[] = [
    {
      id: '1',
      conversationId: 'conv-1',
      role: 'user',
      content: 'Message 1',
      timestamp: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      conversationId: 'conv-1',
      role: 'assistant',
      content: 'Response 1',
      timestamp: '2024-01-01T00:01:00Z',
    },
    {
      id: '3',
      conversationId: 'conv-1',
      role: 'user',
      content: 'Message 2',
      timestamp: '2024-01-01T00:02:00Z',
    },
    {
      id: '4',
      conversationId: 'conv-1',
      role: 'assistant',
      content: 'Response 2',
      timestamp: '2024-01-01T00:03:00Z',
    },
    {
      id: '5',
      conversationId: 'conv-1',
      role: 'user',
      content: 'Message 3',
      timestamp: '2024-01-01T00:04:00Z',
    },
    {
      id: '6',
      conversationId: 'conv-1',
      role: 'assistant',
      content: 'Response 3',
      timestamp: '2024-01-01T00:05:00Z',
    },
    {
      id: '7',
      conversationId: 'conv-1',
      role: 'user',
      content: 'Message 4',
      timestamp: '2024-01-01T00:06:00Z',
    },
  ]

  it('should render modal when modelValue is true', () => {
    const wrapper = mount(ForkConversationModal, {
      props: {
        modelValue: true,
        messages: mockMessages,
      },
      attachTo: document.body,
    })

    expect(document.body.querySelector('h2')?.textContent?.trim()).toBe('🔀 대화 분기 생성')
    wrapper.unmount()
  })

  it('should not render modal when modelValue is false', () => {
    const wrapper = mount(ForkConversationModal, {
      props: {
        modelValue: false,
        messages: mockMessages,
      },
      attachTo: document.body,
    })

    // Modal overlay should not exist when modelValue is false
    const modalOverlay = document.body.querySelector('.fixed.inset-0')
    expect(modalOverlay).toBeNull()
    wrapper.unmount()
  })

  it('should show correct preview text when messages >= 6', () => {
    const wrapper = mount(ForkConversationModal, {
      props: {
        modelValue: true,
        messages: mockMessages,
      },
      attachTo: document.body,
    })

    expect(document.body.textContent).toContain('마지막 6개의 메시지가 새 대화에 복사됩니다.')
    wrapper.unmount()
  })

  it('should show correct preview text when messages < 6', () => {
    const fewMessages = mockMessages.slice(0, 3)
    const wrapper = mount(ForkConversationModal, {
      props: {
        modelValue: true,
        messages: fewMessages,
      },
      attachTo: document.body,
    })

    expect(document.body.textContent).toContain('모든 3개의 메시지가 복사됩니다.')
    wrapper.unmount()
  })

  it('should display last 6 messages in preview', () => {
    const wrapper = mount(ForkConversationModal, {
      props: {
        modelValue: true,
        messages: mockMessages,
      },
      attachTo: document.body,
    })

    // Should show messages 2-7 (last 6 messages)
    expect(document.body.textContent).toContain('Response 1')
    expect(document.body.textContent).toContain('Message 4')
    expect(document.body.textContent).not.toContain('Message 1')
    wrapper.unmount()
  })

  it('should emit update:modelValue when close button is clicked', async () => {
    const wrapper = mount(ForkConversationModal, {
      props: {
        modelValue: true,
        messages: mockMessages,
      },
      attachTo: document.body,
    })

    // Find and click the close button (X button in header)
    const closeButton = document.body.querySelector('button.text-gray-400') as HTMLElement
    await closeButton.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
    wrapper.unmount()
  })

  it('should emit fork event when create fork button is clicked', async () => {
    const wrapper = mount(ForkConversationModal, {
      props: {
        modelValue: true,
        messages: mockMessages,
      },
      attachTo: document.body,
    })

    const description = 'Test fork description'
    const textarea = document.body.querySelector('textarea') as HTMLTextAreaElement

    // Properly trigger v-model update
    textarea.value = description
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    await wrapper.vm.$nextTick()

    // Find the fork button (blue button with "분기 생성" text)
    const buttons = Array.from(document.body.querySelectorAll('button'))
    const createButton = buttons.find((btn) =>
      btn.textContent?.includes('분기 생성')
    ) as HTMLElement
    await createButton.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('fork')).toBeTruthy()
    expect(wrapper.emitted('fork')?.[0]).toEqual([description])
    wrapper.unmount()
  })

  it('should disable buttons while submitting', async () => {
    const wrapper = mount(ForkConversationModal, {
      props: {
        modelValue: true,
        messages: mockMessages,
      },
      attachTo: document.body,
    })

    const buttons = document.body.querySelectorAll('button')
    const createButton = buttons[buttons.length - 1] as HTMLElement
    await createButton.click()

    // Button should show loading state
    expect(document.body.textContent).toContain('생성 중...')
    wrapper.unmount()
  })

  it('should show warning message about one-time fork', () => {
    const wrapper = mount(ForkConversationModal, {
      props: {
        modelValue: true,
        messages: mockMessages,
      },
      attachTo: document.body,
    })

    expect(document.body.textContent).toContain('원본 대화는 한 번만 분기할 수 있습니다.')
    wrapper.unmount()
  })
})
