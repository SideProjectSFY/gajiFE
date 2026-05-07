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
    ragMetadataId: '7f5ab245-e989-4a46-9973-6613d9a14511',
    providerElapsedMs: 2437.4,
    rag: {
      grounding_status: 'grounded',
      fallback_used: false,
      ranking_policy: 'vector_primary_rrf_fallback',
      passage_count: 4,
      citations: [
        {
          final_rank: 1,
          passage_id: 'novel:chunker:v1:chapter-03:chunk-0001:abcdef123456',
        },
        {
          final_rank: 2,
          passage_id: 'novel:chunker:v1:chapter-34:chunk-0007:fedcba654321',
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
    expect(wrapper.find('[data-testid="rag-fallback-status"]').text()).toContain('fallback no')
    expect(wrapper.find('[data-testid="rag-metadata-id"]').text()).toContain('rag 7f5ab245')
    expect(wrapper.find('[data-testid="rag-provider-latency"]').text()).toContain(
      'provider 2437 ms'
    )
    expect(wrapper.find('[data-testid="rag-citation"]').text()).toContain('[1]')
    expect(wrapper.text()).not.toContain('Retrieved passages')
    expect(wrapper.text()).not.toContain('Elizabeth and Darcy meet at the assembly.')
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
          vectorRank: 1,
          bm25Rank: 3,
          chapter: '3',
          sourceAvailable: true,
          text: 'Elizabeth and Darcy meet at the assembly.',
          manifestId: 'manifest-1234567890',
          metadata: { source_novel_id: 'gutenberg:1342' },
        },
        {
          citationId: 'citation-2',
          passageId: 'novel:chunker:v1:chapter-34:chunk-0007:fedcba654321',
          finalRank: 2,
          vectorRank: 2,
          bm25Rank: 1,
          chapter: '34',
          sourceAvailable: true,
          text: 'Darcy explains his conduct in a letter.',
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
    expect(wrapper.find('[data-testid="rag-source-item"]').text()).toContain('vector #1')
    expect(wrapper.find('[data-testid="rag-source-item"]').text()).toContain('manifest manifest')
  })

  it('moves the clicked citation source to the top of the drawer', async () => {
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
        {
          citationId: 'citation-2',
          passageId: 'novel:chunker:v1:chapter-34:chunk-0007:fedcba654321',
          finalRank: 2,
          chapter: '34',
          sourceAvailable: true,
          text: 'Darcy explains his conduct in a letter.',
          metadata: { source_novel_id: 'gutenberg:1342' },
        },
      ],
    })

    const wrapper = mount(ChatMessage, {
      props: {
        message: mockGroundedAssistantMessage,
      },
    })

    await wrapper.findAll('[data-testid="rag-citation"]')[1].trigger('click')
    await flushPromises()

    const firstSource = wrapper.find('[data-testid="rag-source-item"]')
    expect(firstSource.attributes('data-selected')).toBe('true')
    expect(firstSource.text()).toContain('Darcy explains his conduct in a letter.')
  })

  it('shows fallback QA metadata even without citations', () => {
    const wrapper = mount(ChatMessage, {
      props: {
        message: {
          ...mockAssistantMessage,
          ragMetadataId: 'rag-fallback-1',
          providerElapsedMs: 9012,
          rag: {
            grounding_status: 'fallback_ungrounded',
            fallback_used: true,
            fallback_reason: 'provider_generation_exception',
            citations: [],
          },
        },
      },
    })

    expect(wrapper.find('[data-testid="rag-citations"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="rag-grounding-status"]').text()).toContain(
      'fallback ungrounded'
    )
    expect(wrapper.find('[data-testid="rag-fallback-status"]').text()).toContain('fallback used')
    expect(wrapper.find('[data-testid="rag-fallback-reason"]').text()).toContain(
      'provider_generation_exception'
    )
    expect(wrapper.find('[data-testid="rag-no-citations"]').text()).toContain('No source citations')
  })

  it('shows source policy message when source text is unavailable', async () => {
    vi.mocked(getRagSources).mockResolvedValue({
      conversationId: 'conv-1',
      assistantMessageId: '2',
      ragMetadataId: 'rag-1',
      novelId: 'novel-1',
      groundingStatus: 'grounded',
      fallbackUsed: false,
      fallbackReason: null,
      missingPassageIds: ['novel:chunker:v1:chapter-03:chunk-0001:abcdef123456'],
      citations: [
        {
          citationId: 'citation-1',
          passageId: 'novel:chunker:v1:chapter-03:chunk-0001:abcdef123456',
          finalRank: 1,
          chapter: '3',
          sourceAvailable: false,
          text: null,
          metadata: null,
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

    expect(wrapper.find('[data-testid="rag-missing-sources"]').text()).toContain(
      'Missing sources: 1'
    )
    expect(wrapper.find('[data-testid="rag-source-item"]').text()).toContain(
      'Source text is unavailable'
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
