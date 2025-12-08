import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import About from '../About.vue'

// Mock vue-router
const mockRouter = {
  push: vi.fn(),
}

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
  useRoute: () => ({ path: '/about' }),
}))

describe('About.vue', () => {
  it('renders the About page title', () => {
    const wrapper = mount(About, {
      global: {
        stubs: {
          AppHeader: true,
          AppFooter: true,
          RouterLink: true,
        },
      },
    })

    expect(wrapper.text()).toContain('About Gaji')
  })

  it('renders Gaji meaning section', () => {
    const wrapper = mount(About, {
      global: {
        stubs: {
          AppHeader: true,
          AppFooter: true,
          RouterLink: true,
        },
      },
    })

    expect(wrapper.text()).toContain('What does "Gaji" mean?')
    expect(wrapper.text()).toContain('branch')
  })

  it('renders mission section', () => {
    const wrapper = mount(About, {
      global: {
        stubs: {
          AppHeader: true,
          AppFooter: true,
          RouterLink: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Our Mission')
    expect(wrapper.text()).toContain('classic literature')
  })

  it('renders the 4 mission cards', () => {
    const wrapper = mount(About, {
      global: {
        stubs: {
          AppHeader: true,
          AppFooter: true,
          RouterLink: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Preserve Literature')
    expect(wrapper.text()).toContain('Build Community')
    expect(wrapper.text()).toContain('Enhance Understanding')
    expect(wrapper.text()).toContain('Innovate Education')
  })

  it('renders Get Started steps', () => {
    const wrapper = mount(About, {
      global: {
        stubs: {
          AppHeader: true,
          AppFooter: true,
          RouterLink: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Get Started in 4 Simple Steps')
    expect(wrapper.text()).toContain('STEP 1')
    expect(wrapper.text()).toContain('STEP 2')
    expect(wrapper.text()).toContain('STEP 3')
    expect(wrapper.text()).toContain('STEP 4')
  })

  it('has proper heading hierarchy', () => {
    const wrapper = mount(About, {
      global: {
        stubs: {
          AppHeader: true,
          AppFooter: true,
          RouterLink: true,
        },
      },
    })

    // Check for h1 as main heading
    const h1 = wrapper.find('h1')
    expect(h1.exists()).toBe(true)
    expect(h1.text()).toContain('About Gaji')

    // Check for h2 section headings
    const h2s = wrapper.findAll('h2')
    expect(h2s.length).toBeGreaterThan(0)
  })

  it('has accessible breadcrumb navigation', () => {
    const wrapper = mount(About, {
      global: {
        stubs: {
          AppHeader: true,
          AppFooter: true,
          RouterLink: true,
        },
      },
    })

    const nav = wrapper.find('nav[aria-label="Breadcrumb"]')
    expect(nav.exists()).toBe(true)

    const currentPage = wrapper.find('[aria-current="page"]')
    expect(currentPage.exists()).toBe(true)
    expect(currentPage.text()).toBe('About')
  })
})
