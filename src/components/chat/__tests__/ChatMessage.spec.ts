import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ChatMessage from '../ChatMessage.vue'
import { getRagSources } from '@/services/conversationApi'

// Mock @vueuse/core
vi.mock('@vueuse/core', () => ({
  useClipboard: (): { copy: ReturnType<typeof vi.fn>; isSupported: { value: boolean } } => ({
    copy: vi.fn().mockResolvedValue(undefined),
    isSupported: { value: true },
  }),
}))

vi.mock('@/services/conversationApi', () => ({
  getRagSources: vi.fn(),
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

  const mockGroundedAssistantMessage = {
    ...mockAssistantMessage,
    rag: {
      grounding_status: 'grounded',
      ranking_policy: 'vector_primary_rrf_fallback',
      citations: [
        {
          final_rank: 1,
          passage_id: 'novel:chunker:v1:chapter-03:chunk-0001:abcdef123456',
        },
      ],
    },
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
    expect(wrapper.find('[data-testid="user-message"]').exists()).toBe(true)
  })

  it('renders assistant message correctly', () => {
    const wrapper = mount(ChatMessage, {
      props: {
        message: mockAssistantMessage,
      },
    })

    expect(wrapper.text()).toContain(mockAssistantMessage.content)
    expect(wrapper.find('[data-testid="assistant-message"]').exists()).toBe(true)
  })

  it('renders RAG citation metadata without passage text', () => {
    const wrapper = mount(ChatMessage, {
      props: {
        message: mockGroundedAssistantMessage,
      },
    })

    expect(wrapper.find('[data-testid="rag-citations"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="rag-grounding-status"]').text()).toContain('grounded')
    expect(wrapper.find('[data-testid="rag-citation"]').text()).toContain('[1]')
    expect(wrapper.text()).not.toContain('Retrieved passages')
  })

  it('loads source passages when a citation is opened', async () => {
    vi.mocked(getRagSources).mockResolvedValue({
      conversationId: 'conv-1',
      assistantMessageId: '2',
      ragMetadataId: 'rag-1',
      novelId: 'novel-1',
      groundingStatus: 'grounded',
      fallbackUsed: false,
      fallbackReason: null,
      missingPassageIds: [],
      citations: [
        {
          citationId: 'citation-1',
          passageId: 'novel:chunker:v1:chapter-03:chunk-0001:abcdef123456',
          finalRank: 1,
          chapter: '3',
          sourceAvailable: true,
          text: 'Elizabeth and Darcy meet at the assembly.',
          metadata: { source_novel_id: 'gutenberg:1342' },
        },
      ],
    })

    const wrapper = mount(ChatMessage, {
      props: {
        message: mockGroundedAssistantMessage,
      },
    })

    await wrapper.find('[data-testid="rag-citation"]').trigger('click')
    await flushPromises()

    expect(getRagSources).toHaveBeenCalledWith('conv-1', '2')
    expect(wrapper.find('[data-testid="rag-source-drawer"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="rag-source-item"]').text()).toContain(
      'Elizabeth and Darcy meet at the assembly.'
    )
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
