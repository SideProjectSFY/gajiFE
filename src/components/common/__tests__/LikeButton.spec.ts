import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LikeButton from '../LikeButton.vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

vi.mock('@/services/api')

describe('LikeButton.vue', () => {
  let wrapper: VueWrapper
  let authStore: ReturnType<typeof useAuthStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    vi.clearAllMocks()
  })

  const createWrapper = (props = {}): ReturnType<typeof mount> => {
    return mount(LikeButton, {
      props: {
        conversationId: 'test-conversation-id',
        initialLikeCount: 5,
        ...props,
      },
      global: {
        stubs: {
          // Stub any child components if needed
        },
      },
    })
  }

  it('renders like button correctly', () => {
    wrapper = createWrapper()
    expect(wrapper.find('.like-button').exists()).toBe(true)
    expect(wrapper.find('.heart-icon').exists()).toBe(true)
  })

  it('displays like count correctly', () => {
    wrapper = createWrapper({ initialLikeCount: 10 })
    expect(wrapper.find('.like-count').text()).toBe('10')
  })

  it('formats like count over 1000 as k', () => {
    wrapper = createWrapper({ initialLikeCount: 1500 })
    expect(wrapper.find('.like-count').text()).toBe('1.5k')
  })

  it('hides like count when zero', () => {
    wrapper = createWrapper({ initialLikeCount: 0 })
    expect(wrapper.find('.like-count').exists()).toBe(false)
  })

  it('is disabled when not authenticated', () => {
    authStore.accessToken = null
    wrapper = createWrapper()
    expect(wrapper.find('.like-button').attributes('disabled')).toBeDefined()
  })

  it('is enabled when authenticated', () => {
    authStore.accessToken = 'test-token'
    authStore.user = { id: '1', username: 'test', email: 'test@test.com' }
    authStore.user = { id: '1', username: 'test', email: 'test@test.com' }
    wrapper = createWrapper()
    expect(wrapper.find('.like-button').attributes('disabled')).toBeUndefined()
  })

  it('checks like status on mount when authenticated', async () => {
    authStore.accessToken = 'test-token'
    authStore.user = { id: '1', username: 'test', email: 'test@test.com' }
    vi.mocked(api.get).mockResolvedValue({
      data: { isLiked: true, likeCount: 10 },
    })

    wrapper = createWrapper()
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(api.get).toHaveBeenCalledWith('/conversations/test-conversation-id/liked')
  })

  it('does not check like status when not authenticated', async () => {
    authStore.accessToken = null

    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    expect(api.get).not.toHaveBeenCalled()
  })

  it('handles like toggle with optimistic update', async () => {
    authStore.accessToken = 'test-token'
    authStore.user = { id: '1', username: 'test', email: 'test@test.com' }
    vi.mocked(api.post).mockResolvedValue({
      data: { isLiked: true, likeCount: 6 },
    })

    wrapper = createWrapper({ initialLikeCount: 5 })
    await wrapper.find('.like-button').trigger('click')

    // Optimistic update should happen immediately
    await wrapper.vm.$nextTick()

    expect(api.post).toHaveBeenCalledWith('/conversations/test-conversation-id/like')
  })

  it('handles unlike toggle', async () => {
    authStore.accessToken = 'test-token'
    authStore.user = { id: '1', username: 'test', email: 'test@test.com' }
    vi.mocked(api.get).mockResolvedValue({
      data: { isLiked: true, likeCount: 5 },
    })
    vi.mocked(api.delete).mockResolvedValue({
      data: { isLiked: false, likeCount: 4 },
    })

    wrapper = createWrapper()
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    await wrapper.find('.like-button').trigger('click')
    await wrapper.vm.$nextTick()

    expect(api.delete).toHaveBeenCalledWith('/conversations/test-conversation-id/unlike')
  })

  it('rolls back on API error', async () => {
    authStore.accessToken = 'test-token'
    authStore.user = { id: '1', username: 'test', email: 'test@test.com' }
    vi.mocked(api.post).mockRejectedValue(new Error('API Error'))

    wrapper = createWrapper({ initialLikeCount: 5 })
    const initialCount = wrapper.find('.like-count').text()

    await wrapper.find('.like-button').trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    // Should roll back to original count
    expect(wrapper.find('.like-count').text()).toBe(initialCount)
  })

  it('emits like-change event on successful like', async () => {
    authStore.accessToken = 'test-token'
    authStore.user = { id: '1', username: 'test', email: 'test@test.com' }
    vi.mocked(api.post).mockResolvedValue({
      data: { isLiked: true, likeCount: 6 },
    })

    wrapper = createWrapper()
    await wrapper.find('.like-button').trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.emitted('like-change')).toBeTruthy()
    expect(wrapper.emitted('like-change')?.[0]).toEqual([{ isLiked: true, likeCount: 6 }])
  })

  it('adds animating class during animation', async () => {
    authStore.accessToken = 'test-token'
    authStore.user = { id: '1', username: 'test', email: 'test@test.com' }
    vi.mocked(api.post).mockResolvedValue({
      data: { isLiked: true, likeCount: 6 },
    })

    wrapper = createWrapper()
    await wrapper.find('.like-button').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.like-button').classes()).toContain('animating')
  })

  it('has correct aria-label for accessibility', () => {
    wrapper = createWrapper()
    expect(wrapper.find('.like-button').attributes('aria-label')).toBe('Like')
  })

  it('updates aria-label when liked', async () => {
    authStore.accessToken = 'test-token'
    authStore.user = { id: '1', username: 'test', email: 'test@test.com' }
    vi.mocked(api.get).mockResolvedValue({
      data: { isLiked: true, likeCount: 5 },
    })

    wrapper = createWrapper()
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.find('.like-button').attributes('aria-label')).toBe('Unlike')
  })
})
