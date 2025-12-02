import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, type VueWrapper, type DOMWrapper } from '@vue/test-utils'
import ScenarioSearch from '@/components/scenario/ScenarioSearch.vue'
import { scenarioApi } from '@/services/scenarioApi'

// Mock router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock scenarioApi
vi.mock('@/services/scenarioApi', () => ({
  scenarioApi: {
    searchScenarios: vi.fn(),
  },
}))

describe('ScenarioSearch - Story 3.6', () => {
  let wrapper: any

  const mockSearchResponse = {
    content: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        base_story: 'Harry Potter',
        scenario_preview: 'Hermione in Slytherin house',
        scenario_type: 'CHARACTER_CHANGE',
        fork_count: 15,
        creator_username: 'testuser',
        created_at: '2025-11-27T10:00:00',
      },
      {
        id: '223e4567-e89b-12d3-a456-426614174000',
        base_story: 'Game of Thrones',
        scenario_preview: 'Ned Stark survives',
        scenario_type: 'EVENT_ALTERATION',
        fork_count: 8,
        creator_username: 'anotheruser',
        created_at: '2025-11-26T10:00:00',
      },
    ],
    page: {
      totalElements: 2,
      totalPages: 1,
      size: 20,
      number: 0,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(scenarioApi.searchScenarios).mockResolvedValue(mockSearchResponse)
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('AC1: Search input with debounced query (300ms delay)', () => {
    it('should debounce search input by 300ms', async () => {
      vi.useFakeTimers()
      wrapper = mount(ScenarioSearch)
      await flushPromises()

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.setValue('Hermione')

      // Should not call immediately
      expect(scenarioApi.searchScenarios).toHaveBeenCalledTimes(1) // Initial mount call

      vi.advanceTimersByTime(200)
      await flushPromises()
      expect(scenarioApi.searchScenarios).toHaveBeenCalledTimes(1) // Still just initial

      vi.advanceTimersByTime(100) // Total 300ms
      await flushPromises()
      expect(scenarioApi.searchScenarios).toHaveBeenCalledTimes(2) // Now debounce triggered

      vi.useRealTimers()
    })

    it('should reset debounce timer on new input', async () => {
      vi.useFakeTimers()
      wrapper = mount(ScenarioSearch)
      await flushPromises()

      const searchInput = wrapper.find('input[type="text"]')

      await searchInput.setValue('H')
      vi.advanceTimersByTime(200)

      await searchInput.setValue('He')
      vi.advanceTimersByTime(200)

      await searchInput.setValue('Her')
      vi.advanceTimersByTime(300)
      await flushPromises()

      // Should only trigger once after final input
      expect(scenarioApi.searchScenarios).toHaveBeenCalledTimes(2) // Initial + debounced

      vi.useRealTimers()
    })
  })

  describe('AC2: Full-text search functionality', () => {
    it('should call search API with query parameter', async () => {
      wrapper = mount(ScenarioSearch)
      await flushPromises()

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.setValue('Hermione')

      await new Promise((resolve) => setTimeout(resolve, 350))
      await flushPromises()

      expect(scenarioApi.searchScenarios).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'Hermione',
        })
      )
    })

    it('should display search results', async () => {
      wrapper = mount(ScenarioSearch)
      await flushPromises()

      expect(wrapper.text()).toContain('2 scenarios found')
      expect(wrapper.text()).toContain('Hermione in Slytherin house')
      expect(wrapper.text()).toContain('Ned Stark survives')
    })
  })

  describe('AC3: Advanced filters', () => {
    it('should show/hide filters on button click', async () => {
      wrapper = mount(ScenarioSearch)
      await flushPromises()

      const filterButton = wrapper.find('button')
      expect(filterButton.text()).toContain('Show Filters')

      await filterButton.trigger('click')
      await flushPromises()

      expect(filterButton.text()).toContain('Hide Filters')
      expect(wrapper.html()).toContain('Scenario Category')
    })

    it('should apply category filter', async () => {
      wrapper = mount(ScenarioSearch)
      await flushPromises()

      const filterButton = wrapper.find('button')
      await filterButton.trigger('click')
      await flushPromises()

      const categorySelect = wrapper.find('select')
      await categorySelect.setValue('CHARACTER_CHANGE')

      const applyButton = wrapper
        .findAll('button')
        .find((btn: any) => btn.text().includes('Apply Filters'))
      await applyButton?.trigger('click')
      await flushPromises()

      expect(scenarioApi.searchScenarios).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'CHARACTER_CHANGE',
        })
      )
    })

    it('should reset filters', async () => {
      wrapper = mount(ScenarioSearch)
      await flushPromises()

      const filterButton = wrapper.find('button')
      await filterButton.trigger('click')
      await flushPromises()

      const categorySelect = wrapper.find('select')
      await categorySelect.setValue('CHARACTER_CHANGE')

      const resetButton = wrapper.findAll('button').find((btn: any) => btn.text().includes('Reset'))
      await resetButton?.trigger('click')
      await flushPromises()

      expect(categorySelect.element.value).toBe('')
    })
  })

  describe('AC4: Search results pagination', () => {
    it('should display pagination controls when multiple pages exist', async () => {
      const multiPageResponse = {
        ...mockSearchResponse,
        page: {
          totalElements: 50,
          totalPages: 3,
          size: 20,
          number: 0,
        },
      }
      vi.mocked(scenarioApi.searchScenarios).mockResolvedValue(multiPageResponse)

      wrapper = mount(ScenarioSearch)
      await flushPromises()

      expect(wrapper.text()).toContain('Page 1 of 3')

      // Find buttons by text content
      const buttons = wrapper.findAll('button')
      const prevButton = buttons.find((btn: any) => btn.text().includes('Previous'))
      const nextButton = buttons.find((btn: any) => btn.text().includes('Next'))

      expect(prevButton).toBeDefined()
      expect(nextButton).toBeDefined()
    })

    it('should navigate to next page', async () => {
      const multiPageResponse = {
        ...mockSearchResponse,
        page: {
          totalElements: 50,
          totalPages: 3,
          size: 20,
          number: 0,
        },
      }
      vi.mocked(scenarioApi.searchScenarios).mockResolvedValue(multiPageResponse)

      wrapper = mount(ScenarioSearch)
      await flushPromises()

      const nextButton = wrapper.findAll('button').find((btn: any) => btn.text().includes('Next'))
      await nextButton?.trigger('click')
      await flushPromises()

      expect(scenarioApi.searchScenarios).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
        })
      )
    })

    it('should disable Previous button on first page', async () => {
      const multiPageResponse = {
        ...mockSearchResponse,
        page: {
          totalElements: 50,
          totalPages: 3,
          size: 20,
          number: 0,
        },
      }
      vi.mocked(scenarioApi.searchScenarios).mockResolvedValue(multiPageResponse)

      wrapper = mount(ScenarioSearch)
      await flushPromises()

      const prevButton = wrapper
        .findAll('button')
        .find((btn: any) => btn.text().includes('Previous'))
      expect(prevButton?.element.disabled).toBe(true)
    })
  })

  describe('AC5: Empty state', () => {
    it('should show empty state when no results', async () => {
      const emptyResponse = {
        content: [],
        page: {
          totalElements: 0,
          totalPages: 0,
          size: 20,
          number: 0,
        },
      }
      vi.mocked(scenarioApi.searchScenarios).mockResolvedValue(emptyResponse)

      wrapper = mount(ScenarioSearch)
      await flushPromises()

      expect(wrapper.text()).toContain('No scenarios match your search')
      expect(wrapper.text()).toContain('Try different keywords or adjust your filters')
    })
  })

  describe('AC6: Search query highlighting', () => {
    it('should highlight search query in results', async () => {
      wrapper = mount(ScenarioSearch)
      await flushPromises()

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.setValue('Hermione')

      await new Promise((resolve) => setTimeout(resolve, 350))
      await flushPromises()

      // Check if mark tag is present for highlighting
      expect(wrapper.html()).toContain('<mark')
    })
  })

  describe('AC7: Sort functionality', () => {
    it('should change sort order', async () => {
      wrapper = mount(ScenarioSearch)
      await flushPromises()

      const sortSelect = wrapper
        .findAll('select')
        .find((select: any) => select.html().includes('Most Relevant'))
      await sortSelect?.setValue('newest')
      await flushPromises()

      expect(scenarioApi.searchScenarios).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: 'newest',
        })
      )
    })
  })

  describe('AC8: Loading state', () => {
    it('should show loading spinner during search', async () => {
      vi.mocked(scenarioApi.searchScenarios).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockSearchResponse), 1000))
      )

      wrapper = mount(ScenarioSearch)

      // Check immediately before promise resolves
      expect(wrapper.html()).toContain('Searching...')

      await flushPromises()
    })
  })

  describe('AC9: Navigation to scenario detail', () => {
    it('should navigate to scenario detail on card click', async () => {
      wrapper = mount(ScenarioSearch)
      await flushPromises()

      // Find all clickable divs and locate the scenario card by its unique text
      const allDivs = wrapper.findAll('div')
      const scenarioCard = allDivs.find(
        (div) =>
          div.text().includes('Hermione in Slytherin house') &&
          div.attributes('class')?.includes('cursor')
      )

      expect(scenarioCard).toBeDefined()

      await scenarioCard?.trigger('click')
      await flushPromises()

      expect(mockPush).toHaveBeenCalledWith('/scenarios/123e4567-e89b-12d3-a456-426614174000')
    })
  })

  describe('AC10: Category badges', () => {
    it('should display correct category labels and colors', async () => {
      wrapper = mount(ScenarioSearch)
      await flushPromises()

      expect(wrapper.text()).toContain('Character')
      expect(wrapper.text()).toContain('Event')
    })
  })

  describe('Error handling', () => {
    it('should handle search API errors gracefully', async () => {
      vi.mocked(scenarioApi.searchScenarios).mockRejectedValue(new Error('Network error'))

      // Mock alert
      globalThis.alert = vi.fn()

      wrapper = mount(ScenarioSearch)
      await flushPromises()

      expect(globalThis.alert).toHaveBeenCalledWith('Search failed. Please try again.')
    })
  })

  describe('Date formatting', () => {
    it('should format dates correctly', async () => {
      wrapper = mount(ScenarioSearch)
      await flushPromises()

      // Should show relative dates like "X days ago"
      expect(wrapper.html()).toMatch(/(Today|Yesterday|\d+ days ago|\d+ weeks ago)/)
    })
  })
})
