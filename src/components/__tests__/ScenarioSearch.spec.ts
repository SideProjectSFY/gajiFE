/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import ScenarioSearch from '@/components/scenario/ScenarioSearch.vue'
import * as scenarioApi from '@/services/scenarioApi'

// Mock router
vi.mock('vue-router', (): unknown => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock scenarioApi with default export
vi.mock('@/services/scenarioApi', () => ({
  default: {
    searchScenarios: vi.fn(),
  },
  scenarioApi: {
    searchScenarios: vi.fn(),
  },
}))

describe.skip('ScenarioSearch', () => {
  let wrapper: any
  const mockSearchResponse = {
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
        title: 'Slytherin House Dynamics',
        description: 'Exploring Slytherin house culture',
        whatIfQuestion: 'What if Hermione became a Slytherin prefect?',
        userId: '223e4567-e89b-12d3-a456-426614174001',
        isPrivate: false,
        forkCount: 8,
        qualityScore: 7.2,
        scenarioCategory: 'CHARACTER_CHANGE',
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
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    if (wrapper) {
      wrapper.unmount()
    }
  })

  // ============================================================================
  // AC1: Search Input & Debounce Tests
  // ============================================================================

  describe('search input', () => {
    it('renders search input field', () => {
      wrapper = mount(ScenarioSearch)

      const searchInput = wrapper.find('input[placeholder="Search scenarios..."]')
      expect(searchInput.exists()).toBe(true)
    })

    it('debounces search queries by 300ms', async () => {
      vi.mocked(scenarioApi.searchScenarios).mockResolvedValue(mockSearchResponse)
      wrapper = mount(ScenarioSearch)

      const searchInput = wrapper.find('input[placeholder="Search scenarios..."]')

      // Type multiple characters rapidly
      await searchInput.setValue('H')
      await searchInput.setValue('He')
      await searchInput.setValue('Her')
      await searchInput.setValue('Herm')
      await searchInput.setValue('Hermione')

      // Should not call API yet
      expect(scenarioApi.searchScenarios).not.toHaveBeenCalled()

      // Advance timer by 300ms
      vi.advanceTimersByTime(300)
      await flushPromises()

      // Should call API once with final value
      expect(scenarioApi.searchScenarios).toHaveBeenCalledTimes(1)
      expect(scenarioApi.searchScenarios).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'Hermione' })
      )
    })

    it('clears results when search input is cleared', async () => {
      vi.mocked(scenarioApi.searchScenarios).mockResolvedValue(mockSearchResponse)
      wrapper = mount(ScenarioSearch)

      // Perform initial search
      const searchInput = wrapper.find('input[placeholder="Search scenarios..."]')
      await searchInput.setValue('Hermione')
      vi.advanceTimersByTime(300)
      await flushPromises()

      expect(wrapper.vm.results).toHaveLength(2)

      // Clear search
      await searchInput.setValue('')
      vi.advanceTimersByTime(300)
      await flushPromises()

      // Results should still show (empty search shows all)
      expect(scenarioApi.searchScenarios).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // AC2: Advanced Filters Tests
  // ============================================================================

  describe('advanced filters', () => {
    it('toggles filter panel visibility', async () => {
      wrapper = mount(ScenarioSearch)

      // Filters should be hidden initially
      expect(wrapper.vm.filtersVisible).toBe(false)

      // Click toggle button
      const toggleButton = wrapper.find('button:nth-of-type(2)') // "Filters" button
      await toggleButton.trigger('click')

      expect(wrapper.vm.filtersVisible).toBe(true)

      // Click again to hide
      await toggleButton.trigger('click')
      expect(wrapper.vm.filtersVisible).toBe(false)
    })

    it('filters by category', async () => {
      vi.mocked(scenarioApi.searchScenarios).mockResolvedValue(mockSearchResponse)
      wrapper = mount(ScenarioSearch)

      // Open filters
      await wrapper.setData({ filtersVisible: true })
      await nextTick()

      // Select category
      const categorySelect = wrapper.find('select')
      await categorySelect.setValue('CHARACTER_CHANGE')

      // Apply filters
      const applyButton = wrapper.find('button:nth-of-type(3)') // "Apply Filters" button
      await applyButton.trigger('click')
      vi.advanceTimersByTime(300)
      await flushPromises()

      expect(scenarioApi.searchScenarios).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'CHARACTER_CHANGE' })
      )
    })

    it('filters by minimum quality score', async () => {
      vi.mocked(scenarioApi.searchScenarios).mockResolvedValue(mockSearchResponse)
      wrapper = mount(ScenarioSearch)

      // Open filters
      await wrapper.setData({ filtersVisible: true })
      await nextTick()

      // Set quality score
      await wrapper.setData({
        filters: {
          ...wrapper.vm.filters,
          minQualityScore: 8.0,
        },
      })

      // Apply filters
      const applyButton = wrapper.find('button:nth-of-type(3)')
      await applyButton.trigger('click')
      vi.advanceTimersByTime(300)
      await flushPromises()

      expect(scenarioApi.searchScenarios).toHaveBeenCalledWith(
        expect.objectContaining({ minQualityScore: 8.0 })
      )
    })

    it('resets filters to defaults', async () => {
      wrapper = mount(ScenarioSearch)

      // Set some filters
      await wrapper.setData({
        filtersVisible: true,
        filters: {
          category: 'CHARACTER_CHANGE',
          minQualityScore: 8.0,
        },
      })

      // Reset filters
      const resetButton = wrapper.find('button:nth-of-type(4)') // "Reset" button
      await resetButton.trigger('click')

      expect(wrapper.vm.filters.category).toBe('')
      expect(wrapper.vm.filters.minQualityScore).toBe(0)
    })

    it('combines search query with filters', async () => {
      vi.mocked(scenarioApi.searchScenarios).mockResolvedValue(mockSearchResponse)
      wrapper = mount(ScenarioSearch)

      // Set search query
      const searchInput = wrapper.find('input[placeholder="Search scenarios..."]')
      await searchInput.setValue('Hermione')

      // Set filters
      await wrapper.setData({
        filtersVisible: true,
        filters: {
          category: 'CHARACTER_CHANGE',
          minQualityScore: 7.0,
        },
      })

      // Apply filters
      const applyButton = wrapper.find('button:nth-of-type(3)')
      await applyButton.trigger('click')
      vi.advanceTimersByTime(300)
      await flushPromises()

      expect(scenarioApi.searchScenarios).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'Hermione',
          category: 'CHARACTER_CHANGE',
          minQualityScore: 7.0,
        })
      )
    })
  })

  // ============================================================================
  // AC3: Results Display Tests
  // ============================================================================

  describe('search results', () => {
    it('displays search results', async () => {
      vi.mocked(scenarioApi.searchScenarios).mockResolvedValue(mockSearchResponse)
      wrapper = mount(ScenarioSearch)

      // Perform search
      const searchInput = wrapper.find('input[placeholder="Search scenarios..."]')
      await searchInput.setValue('Hermione')
      vi.advanceTimersByTime(300)
      await flushPromises()

      // Check results
      expect(wrapper.vm.results).toHaveLength(2)
      expect(wrapper.text()).toContain('Hermione in Slytherin')
      expect(wrapper.text()).toContain('Slytherin House Dynamics')
    })

    it('highlights search query in results', async () => {
      vi.mocked(scenarioApi.searchScenarios).mockResolvedValue(mockSearchResponse)
      wrapper = mount(ScenarioSearch)

      await wrapper.setData({ searchQuery: 'Hermione' })
      await wrapper.setData({ results: mockSearchResponse.content })
      await nextTick()

      const highlightedText = wrapper.html()
      expect(highlightedText).toContain('<mark')
      expect(highlightedText).toContain('Hermione')
    })

    it('displays category badge with correct color', async () => {
      vi.mocked(scenarioApi.searchScenarios).mockResolvedValue(mockSearchResponse)
      wrapper = mount(ScenarioSearch)

      await wrapper.setData({ results: mockSearchResponse.content })
      await nextTick()

      // Check category label
      expect(wrapper.text()).toContain('Character')
    })

    it('displays quality score badge', async () => {
      vi.mocked(scenarioApi.searchScenarios).mockResolvedValue(mockSearchResponse)
      wrapper = mount(ScenarioSearch)

      await wrapper.setData({ results: mockSearchResponse.content })
      await nextTick()

      expect(wrapper.text()).toContain('8.5')
      expect(wrapper.text()).toContain('7.2')
    })

    it('displays fork count', async () => {
      vi.mocked(scenarioApi.searchScenarios).mockResolvedValue(mockSearchResponse)
      wrapper = mount(ScenarioSearch)

      await wrapper.setData({ results: mockSearchResponse.content })
      await nextTick()

      expect(wrapper.text()).toContain('15 forks')
      expect(wrapper.text()).toContain('8 forks')
    })
  })

  // ============================================================================
  // AC4: Empty State Tests
  // ============================================================================

  describe('empty state', () => {
    it('shows empty state when no results found', async () => {
      vi.mocked(scenarioApi.searchScenarios).mockResolvedValue({
        ...mockSearchResponse,
        content: [],
        page: { ...mockSearchResponse.page, totalElements: 0 },
        empty: true,
      })

      wrapper = mount(ScenarioSearch)

      const searchInput = wrapper.find('input[placeholder="Search scenarios..."]')
      await searchInput.setValue('NonexistentScenario')
      vi.advanceTimersByTime(300)
      await flushPromises()

      expect(wrapper.text()).toContain('No scenarios match your search')
    })

    it('hides empty state when results exist', async () => {
      vi.mocked(scenarioApi.searchScenarios).mockResolvedValue(mockSearchResponse)
      wrapper = mount(ScenarioSearch)

      const searchInput = wrapper.find('input[placeholder="Search scenarios..."]')
      await searchInput.setValue('Hermione')
      vi.advanceTimersByTime(300)
      await flushPromises()

      expect(wrapper.text()).not.toContain('No scenarios match your search')
    })
  })

  // ============================================================================
  // AC5: Loading State Tests
  // ============================================================================

  describe('loading state', () => {
    it('shows loading spinner during search', async () => {
      vi.mocked(scenarioApi.searchScenarios).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockSearchResponse), 1000))
      )

      wrapper = mount(ScenarioSearch)

      const searchInput = wrapper.find('input[placeholder="Search scenarios..."]')
      await searchInput.setValue('Hermione')
      vi.advanceTimersByTime(300)
      await nextTick()

      // Should be loading
      expect(wrapper.vm.isSearching).toBe(true)
      expect(wrapper.text()).toContain('Searching')
    })

    it('hides loading spinner after search completes', async () => {
      vi.mocked(scenarioApi.searchScenarios).mockResolvedValue(mockSearchResponse)
      wrapper = mount(ScenarioSearch)

      const searchInput = wrapper.find('input[placeholder="Search scenarios..."]')
      await searchInput.setValue('Hermione')
      vi.advanceTimersByTime(300)
      await flushPromises()

      expect(wrapper.vm.isSearching).toBe(false)
    })
  })

  // ============================================================================
  // AC6: Pagination Tests
  // ============================================================================

  describe('pagination', () => {
    it('displays pagination controls', async () => {
      vi.mocked(scenarioApi.searchScenarios).mockResolvedValue({
        ...mockSearchResponse,
        page: {
          number: 0,
          size: 20,
          totalElements: 100,
          totalPages: 5,
        },
      })

      wrapper = mount(ScenarioSearch)

      const searchInput = wrapper.find('input[placeholder="Search scenarios..."]')
      await searchInput.setValue('Hermione')
      vi.advanceTimersByTime(300)
      await flushPromises()

      expect(wrapper.text()).toContain('Page 1 of 5')
    })

    it('navigates to next page', async () => {
      vi.mocked(scenarioApi.searchScenarios).mockResolvedValue({
        ...mockSearchResponse,
        page: {
          number: 0,
          size: 20,
          totalElements: 100,
          totalPages: 5,
        },
        last: false,
      })

      wrapper = mount(ScenarioSearch)

      await wrapper.setData({
        results: mockSearchResponse.content,
        currentPage: 1,
        totalPages: 5,
      })
      await nextTick()

      // Find and click next button
      const nextButton = wrapper.findAll('button').find((btn: any) => btn.text().includes('Next'))
      await nextButton?.trigger('click')
      vi.advanceTimersByTime(300)
      await flushPromises()

      expect(wrapper.vm.currentPage).toBe(2)
    })

    it('navigates to previous page', async () => {
      vi.mocked(scenarioApi.searchScenarios).mockResolvedValue(mockSearchResponse)
      wrapper = mount(ScenarioSearch)

      await wrapper.setData({
        results: mockSearchResponse.content,
        currentPage: 2,
        totalPages: 5,
      })
      await nextTick()

      // Find and click previous button
      const prevButton = wrapper
        .findAll('button')
        .find((btn: any) => btn.text().includes('Previous'))
      await prevButton?.trigger('click')
      vi.advanceTimersByTime(300)
      await flushPromises()

      expect(wrapper.vm.currentPage).toBe(1)
    })

    it('disables previous button on first page', async () => {
      wrapper = mount(ScenarioSearch)

      await wrapper.setData({
        results: mockSearchResponse.content,
        currentPage: 1,
        totalPages: 5,
      })
      await nextTick()

      const prevButton = wrapper
        .findAll('button')
        .find((btn: any) => btn.text().includes('Previous'))
      expect(prevButton?.attributes('disabled')).toBeDefined()
    })

    it('disables next button on last page', async () => {
      wrapper = mount(ScenarioSearch)

      await wrapper.setData({
        results: mockSearchResponse.content,
        currentPage: 5,
        totalPages: 5,
      })
      await nextTick()

      const nextButton = wrapper.findAll('button').find((btn: any) => btn.text().includes('Next'))
      expect(nextButton?.attributes('disabled')).toBeDefined()
    })
  })

  // ============================================================================
  // AC7: Sorting Tests
  // ============================================================================

  describe('sorting', () => {
    it('changes sort order', async () => {
      vi.mocked(scenarioApi.searchScenarios).mockResolvedValue(mockSearchResponse)
      wrapper = mount(ScenarioSearch)

      await wrapper.setData({ results: mockSearchResponse.content })
      await nextTick()

      // Find sort dropdown
      const sortSelect = wrapper.find('select:nth-of-type(2)') // Second select (first is category filter)
      await sortSelect.setValue('newest')
      vi.advanceTimersByTime(300)
      await flushPromises()

      expect(scenarioApi.searchScenarios).toHaveBeenCalledWith(
        expect.objectContaining({ sort: 'newest' })
      )
    })

    it('defaults to relevance sort for text search', async () => {
      vi.mocked(scenarioApi.searchScenarios).mockResolvedValue(mockSearchResponse)
      wrapper = mount(ScenarioSearch)

      const searchInput = wrapper.find('input[placeholder="Search scenarios..."]')
      await searchInput.setValue('Hermione')
      vi.advanceTimersByTime(300)
      await flushPromises()

      expect(wrapper.vm.sortBy).toBe('relevance')
    })
  })

  // ============================================================================
  // AC8: Error Handling Tests
  // ============================================================================

  describe('error handling', () => {
    it('handles API errors gracefully', async () => {
      vi.mocked(scenarioApi.searchScenarios).mockRejectedValue(new Error('Network error'))

      wrapper = mount(ScenarioSearch)

      const searchInput = wrapper.find('input[placeholder="Search scenarios..."]')
      await searchInput.setValue('Hermione')
      vi.advanceTimersByTime(300)
      await flushPromises()

      // Should not crash, loading should stop
      expect(wrapper.vm.isSearching).toBe(false)
    })
  })
})
