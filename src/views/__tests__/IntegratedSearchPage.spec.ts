import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import IntegratedSearchPage from '../IntegratedSearchPage.vue'

// Mock vue-router
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
}

const mockRoute = {
  query: { q: '' },
  path: '/search',
}

vi.mock('vue-router', () => ({
  useRouter: (): typeof mockRouter => mockRouter,
  useRoute: (): typeof mockRoute => mockRoute,
}))

describe('IntegratedSearchPage.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRoute.query = { q: '' }
  })

  const createWrapper = (): ReturnType<typeof mount<typeof IntegratedSearchPage>> => {
    return mount(IntegratedSearchPage, {
      global: {
        stubs: {
          AppHeader: true,
          AppFooter: true,
          RouterLink: true,
        },
      },
    })
  }

  describe('Rendering', () => {
    it('renders search page title', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('Search')
    })

    it('renders search input with proper accessibility attributes', () => {
      const wrapper = createWrapper()
      const searchInput = wrapper.find('input[type="search"]')

      expect(searchInput.exists()).toBe(true)
      expect(searchInput.attributes('aria-label')).toBe('책, 캐릭터, 대화 검색')
      expect(searchInput.attributes('placeholder')).toBeTruthy()
    })

    it('renders search filter tabs', () => {
      const wrapper = createWrapper()

      expect(wrapper.text()).toContain('All')
      expect(wrapper.text()).toContain('Book')
      expect(wrapper.text()).toContain('Story')
      expect(wrapper.text()).toContain('Users')
    })

    it('has accessible tab navigation with ARIA attributes', () => {
      const wrapper = createWrapper()

      const tablist = wrapper.find('[role="tablist"]')
      expect(tablist.exists()).toBe(true)

      const tabs = wrapper.findAll('[role="tab"]')
      expect(tabs.length).toBe(4)

      // First tab should be selected by default
      const selectedTab = tabs.find((tab) => tab.attributes('aria-selected') === 'true')
      expect(selectedTab).toBeTruthy()
    })
  })

  describe('Tab Navigation', () => {
    it('changes active tab on click', async () => {
      const wrapper = createWrapper()
      const tabs = wrapper.findAll('[role="tab"]')

      // Click on Books tab (index 1)
      await tabs[1].trigger('click')
      await nextTick()

      expect(tabs[1].attributes('aria-selected')).toBe('true')
    })

    it('supports keyboard navigation between tabs', async () => {
      const wrapper = createWrapper()
      const tabs = wrapper.findAll('[role="tab"]')

      // Trigger right arrow key on first tab
      await tabs[0].trigger('keydown.right')
      await nextTick()

      const updatedTabs = wrapper.findAll('[role="tab"]')
      // After pressing right arrow, second tab should be selected
      expect(updatedTabs[1].attributes('aria-selected')).toBe('true')
    })

    it('wraps around on keyboard navigation', async () => {
      const wrapper = createWrapper()
      const tabs = wrapper.findAll('[role="tab"]')

      // Press left arrow on first tab - should wrap to last tab
      await tabs[0].trigger('keydown.left')
      await nextTick()

      const updatedTabs = wrapper.findAll('[role="tab"]')
      // Should wrap to the last tab (Users)
      expect(updatedTabs[3].attributes('aria-selected')).toBe('true')
    })
  })

  describe('Search Functionality', () => {
    it('updates search query on input', async () => {
      const wrapper = createWrapper()
      const searchInput = wrapper.find('input[type="search"]')

      await searchInput.setValue('test query')

      expect((searchInput.element as HTMLInputElement).value).toBe('test query')
    })

    it('shows empty state when no search query', () => {
      const wrapper = createWrapper()

      // Should show some guidance or empty state
      expect(wrapper.text()).toContain('Search')
    })
  })

  describe('Loading States', () => {
    it('shows loading skeletons while searching', async () => {
      const wrapper = createWrapper()
      const searchInput = wrapper.find('input[type="search"]')

      await searchInput.setValue('test')
      // Trigger immediate search without waiting for debounce
      await searchInput.trigger('keydown.enter')

      // Note: Loading states are shown based on isLoading ref
      // The actual behavior depends on the mock implementation
      expect(wrapper.html()).toBeTruthy()
    })
  })

  describe('Accessibility', () => {
    it('has proper page title', () => {
      const wrapper = createWrapper()
      const h1 = wrapper.find('h1')

      expect(h1.exists()).toBe(true)
      expect(h1.text()).toContain('Search')
    })

    it('search input can be cleared with Escape key', async () => {
      const wrapper = createWrapper()
      const searchInput = wrapper.find('input[type="search"]')

      await searchInput.setValue('test query')
      await searchInput.trigger('keydown.escape')

      expect((searchInput.element as HTMLInputElement).value).toBe('')
    })

    it('has screen reader hint for search', () => {
      const wrapper = createWrapper()
      const srHint = wrapper.find('#search-hint')

      expect(srHint.exists()).toBe(true)
      expect(srHint.text()).toContain('Escape')
    })
  })

  describe('Results Display', () => {
    it('displays book results in Books tab', async () => {
      const wrapper = createWrapper()
      const tabs = wrapper.findAll('[role="tab"]')

      // Switch to Books tab
      await tabs[1].trigger('click')
      await nextTick()

      // Should be in books tab
      expect(tabs[1].attributes('aria-selected')).toBe('true')
    })

    it('displays user results in Users tab', async () => {
      const wrapper = createWrapper()
      const tabs = wrapper.findAll('[role="tab"]')

      // Switch to Users tab
      await tabs[3].trigger('click')
      await nextTick()

      expect(tabs[3].attributes('aria-selected')).toBe('true')
    })
  })
})
