/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Profile from '../Profile.vue'
import { bookApi } from '@/services/bookApi'
import { userApi } from '@/services/userApi'

// Mock APIs
vi.mock('@/services/bookApi', () => ({
  bookApi: {
    unlikeBook: vi.fn(),
    getLikedBooks: vi.fn().mockResolvedValue({
      content: [{ id: '1', title: 'Book 1', author: 'Author 1', coverUrl: 'cover' }],
    }),
  },
}))

vi.mock('@/services/userApi', () => ({
  userApi: {
    unfollowUser: vi.fn(),
    getUserProfile: vi.fn().mockResolvedValue({ id: 'user1', username: 'testuser' }),
    getFollowing: vi
      .fn()
      .mockResolvedValue([{ id: 'user1', username: 'user1', avatarUrl: 'avatar' }]),
    getFollowers: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('@/services/conversationApi', () => ({
  getConversations: vi.fn().mockResolvedValue([]),
}))

// Mock vue-router
const mockRoute = {
  params: { username: 'testuser' },
  path: '/profile/testuser',
}
vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('Profile.vue Interactions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  const mountProfile = () => {
    return mount(Profile, {
      global: {
        stubs: {
          AppHeader: true,
          AppFooter: true,
          RouterLink: true,
        },
      },
    })
  }

  it('shows confirmation modal when unfollowing a user', async () => {
    const wrapper = mountProfile()
    await flushPromises()

    // 1. Open "All Following" modal
    // Find the "Following List" section and click "View All"
    // Since there are multiple "View All" buttons, we need to find the one for Following List
    // We can look for the section header "Following List" and then find the button nearby
    const followingSection = wrapper.findAll('h2').find((h) => h.text() === 'Following List')
    expect(followingSection).toBeDefined()

    // The button is a sibling or in the same container.
    // Based on the code, the button is in the same flex container as the h2.
    // Let's find all buttons and click the one that sets showFollowingModal = true
    // But we can't easily know which one that is without relying on implementation details or text order.
    // The "Following List" is the second list (after Like Book List).
    // Let's try to find the button by text "View All" and assume order or context.

    // Alternative: Find the button by checking if it triggers the modal.
    // Or just click all "View All" buttons? No.

    // Let's look at the structure:
    // <div> <h2>Following List</h2> <button>View All</button> </div>
    const viewAllButtons = wrapper.findAll('button').filter((b) => b.text() === 'View All')
    // Assuming the order: Like Book List, Following List, Follower List
    await viewAllButtons[1].trigger('click')

    // 2. Check if modal is open
    expect(wrapper.text()).toContain('All Following')

    // 3. Click "Unfollow" button (check mark)
    const unfollowButtons = wrapper.findAll('button[title="Unfollow this user"]')
    expect(unfollowButtons.length).toBeGreaterThan(0)
    await unfollowButtons[0].trigger('click')

    // 4. Check Confirmation Modal
    expect(wrapper.text()).toContain('Unfollow User')
    expect(wrapper.text()).toContain('Are you sure you want to unfollow this user?')

    // 5. Confirm Unfollow
    const deleteButton = wrapper.findAll('button').find((b) => b.text() === 'Delete')
    expect(deleteButton).toBeDefined()
    await deleteButton?.trigger('click')

    // 6. Verify API call
    expect(userApi.unfollowUser).toHaveBeenCalledWith('user1')
  })

  it('shows confirmation modal when unliking a book', async () => {
    const wrapper = mountProfile()
    await flushPromises()

    // 1. Open "All Liked Books" modal
    // Assuming it's the first "View All" button
    const viewAllButtons = wrapper.findAll('button').filter((b) => b.text() === 'View All')
    await viewAllButtons[0].trigger('click')

    // 2. Check if modal is open
    expect(wrapper.text()).toContain('All Liked Books')

    // 3. Click "Unlike" button (heart)
    const unlikeButtons = wrapper.findAll('button[title="Unlike this book"]')
    expect(unlikeButtons.length).toBeGreaterThan(0)
    await unlikeButtons[0].trigger('click')

    // 4. Check Confirmation Modal
    expect(wrapper.text()).toContain('Unlike Book')
    expect(wrapper.text()).toContain('Are you sure you want to unlike this book?')

    // 5. Confirm Unlike
    const deleteButton = wrapper.findAll('button').find((b) => b.text() === 'Delete')
    expect(deleteButton).toBeDefined()
    await deleteButton?.trigger('click')

    // 6. Verify API call
    expect(bookApi.unlikeBook).toHaveBeenCalledWith('1')
  })
})
