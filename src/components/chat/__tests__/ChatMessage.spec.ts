import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatMessage from '../ChatMessage.vue'

// Mock @vueuse/core
vi.mock('@vueuse/core', () => ({
  useClipboard: (): { copy: ReturnType<typeof vi.fn>; isSupported: { value: boolean } } => ({
    copy: vi.fn().mockResolvedValue(undefined),
    isSupported: { value: true },
  }),
}))

describe('ChatMessage', () => {
  const mockUserMessage = {
    id: '1',
    conversationId: 'conv-1',
    role: 'user' as const,
    content: 'Hello, this is a test message',
    timestamp: new Date().toISOString(),
  }

  const mockAssistantMessage = {
    id: '2',
    conversationId: 'conv-1',
    role: 'assistant' as const,
    content: 'Hi, I am the AI assistant',
    timestamp: new Date().toISOString(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders user message correctly', () => {
    const wrapper = mount(ChatMessage, {
      props: {
        message: mockUserMessage,
      },
    })

    expect(wrapper.text()).toContain(mockUserMessage.content)
    expect(wrapper.find('[data-testid="message-user"]').exists()).toBe(true)
  })

  it('renders assistant message correctly', () => {
    const wrapper = mount(ChatMessage, {
      props: {
        message: mockAssistantMessage,
      },
    })

    expect(wrapper.text()).toContain(mockAssistantMessage.content)
    expect(wrapper.find('[data-testid="message-assistant"]').exists()).toBe(true)
  })

  it('displays formatted timestamp', () => {
    const wrapper = mount(ChatMessage, {
      props: {
        message: mockUserMessage,
      },
    })

    // Timestamp should be displayed
    const timestampElement = wrapper.find('span')
    expect(timestampElement.exists()).toBe(true)
  })

  it('shows copy button on hover', async () => {
    const wrapper = mount(ChatMessage, {
      props: {
        message: mockUserMessage,
      },
    })

    const copyButton = wrapper.find('[data-testid="copy-button-user"]')
    expect(copyButton.exists()).toBe(true)
  })

  it('has proper accessibility attributes', () => {
    const wrapper = mount(ChatMessage, {
      props: {
        message: mockUserMessage,
      },
    })

    const messageElement = wrapper.find('[data-role="user"]')
    expect(messageElement.exists()).toBe(true)
    expect(messageElement.attributes('aria-label')).toContain('내 메시지')
  })

  it('applies correct styling for user vs assistant', () => {
    const userWrapper = mount(ChatMessage, {
      props: { message: mockUserMessage },
    })

    const assistantWrapper = mount(ChatMessage, {
      props: { message: mockAssistantMessage },
    })

    expect(userWrapper.find('[data-role="user"]').exists()).toBe(true)
    expect(assistantWrapper.find('[data-role="assistant"]').exists()).toBe(true)
  })
})
