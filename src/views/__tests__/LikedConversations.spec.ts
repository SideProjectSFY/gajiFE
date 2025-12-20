/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LikedConversations from '../LikedConversations.vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

vi.mock('@/services/api')

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

describe('LikedConversations.vue', () => {
  let wrapper: VueWrapper
  let authStore: ReturnType<typeof useAuthStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    vi.clearAllMocks()
  })

  const mockConversations = {
    content: [
      {
        id: '1',
        title: 'Conversation 1',
        description: 'Description 1',
        messageCount: 10,
        likeCount: 5,
        createdAt: '2025-01-01T00:00:00Z',
      },
      {
        id: '2',
        title: 'Conversation 2',
        description: 'Description 2',
        messageCount: 15,
        likeCount: 8,
        createdAt: '2025-01-02T00:00:00Z',
      },
    ],
    totalElements: 2,
    totalPages: 1,
  }

  const createWrapper = () => {
    return mount(LikedConversations, {
      global: {
        stubs: {
          ConversationCard: true,
          Spinner: true,
          Pagination: true,
          RouterLink: true,
        },
      },
    })
  }

  it('redirects to login if not authenticated', async () => {
    authStore.accessToken = null
    wrapper = createWrapper()
    await wrapper.vm.$nextTick()
    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  it('loads liked conversations on mount when authenticated', async () => {
    authStore.accessToken = 'test-token'; authStore.user = { id: '1', username: 'test', email: 'test@test.com' }
    vi.mocked(api.get).mockResolvedValue({
      data: mockConversations,
    })

    wrapper = createWrapper()
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(api.get).toHaveBeenCalledWith('/users/me/liked-conversations', {
      params: { page: 0, size: 20 },
    })
  })

  it('displays loading state while fetching', () => {
    authStore.accessToken = 'test-token'; authStore.user = { id: '1', username: 'test', email: 'test@test.com' }
    vi.mocked(api.get).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ data: mockConversations }), 100)
        })
    )

    wrapper = createWrapper()
    expect(wrapper.find('.loading-state').exists()).toBe(true)
  })

  it('displays empty state when no liked conversations', async () => {
    authStore.accessToken = 'test-token'; authStore.user = { id: '1', username: 'test', email: 'test@test.com' }
    vi.mocked(api.get).mockResolvedValue({
      data: { content: [], totalElements: 0, totalPages: 0 },
    })

    wrapper = createWrapper()
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.text()).toContain('No liked conversations yet')
  })

  it('displays conversation grid when conversations exist', async () => {
    authStore.accessToken = 'test-token'; authStore.user = { id: '1', username: 'test', email: 'test@test.com' }
    vi.mocked(api.get).mockResolvedValue({
      data: mockConversations,
    })

    wrapper = createWrapper()
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.find('.conversation-grid').exists()).toBe(true)
  })

  it('displays correct total count', async () => {
    authStore.accessToken = 'test-token'; authStore.user = { id: '1', username: 'test', email: 'test@test.com' }
    vi.mocked(api.get).mockResolvedValue({
      data: mockConversations,
    })

    wrapper = createWrapper()
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain("2 conversations you've liked")
  })

  it('renders ConversationCard for each conversation', async () => {
    authStore.accessToken = 'test-token'; authStore.user = { id: '1', username: 'test', email: 'test@test.com' }
    vi.mocked(api.get).mockResolvedValue({
      data: mockConversations,
    })

    wrapper = createWrapper()
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    const cards = wrapper.findAllComponents({ name: 'ConversationCard' })
    expect(cards).toHaveLength(2)
  })

  it('shows pagination when multiple pages exist', async () => {
    authStore.accessToken = 'test-token'; authStore.user = { id: '1', username: 'test', email: 'test@test.com' }
    vi.mocked(api.get).mockResolvedValue({
      data: { ...mockConversations, totalPages: 3 },
    })

    wrapper = createWrapper()
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.findComponent({ name: 'Pagination' }).exists()).toBe(true)
  })

  it('hides pagination when single page', async () => {
    authStore.accessToken = 'test-token'; authStore.user = { id: '1', username: 'test', email: 'test@test.com' }
    vi.mocked(api.get).mockResolvedValue({
      data: mockConversations,
    })

    wrapper = createWrapper()
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.findComponent({ name: 'Pagination' }).exists()).toBe(false)
  })

  it('handles API error gracefully', async () => {
    authStore.accessToken = 'test-token'; authStore.user = { id: '1', username: 'test', email: 'test@test.com' }
    vi.mocked(api.get).mockRejectedValue(new Error('API Error'))

    wrapper = createWrapper()
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    // Should show empty state or error state
    expect(wrapper.find('.empty-state').exists()).toBe(true)
  })
})
