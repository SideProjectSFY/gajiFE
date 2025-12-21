/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Profile from '../Profile.vue'
import { userApi } from '@/services/userApi'
import { bookApi } from '@/services/bookApi'
import { getConversations } from '@/services/conversationApi'

// Mock services
vi.mock('@/services/userApi', () => ({
  userApi: {
    getUserProfile: vi.fn(),
    getFollowing: vi.fn(),
    getFollowers: vi.fn(),
  },
}))

vi.mock('@/services/bookApi', () => ({
  bookApi: {
    getLikedBooks: vi.fn(),
  },
}))

vi.mock('@/services/conversationApi', () => ({
  getConversations: vi.fn(),
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

describe('Profile.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // Setup default mocks
    vi.mocked(userApi.getUserProfile).mockResolvedValue({
      id: '1',
      username: 'testuser',
      bio: 'Book lover',
      avatarUrl: null,
    })

    vi.mocked(userApi.getFollowing).mockResolvedValue([])
    vi.mocked(userApi.getFollowers).mockResolvedValue([])

    vi.mocked(bookApi.getLikedBooks).mockResolvedValue({
      content: [
        { id: '1', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', coverUrl: '' },
        { id: '2', title: 'Pride and Prejudice', author: 'Jane Austen', coverUrl: '' },
      ],
      totalElements: 2,
    })

    vi.mocked(getConversations).mockResolvedValue([
      {
        id: '1',
        title: 'Chat 1',
        likeCount: 5,
        bookTitle: 'Book 1',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Chat 2',
        likeCount: 3,
        bookTitle: 'Book 2',
        createdAt: new Date().toISOString(),
      },
    ])
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

  it('displays user profile with username', async () => {
    const wrapper = mountProfile()
    await flushPromises()
    expect(wrapper.text()).toContain('@testuser')
  })

  it('displays user bio', async () => {
    const wrapper = mountProfile()
    await flushPromises()
    expect(wrapper.text()).toContain('Book lover')
  })

  it('shows profile sections', async () => {
    const wrapper = mountProfile()
    await flushPromises()
    // Based on failure output: "Liked BooksView AllLiked ConversationsView AllFollowingView AllFollowersView AllMy ConversationsView All"
    expect(wrapper.text()).toContain('Liked Books')
    expect(wrapper.text()).toContain('Following')
    expect(wrapper.text()).toContain('Followers')
  })

  it('displays liked books section', async () => {
    const wrapper = mountProfile()
    await flushPromises()
    expect(wrapper.text()).toContain('The Great Gatsby')
    expect(wrapper.text()).toContain('Pride and Prejudice')
  })

  it('displays my conversations section', async () => {
    const wrapper = mountProfile()
    await flushPromises()
    expect(wrapper.text()).toContain('My Conversations')
  })

  it('has view all buttons for lists', async () => {
    const wrapper = mountProfile()
    await flushPromises()
    const viewAllButtons = wrapper.findAll('button').filter((b) => b.text().includes('View All'))
    expect(viewAllButtons.length).toBeGreaterThan(0)
  })

  it('displays conversation cards with like counts', async () => {
    const wrapper = mountProfile()
    await flushPromises()
    expect(wrapper.text()).toContain('♥')
    expect(wrapper.text()).toContain('5')
  })
})
