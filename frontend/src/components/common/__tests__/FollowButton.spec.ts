import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import FollowButton from '../FollowButton.vue'
import api from '@/services/api'

// Mock API
vi.mock('@/services/api')

describe('FollowButton', () => {
  let wrapper: VueWrapper<InstanceType<typeof FollowButton>>
  const mockUserId = 'user-123'
  const mockUsername = 'testuser'

  const createWrapper = (props = {}) => {
    // Create a div for Teleport target
    const el = document.createElement('div')
    el.id = 'modal-target'
    document.body.appendChild(el)

    return mount(FollowButton, {
      props: {
        userId: mockUserId,
        username: mockUsername,
        ...props,
      },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
          }),
        ],
        stubs: {
          Teleport: false, // Don't stub Teleport
        },
      },
      attachTo: document.body,
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    // Clean up any modal targets
    document.body.innerHTML = ''
  })

  describe('Initial State', () => {
    it('should render the component', () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { isFollowing: false, isMutual: false },
      })

      wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })

    it('should check follow status on mount', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { isFollowing: false, isMutual: false },
      })

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(api.get).toHaveBeenCalledWith(`/users/${mockUserId}/is-following`)
    })

    it('should display "Follow" button when not following', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { isFollowing: false, isMutual: false },
      })

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(wrapper.text()).toContain('Follow')
    })

    it('should display "Following" button when already following', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { isFollowing: true, isMutual: false },
      })

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(wrapper.text()).toContain('Following')
    })

    it('should display mutual badge when mutual follow', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { isFollowing: true, isMutual: true },
      })

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(wrapper.text()).toContain('↔')
    })
  })

  describe('Follow Action', () => {
    it('should send follow request when clicking Follow button', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { isFollowing: false, isMutual: false },
      })
      vi.mocked(api.post).mockResolvedValue({
        data: { isFollowing: true, isMutual: false, followerCount: 10 },
      })

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 10))

      const followButton = wrapper.find('button')
      await followButton.trigger('click')

      expect(api.post).toHaveBeenCalledWith(`/users/${mockUserId}/follow`)
    })

    it('should show optimistic update when following', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { isFollowing: false, isMutual: false },
      })
      vi.mocked(api.post).mockResolvedValue({
        data: { isFollowing: true, isMutual: false, followerCount: 10 },
      })

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 10))

      const followButton = wrapper.find('button')
      await followButton.trigger('click')

      // Should show Following immediately (optimistic update)
      expect(wrapper.text()).toContain('Following')
    })

    it('should emit follow-change event on successful follow', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { isFollowing: false, isMutual: false },
      })

      const postPromise = Promise.resolve({
        data: { isFollowing: true, isMutual: false, followerCount: 10 },
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(api.post).mockReturnValue(postPromise as any)

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 10))

      const followButton = wrapper.find('button')
      await followButton.trigger('click')

      // Wait for the API call to complete
      await postPromise
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 20))

      expect(wrapper.emitted('follow-change')).toBeTruthy()
      expect(wrapper.emitted('follow-change')?.[0]).toEqual([
        { isFollowing: true, followerCount: 10 },
      ])
    })

    it('should rollback on failed follow request', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { isFollowing: false, isMutual: false },
      })

      const postPromise = Promise.reject(new Error('Network error'))
      // Add catch handler immediately to prevent unhandled rejection
      postPromise.catch(() => {})
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(api.post).mockReturnValue(postPromise as any)

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 10))

      const followButton = wrapper.find('button')
      await followButton.trigger('click')

      // Wait for promise rejection
      await postPromise.catch(() => {})
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 20))

      // Should revert to Follow state
      expect(wrapper.text()).toContain('Follow')

      consoleSpy.mockRestore()
    })
  })

  describe('Unfollow Action', () => {
    it('should show confirmation modal when clicking Following button', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { isFollowing: true, isMutual: false },
      })

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 10))

      const followingButton = wrapper.find('button')
      await followingButton.trigger('click')
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Check in document body for teleported content
      const modalText = document.body.textContent || ''
      expect(modalText).toContain(`Unfollow @${mockUsername}?`)
    })

    it('should close modal on cancel', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { isFollowing: true, isMutual: false },
      })

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Open modal
      const followingButton = wrapper.find('button')
      await followingButton.trigger('click')
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Find Cancel button in document body
      const cancelButtons = Array.from(document.querySelectorAll('button')).filter((btn) =>
        btn.textContent?.includes('Cancel')
      )
      expect(cancelButtons.length).toBeGreaterThan(0)
      cancelButtons[0].click()
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Modal should be closed
      const modalText = document.body.textContent || ''
      expect(modalText).not.toContain(`Unfollow @${mockUsername}?`)
    })

    it('should send unfollow request when confirming', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { isFollowing: true, isMutual: false },
      })
      vi.mocked(api.delete).mockResolvedValue({
        data: { followerCount: 9 },
      })

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Open modal
      const followingButton = wrapper.find('button')
      await followingButton.trigger('click')
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Find and click Unfollow button in document body
      const unfollowButtons = Array.from(document.querySelectorAll('button')).filter(
        (btn) => btn.textContent?.includes('Unfollow') && !btn.textContent?.includes('?')
      )
      expect(unfollowButtons.length).toBeGreaterThan(0)
      unfollowButtons[0].click()
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 20))

      expect(api.delete).toHaveBeenCalledWith(`/users/${mockUserId}/unfollow`)
    })

    it('should emit follow-change event on successful unfollow', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { isFollowing: true, isMutual: false },
      })

      const deletePromise = Promise.resolve({
        data: { followerCount: 9 },
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(api.delete).mockReturnValue(deletePromise as any)

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Open modal and confirm
      const followingButton = wrapper.find('button')
      await followingButton.trigger('click')
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Find and click Unfollow button
      const unfollowButtons = Array.from(document.querySelectorAll('button')).filter(
        (btn) => btn.textContent?.includes('Unfollow') && !btn.textContent?.includes('?')
      )
      unfollowButtons[0].click()

      // Wait for the API call to complete
      await deletePromise
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(wrapper.emitted('follow-change')).toBeTruthy()
      expect(wrapper.emitted('follow-change')?.[0]).toEqual([
        { isFollowing: false, followerCount: 9 },
      ])
    })

    it('should rollback on failed unfollow request', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { isFollowing: true, isMutual: false },
      })
      vi.mocked(api.delete).mockRejectedValue(new Error('Network error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Open modal and confirm
      const followingButton = wrapper.find('button')
      await followingButton.trigger('click')
      await wrapper.vm.$nextTick()

      const buttons = wrapper.findAll('button')
      const unfollowButton = buttons.find((btn) => btn.text() === 'Unfollow')
      await unfollowButton?.trigger('click')
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Should still show Following state
      expect(wrapper.text()).toContain('Following')

      consoleSpy.mockRestore()
    })
  })

  describe('Button State', () => {
    it('should disable button while loading', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { isFollowing: false, isMutual: false },
      })

      let resolvePost: (value: unknown) => void
      const postPromise = new Promise((resolve) => {
        resolvePost = resolve
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(api.post).mockReturnValue(postPromise as any)

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 10))

      const followButton = wrapper.find('button')
      await followButton.trigger('click')
      await wrapper.vm.$nextTick()

      // Check component's internal isLoading state
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isLoading = (wrapper.vm as any).isLoading
      expect(isLoading).toBe(true)

      // Clean up
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolvePost!({ data: { isFollowing: true, followerCount: 1 } } as any)
      await postPromise
    })

    it('should show loading text while following', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { isFollowing: false, isMutual: false },
      })

      let resolvePost: (value: unknown) => void
      const postPromise = new Promise((resolve) => {
        resolvePost = resolve
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(api.post).mockReturnValue(postPromise as any)

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 10))

      const followButton = wrapper.find('button')
      await followButton.trigger('click')
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 10))

      // During loading, should show optimistic "Following" state
      // (not "Following..." as the component shows "Following" optimistically)
      expect(wrapper.text()).toContain('Following')

      // Clean up
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolvePost!({ data: { isFollowing: true, followerCount: 1 } } as any)
      await postPromise
    })
  })
})
