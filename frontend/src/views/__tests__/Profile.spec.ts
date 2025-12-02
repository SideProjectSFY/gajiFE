import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Profile from '../Profile.vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

// Mock api service
vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
  },
}))

// Mock vue-router
const mockRoute = {
  params: { username: 'testuser' },
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
  })

  it('displays loading state initially', () => {
    const wrapper = mount(Profile)
    expect(wrapper.text()).toContain('Loading profile')
  })

  it('displays user profile information', async () => {
    const mockProfile = {
      id: '1',
      username: 'testuser',
      bio: 'Test bio',
      avatarUrl: '/avatar.jpg',
      joinedAt: '2024-01-01T00:00:00Z',
      scenarioCount: 5,
      conversationCount: 3,
      followerCount: 10,
      followingCount: 8,
    }

    vi.mocked(api.get).mockResolvedValueOnce({ data: mockProfile })

    const wrapper = mount(Profile)
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('testuser')
    expect(wrapper.text()).toContain('Test bio')
    expect(wrapper.text()).toContain('5')
    expect(wrapper.text()).toContain('3')
    expect(wrapper.text()).toContain('10')
    expect(wrapper.text()).toContain('8')
  })

  it('shows "Edit Profile" button for own profile', async () => {
    const authStore = useAuthStore()
    authStore.user = { id: '1', username: 'testuser', email: 'test@test.com' }
    authStore.accessToken = 'token'

    const mockProfile = {
      id: '1',
      username: 'testuser',
      bio: 'Test bio',
      joinedAt: '2024-01-01T00:00:00Z',
      scenarioCount: 0,
      conversationCount: 0,
      followerCount: 0,
      followingCount: 0,
    }

    vi.mocked(api.get).mockResolvedValueOnce({ data: mockProfile })

    const wrapper = mount(Profile)
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('Edit Profile')
  })

  it('does not show "Edit Profile" button for other users', async () => {
    const authStore = useAuthStore()
    authStore.user = { id: '1', username: 'otheruser', email: 'other@test.com' }
    authStore.accessToken = 'token'

    const mockProfile = {
      id: '2',
      username: 'testuser',
      bio: 'Test bio',
      joinedAt: '2024-01-01T00:00:00Z',
      scenarioCount: 0,
      conversationCount: 0,
      followerCount: 0,
      followingCount: 0,
    }

    vi.mocked(api.get).mockResolvedValueOnce({ data: mockProfile })

    const wrapper = mount(Profile)
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.text()).not.toContain('Edit Profile')
  })

  it('displays empty state when user has no scenarios', async () => {
    const mockProfile = {
      id: '1',
      username: 'testuser',
      bio: 'Test bio',
      joinedAt: '2024-01-01T00:00:00Z',
      scenarioCount: 0,
      conversationCount: 0,
      followerCount: 0,
      followingCount: 0,
    }

    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: mockProfile })
      .mockResolvedValueOnce({ data: [] })

    const wrapper = mount(Profile)
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('No scenarios created yet')
  })

  it('displays scenarios grid when user has scenarios', async () => {
    const mockProfile = {
      id: '1',
      username: 'testuser',
      bio: 'Test bio',
      joinedAt: '2024-01-01T00:00:00Z',
      scenarioCount: 2,
      conversationCount: 0,
      followerCount: 0,
      followingCount: 0,
    }

    const mockScenarios = {
      content: [
        { id: '1', title: 'Scenario 1', description: 'Description 1' },
        { id: '2', title: 'Scenario 2', description: 'Description 2' },
      ],
    }

    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: mockProfile })
      .mockResolvedValueOnce({ data: { isFollowing: false, followerCount: 0 } }) // FollowButton API call
      .mockResolvedValueOnce({ data: mockScenarios })

    const wrapper = mount(Profile)

    // Wait for component to mount and all API calls to complete
    await flushPromises()
    await wrapper.vm.$nextTick()
    // Longer wait for all async operations and DOM updates
    await new Promise((resolve) => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Scenario 1')
    expect(wrapper.text()).toContain('Scenario 2')
  })

  it('formats join date correctly', async () => {
    const mockProfile = {
      id: '1',
      username: 'testuser',
      bio: 'Test bio',
      joinedAt: '2024-01-15T00:00:00Z',
      scenarioCount: 0,
      conversationCount: 0,
      followerCount: 0,
      followingCount: 0,
    }

    vi.mocked(api.get).mockResolvedValueOnce({ data: mockProfile })

    const wrapper = mount(Profile)
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('January')
    expect(wrapper.text()).toContain('2024')
  })

  it('displays default bio message when bio is empty', async () => {
    const mockProfile = {
      id: '1',
      username: 'testuser',
      bio: null,
      joinedAt: '2024-01-01T00:00:00Z',
      scenarioCount: 0,
      conversationCount: 0,
      followerCount: 0,
      followingCount: 0,
    }

    vi.mocked(api.get).mockResolvedValueOnce({ data: mockProfile })

    const wrapper = mount(Profile)
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('No bio yet')
  })
})
