/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Profile from '../Profile.vue'

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

  it('displays user profile with username', () => {
    const wrapper = mountProfile()
    // Profile uses mock data with username from route params
    expect(wrapper.text()).toContain('@testuser')
  })

  it('displays user bio', () => {
    const wrapper = mountProfile()
    expect(wrapper.text()).toContain('Book lover')
  })

  it('shows profile sections', () => {
    const wrapper = mountProfile()
    // Profile has various sections
    expect(wrapper.text()).toContain('Like Book List')
    expect(wrapper.text()).toContain('Following List')
    expect(wrapper.text()).toContain('Follower List')
  })

  it('displays liked books section', () => {
    const wrapper = mountProfile()
    // Mock data includes The Great Gatsby
    expect(wrapper.text()).toContain('The Great Gatsby')
    expect(wrapper.text()).toContain('Pride and Prejudice')
  })

  it('displays my conversations section', () => {
    const wrapper = mountProfile()
    expect(wrapper.text()).toContain('My Conversations')
  })

  it('has view all buttons for lists', () => {
    const wrapper = mountProfile()
    const viewAllButtons = wrapper.findAll('button').filter((b) => b.text().includes('View All'))
    expect(viewAllButtons.length).toBeGreaterThan(0)
  })

  it('displays conversation cards with like counts', () => {
    const wrapper = mountProfile()
    // My conversations have like counts displayed
    expect(wrapper.text()).toContain('♥')
  })

  it('renders avatar emoji', () => {
    const wrapper = mountProfile()
    expect(wrapper.text()).toContain('👤')
  })
})
