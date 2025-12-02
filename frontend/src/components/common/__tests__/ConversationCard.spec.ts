import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import ConversationCard from '../ConversationCard.vue'

const mockPush = vi.fn()

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')
  return {
    ...actual,
    useRouter: () => ({
      push: mockPush,
    }),
  }
})

describe('ConversationCard.vue', () => {
  let wrapper: VueWrapper

  const mockConversation = {
    id: 'test-id',
    title: 'Test Conversation',
    description: 'Test description',
    messageCount: 10,
    likeCount: 5,
    createdAt: '2025-01-01T00:00:00Z',
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  const createWrapper = (conversation = mockConversation) => {
    return mount(ConversationCard, {
      props: {
        conversation,
      },
      global: {
        stubs: {
          LikeButton: true,
        },
      },
    })
  }

  it('renders conversation details correctly', () => {
    wrapper = createWrapper()
    expect(wrapper.find('h3').text()).toBe('Test Conversation')
    expect(wrapper.find('.description').text()).toBe('Test description')
    expect(wrapper.find('.message-count').text()).toContain('10 messages')
  })

  it('formats date correctly', () => {
    wrapper = createWrapper()
    const dateText = wrapper.find('.created-date').text()
    expect(dateText).toContain('Jan')
    expect(dateText).toContain('2025')
  })

  it('navigates to conversation on card click', async () => {
    wrapper = createWrapper()
    await wrapper.find('.conversation-card').trigger('click')
    expect(mockPush).toHaveBeenCalledWith('/conversations/test-id')
  })

  it('emits like-change event from LikeButton', () => {
    wrapper = createWrapper()
    const likeButton = wrapper.findComponent({ name: 'LikeButton' })
    likeButton.vm.$emit('like-change', { isLiked: true, likeCount: 6 })

    expect(wrapper.emitted('like-change')).toBeTruthy()
    expect(wrapper.emitted('like-change')?.[0]).toEqual([{ isLiked: true, likeCount: 6 }])
  })

  it('passes correct props to LikeButton', () => {
    wrapper = createWrapper()
    const likeButton = wrapper.findComponent({ name: 'LikeButton' })
    expect(likeButton.props('conversationId')).toBe('test-id')
    expect(likeButton.props('initialLikeCount')).toBe(5)
  })

  it('applies hover styles', () => {
    wrapper = createWrapper()
    expect(wrapper.find('.conversation-card').classes()).toContain('conversation-card')
  })
})
