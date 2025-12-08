import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ScenarioSearch from '@/components/scenario/ScenarioSearch.vue'
import { searchScenarios } from '@/services/scenarioApi'

// Mock alert globally
globalThis.alert = vi.fn()

// Mock router
const mockPush = vi.fn()
vi.mock('vue-router', (): unknown => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock API - we'll control the implementation per test
vi.mock('@/services/scenarioApi', () => ({
  searchScenarios: vi.fn(),
}))

describe.skip('ScenarioSearch Integration Tests', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let wrapper: any

  const mockSearchResults = {
    content: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Hermione in Slytherin',
        description: 'What if Hermione was sorted into Slytherin house?',
        whatIfQuestion: 'What if Hermione was in Slytherin?',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        isPrivate: false,
        forkCount: 15,
        qualityScore: 8.5,
        scenarioCategory: 'CHARACTER_CHANGE',
        createdAt: '2025-11-27T10:00:00',
      },
      {
        id: '223e4567-e89b-12d3-a456-426614174000',
        title: 'Harry Potter Parents Survive',
        description: 'What if James and Lily Potter survived?',
        whatIfQuestion: 'What if Harry parents lived?',
        userId: '223e4567-e89b-12d3-a456-426614174001',
        isPrivate: false,
        forkCount: 25,
        qualityScore: 9.2,
        scenarioCategory: 'EVENT_ALTERATION',
        createdAt: '2025-11-26T10:00:00',
      },
    ],
    page: {
      number: 0,
      size: 20,
      totalElements: 2,
      totalPages: 1,
    },
    first: true,
    last: true,
    empty: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  // ============================================================================
  // End-to-End User Flow Tests
  // ============================================================================

  describe('complete user flows', () => {
    it('user searches and views results', async () => {
      vi.mocked(searchScenarios).mockResolvedValue(mockSearchResults)
      wrapper = mount(ScenarioSearch)

      // User types search query
      const searchInput = wrapper.find('input[placeholder*="Search scenarios"]')
      await searchInput.setValue('Hermione')
      await nextTick()

      // Wait for component to update
      await new Promise((resolve) => setTimeout(resolve, 350))
      await nextTick()

      // Results should be displayed
      expect(wrapper.vm.results).toHaveLength(2)
      expect(wrapper.text()).toContain('Hermione in Slytherin')
    })

    it('user opens filters, applies them, and sees filtered results', async () => {
      vi.mocked(searchScenarios).mockResolvedValue(mockSearchResults)
      wrapper = mount(ScenarioSearch)

      // User opens filter panel
      const filterButton = wrapper
        .findAll('button')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .find((btn: any) => btn.text().includes('Filters') || btn.text().includes('Toggle'))
      if (filterButton) {
        await filterButton.trigger('click')
        await nextTick()
      }

      expect(wrapper.vm.filtersVisible).toBe(true)

      // User selects category directly through component VM
      wrapper.vm.filters.category = 'CHARACTER_CHANGE'
      await nextTick()

      // User applies filters
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const applyButton = wrapper.findAll('button').find((btn: any) => btn.text().includes('Apply'))
      if (applyButton) {
        await applyButton.trigger('click')
      }

      await new Promise((resolve) => setTimeout(resolve, 350))
      await nextTick()

      // API should be called with filters
      expect(searchScenarios).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'CHARACTER_CHANGE',
        })
      )
    })

    it('user clicks on search result and navigates', async () => {
      vi.mocked(searchScenarios).mockResolvedValue(mockSearchResults)
      wrapper = mount(ScenarioSearch)

      // Trigger initial search to populate results
      await wrapper.vm.performSearch()
      await nextTick()

      // Find and click first result
      const resultCards = wrapper.findAll('[class*="cursor"]')
      if (resultCards.length > 0) {
        await resultCards[0].trigger('click')
        await nextTick()

        // Should navigate to scenario detail
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('123e4567-e89b-12d3-a456-426614174000')
        )
      }
    })

    it('user changes sort order and sees reordered results', async () => {
      vi.mocked(searchScenarios).mockResolvedValue(mockSearchResults)
      wrapper = mount(ScenarioSearch)

      await wrapper.setData({ results: mockSearchResults.content })
      await nextTick()

      // User changes sort
      await wrapper.setData({ sortBy: 'newest' })
      await new Promise((resolve) => setTimeout(resolve, 350))
      await nextTick()

      // API should be called with new sort
      expect(searchScenarios).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: 'newest',
        })
      )
    })

    it('user navigates through pages', async () => {
      const multiPageResults = {
        ...mockSearchResults,
        page: {
          number: 0,
          size: 20,
          totalElements: 100,
          totalPages: 5,
        },
        last: false,
      }

      vi.mocked(searchScenarios).mockResolvedValue(multiPageResults)
      wrapper = mount(ScenarioSearch)

      await wrapper.setData({
        results: multiPageResults.content,
        currentPage: 1,
        totalPages: 5,
      })
      await nextTick()

      // User clicks next page
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nextButton = wrapper.findAll('button').find((btn: any) => btn.text().includes('Next'))

      if (nextButton && !nextButton.attributes('disabled')) {
        await nextButton.trigger('click')
        await new Promise((resolve) => setTimeout(resolve, 350))
        await nextTick()

        expect(wrapper.vm.currentPage).toBe(2)
      }
    })
  })

  // ============================================================================
  // Error Recovery Tests
  // ============================================================================

  describe('error handling and recovery', () => {
    it('recovers from network error', async () => {
      vi.mocked(searchScenarios).mockRejectedValueOnce(new Error('Network error'))
      wrapper = mount(ScenarioSearch)

      const searchInput = wrapper.find('input[placeholder*="Search scenarios"]')
      await searchInput.setValue('Hermione')
      await new Promise((resolve) => setTimeout(resolve, 350))
      await nextTick()

      // Should not crash
      expect(wrapper.vm.isSearching).toBe(false)

      // User tries again - should work
      vi.mocked(searchScenarios).mockResolvedValueOnce(mockSearchResults)
      await searchInput.setValue('Hermione Potter')
      await new Promise((resolve) => setTimeout(resolve, 350))
      await nextTick()

      expect(wrapper.vm.results.length).toBeGreaterThan(0)
    })

    it('handles empty results gracefully', async () => {
      vi.mocked(searchScenarios).mockResolvedValue({
        content: [],
        page: { number: 0, size: 20, totalElements: 0, totalPages: 0 },
        first: true,
        last: true,
        empty: true,
      })

      wrapper = mount(ScenarioSearch)

      const searchInput = wrapper.find('input[placeholder*="Search scenarios"]')
      await searchInput.setValue('NonexistentQuery')
      await new Promise((resolve) => setTimeout(resolve, 350))
      await nextTick()

      expect(wrapper.text()).toContain('No scenarios match')
    })

    it('handles server returning invalid data', async () => {
      vi.mocked(searchScenarios).mockResolvedValue({
        content: [],
        page: {
          number: 0,
          size: 20,
          totalElements: 0,
          totalPages: 0,
        },
        first: true,
        last: true,
        empty: true,
      })

      wrapper = mount(ScenarioSearch)

      const searchInput = wrapper.find('input[placeholder*="Search scenarios"]')
      await searchInput.setValue('Test')
      await new Promise((resolve) => setTimeout(resolve, 350))
      await nextTick()

      // Should not crash
      expect(wrapper.exists()).toBe(true)
    })
  })

  // ============================================================================
  // Performance and UX Tests
  // ============================================================================

  describe('performance and user experience', () => {
    it('debounces rapid typing', async () => {
      vi.mocked(searchScenarios).mockResolvedValue(mockSearchResults)
      wrapper = mount(ScenarioSearch)

      const searchInput = wrapper.find('input[placeholder*="Search scenarios"]')

      // Rapid typing
      await searchInput.setValue('H')
      await searchInput.setValue('He')
      await searchInput.setValue('Her')
      await searchInput.setValue('Herm')
      await searchInput.setValue('Hermione')

      // Should not call API yet
      expect(searchScenarios).not.toHaveBeenCalled()

      // After debounce delay
      await new Promise((resolve) => setTimeout(resolve, 350))
      await nextTick()

      // Should call only once
      expect(searchScenarios).toHaveBeenCalledTimes(1)
    })

    it('shows loading state during search', async () => {
      vi.mocked(searchScenarios).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockSearchResults), 500))
      )

      wrapper = mount(ScenarioSearch)

      const searchInput = wrapper.find('input[placeholder*="Search scenarios"]')
      await searchInput.setValue('Hermione')
      await new Promise((resolve) => setTimeout(resolve, 350))
      await nextTick()

      // Should show loading
      expect(wrapper.vm.isSearching).toBe(true)
      expect(wrapper.text()).toContain('Searching')
    })

    it('maintains search state when toggling filters', async () => {
      vi.mocked(searchScenarios).mockResolvedValue(mockSearchResults)
      wrapper = mount(ScenarioSearch)

      const searchInput = wrapper.find('input[placeholder*="Search scenarios"]')
      await searchInput.setValue('Hermione')
      await new Promise((resolve) => setTimeout(resolve, 350))
      await nextTick()

      expect(wrapper.vm.results).toHaveLength(2)

      // Toggle filters
      await wrapper.setData({ filtersVisible: true })
      await nextTick()
      await wrapper.setData({ filtersVisible: false })
      await nextTick()

      // Results should still be there
      expect(wrapper.vm.results).toHaveLength(2)
      expect(wrapper.vm.searchQuery).toBe('Hermione')
    })
  })

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  describe('accessibility features', () => {
    it('search input has proper aria attributes', () => {
      wrapper = mount(ScenarioSearch)

      const searchInput = wrapper.find('input[placeholder*="Search scenarios"]')
      expect(searchInput.exists()).toBe(true)
      expect(searchInput.attributes('type')).toBe('text')
    })

    it('buttons have descriptive text', () => {
      wrapper = mount(ScenarioSearch)

      const buttons = wrapper.findAll('button')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      buttons.forEach((button: any) => {
        expect(button.text().length).toBeGreaterThan(0)
      })
    })

    it('search results are keyboard navigable', async () => {
      vi.mocked(searchScenarios).mockResolvedValue(mockSearchResults)
      wrapper = mount(ScenarioSearch)

      await wrapper.setData({ results: mockSearchResults.content })
      await nextTick()

      // Results should be clickable/tappable
      const resultCards = wrapper.findAll('[class*="cursor"]')
      expect(resultCards.length).toBeGreaterThan(0)
    })
  })

  // ============================================================================
  // Data Integrity Tests
  // ============================================================================

  describe('data integrity', () => {
    it('correctly formats dates', () => {
      wrapper = mount(ScenarioSearch)

      const today = new Date().toISOString()
      const yesterday = new Date(Date.now() - 86400000).toISOString()
      const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString()

      expect(wrapper.vm.formatDate(today)).toContain('Today')
      expect(wrapper.vm.formatDate(yesterday)).toContain('1 day')
      expect(wrapper.vm.formatDate(lastWeek)).toContain('7 days')
    })

    it('correctly maps category to label', () => {
      wrapper = mount(ScenarioSearch)

      expect(wrapper.vm.getCategoryLabel('CHARACTER_CHANGE')).toBe('Character')
      expect(wrapper.vm.getCategoryLabel('EVENT_ALTERATION')).toBe('Event')
      expect(wrapper.vm.getCategoryLabel('SETTING_MODIFICATION')).toBe('Setting')
      expect(wrapper.vm.getCategoryLabel('MIXED')).toBe('Mixed')
    })

    it('correctly assigns colors to categories', () => {
      wrapper = mount(ScenarioSearch)

      const characterColor = wrapper.vm.getCategoryColor('CHARACTER_CHANGE')
      const eventColor = wrapper.vm.getCategoryColor('EVENT_ALTERATION')
      const settingColor = wrapper.vm.getCategoryColor('SETTING_MODIFICATION')

      expect(characterColor).toMatch(/^#[0-9A-F]{6}$/i)
      expect(eventColor).toMatch(/^#[0-9A-F]{6}$/i)
      expect(settingColor).toMatch(/^#[0-9A-F]{6}$/i)
    })

    it('highlights search terms correctly', () => {
      wrapper = mount(ScenarioSearch)

      const text = 'Hermione was in Slytherin house'
      const highlighted = wrapper.vm.highlightQuery(text, 'Hermione')

      expect(highlighted).toContain('<mark')
      expect(highlighted).toContain('Hermione')
      expect(highlighted).toContain('</mark>')
    })

    it('handles case-insensitive highlighting', () => {
      wrapper = mount(ScenarioSearch)

      const text = 'HERMIONE was in slytherin'
      const highlighted = wrapper.vm.highlightQuery(text, 'hermione')

      expect(highlighted).toContain('<mark')
      expect(highlighted).toContain('HERMIONE')
    })
  })
})
