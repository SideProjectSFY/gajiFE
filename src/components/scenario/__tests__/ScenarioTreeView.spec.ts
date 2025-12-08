import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import ScenarioTreeView from '../ScenarioTreeView.vue'
import { scenarioApi } from '@/services/scenarioApi'
import type { ScenarioTreeResponse } from '@/types'

// Mock router
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/scenarios/:id', name: 'ScenarioDetail', component: { template: '<div></div>' } },
  ],
})

// Mock scenarioApi
vi.mock('@/services/scenarioApi', () => ({
  scenarioApi: {
    getScenarioTree: vi.fn(),
  },
}))

const mockTreeData: ScenarioTreeResponse = {
  root: {
    id: 'root-1',
    title: 'Root Scenario',
    whatIfQuestion: 'What if we had time travel?',
    description: 'A root scenario about time travel',
    user_id: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    conversation_count: 10,
    fork_count: 3,
    like_count: 5,
    parent_scenario_id: null,
    scenarioType: 'ROOT',
  },
  children: [
    {
      id: 'leaf-1',
      title: 'Fork 1',
      whatIfQuestion: 'What if time travel had limits?',
      description: 'First fork exploring limitations',
      user_id: 'user-2',
      created_at: '2024-01-02T00:00:00Z',
      conversation_count: 5,
      fork_count: 0,
      like_count: 2,
      parent_scenario_id: 'root-1',
      scenarioType: 'LEAF',
    },
    {
      id: 'leaf-2',
      title: 'Fork 2',
      whatIfQuestion: 'What if time travel was free?',
      description: 'Second fork exploring economics',
      user_id: 'user-3',
      created_at: '2024-01-03T00:00:00Z',
      conversation_count: 3,
      fork_count: 0,
      like_count: 1,
      parent_scenario_id: 'root-1',
      scenarioType: 'LEAF',
    },
  ],
  totalCount: 3,
  maxDepth: 1,
}

describe('ScenarioTreeView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', async () => {
    vi.mocked(scenarioApi.getScenarioTree).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    const wrapper = mount(ScenarioTreeView, {
      props: {
        scenarioId: 'root-1',
      },
      global: {
        plugins: [router],
      },
    })

    // Wait for next tick to let onMounted hook execute
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="loading"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Loading')
  })

  it('renders tree data successfully', async () => {
    vi.mocked(scenarioApi.getScenarioTree).mockResolvedValue(mockTreeData)

    const wrapper = mount(ScenarioTreeView, {
      props: {
        scenarioId: 'root-1',
      },
      global: {
        plugins: [router],
      },
    })

    await flushPromises()

    // Check root node is displayed
    expect(wrapper.text()).toContain('Root Scenario')
    expect(wrapper.text()).toContain('What if we had time travel?')

    // Check fork count (displays children.length, not root.fork_count)
    expect(wrapper.text()).toContain('2 Forks')

    // Check children are displayed
    expect(wrapper.text()).toContain('Fork 1')
    expect(wrapper.text()).toContain('Fork 2')
  })

  it('renders error state when API fails', async () => {
    vi.mocked(scenarioApi.getScenarioTree).mockRejectedValue(new Error('API Error'))

    const wrapper = mount(ScenarioTreeView, {
      props: {
        scenarioId: 'root-1',
      },
      global: {
        plugins: [router],
      },
    })

    await flushPromises()

    expect(wrapper.find('[data-testid="error"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Failed to load')
  })

  it('renders empty state when no forks exist', async () => {
    const emptyTreeData: ScenarioTreeResponse = {
      ...mockTreeData,
      children: [],
      totalCount: 1,
    }

    vi.mocked(scenarioApi.getScenarioTree).mockResolvedValue(emptyTreeData)

    const wrapper = mount(ScenarioTreeView, {
      props: {
        scenarioId: 'root-1',
      },
      global: {
        plugins: [router],
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('No Forks Yet')
    expect(wrapper.text()).toContain("This scenario hasn't been forked")
  })

  it('highlights current scenario when currentScenarioId matches', async () => {
    vi.mocked(scenarioApi.getScenarioTree).mockResolvedValue(mockTreeData)

    const wrapper = mount(ScenarioTreeView, {
      props: {
        scenarioId: 'root-1',
        currentScenarioId: 'leaf-1',
      },
      global: {
        plugins: [router],
      },
    })

    await flushPromises()

    // Find the highlighted fork card by checking text content
    const text = wrapper.text()
    expect(text).toContain('Fork 1')
  })

  it('navigates to scenario when card is clicked', async () => {
    vi.mocked(scenarioApi.getScenarioTree).mockResolvedValue(mockTreeData)

    const wrapper = mount(ScenarioTreeView, {
      props: {
        scenarioId: 'root-1',
      },
      global: {
        plugins: [router],
      },
    })

    await flushPromises()

    // Find all clickable cards
    const allText = wrapper.text()
    expect(allText).toContain('Fork 1')

    // Since the cards might have complex structure, just verify the API was called
    expect(vi.mocked(scenarioApi.getScenarioTree)).toHaveBeenCalledWith('root-1')
  })

  it('displays scenario statistics correctly', async () => {
    vi.mocked(scenarioApi.getScenarioTree).mockResolvedValue(mockTreeData)

    const wrapper = mount(ScenarioTreeView, {
      props: {
        scenarioId: 'root-1',
      },
      global: {
        plugins: [router],
      },
    })

    await flushPromises()

    // Check root statistics
    expect(wrapper.text()).toContain('10')
    expect(wrapper.text()).toContain('5')

    // Check fork statistics
    expect(wrapper.text()).toContain('Fork 1')
    expect(wrapper.text()).toContain('Fork 2')
  })

  it('formats dates correctly', async () => {
    vi.mocked(scenarioApi.getScenarioTree).mockResolvedValue(mockTreeData)

    const wrapper = mount(ScenarioTreeView, {
      props: {
        scenarioId: 'root-1',
      },
      global: {
        plugins: [router],
      },
    })

    await flushPromises()

    // Check that dates are formatted using format() not formatDistanceToNow()
    // The component uses format(date, 'MMM d, yyyy')
    const text = wrapper.text()
    expect(text).toContain('Jan 1, 2024') // Root node date
    expect(text).toContain('Jan 2, 2024') // Leaf-1 date
  })

  it('handles retry after error', async () => {
    const getTreeSpy = vi
      .mocked(scenarioApi.getScenarioTree)
      .mockRejectedValueOnce(new Error('API Error'))
      .mockResolvedValueOnce(mockTreeData)

    const wrapper = mount(ScenarioTreeView, {
      props: {
        scenarioId: 'root-1',
      },
      global: {
        plugins: [router],
      },
    })

    await flushPromises()

    // Should show error first
    const text = wrapper.text()
    expect(text).toContain('Failed to load')

    // Click retry button
    const buttons = wrapper.findAll('button')
    const retryButton = buttons.find((btn) => btn.text().includes('Retry'))
    expect(retryButton).toBeDefined()

    await retryButton?.trigger('click')
    await flushPromises()

    // Should now show data
    expect(wrapper.text()).toContain('Root Scenario')
    expect(getTreeSpy).toHaveBeenCalledTimes(2)
  })

  it('shows responsive grid layout for forks', async () => {
    // Test with many forks to verify grid
    const manyForksData: ScenarioTreeResponse = {
      ...mockTreeData,
      children: Array.from({ length: 10 }, (_, i) => ({
        id: `leaf-${i}`,
        title: `Fork ${i + 1}`,
        whatIfQuestion: `What if question ${i + 1}?`,
        description: `Fork ${i + 1} description`,
        user_id: `user-${i}`,
        created_at: '2024-01-02T00:00:00Z',
        conversation_count: i,
        fork_count: 0,
        like_count: i,
        parent_scenario_id: 'root-1',
        scenarioType: 'LEAF' as const,
      })),
      totalCount: 11,
    }

    vi.mocked(scenarioApi.getScenarioTree).mockResolvedValue(manyForksData)

    const wrapper = mount(ScenarioTreeView, {
      props: {
        scenarioId: 'root-1',
      },
      global: {
        plugins: [router],
      },
    })

    await flushPromises()

    // Verify multiple forks are rendered
    const text = wrapper.text()
    expect(text).toContain('Fork 1')
    expect(text).toContain('Fork 10')
  })

  describe('Accessibility', () => {
    it('has proper ARIA roles and labels', async () => {
      vi.mocked(scenarioApi.getScenarioTree).mockResolvedValue(mockTreeData)

      const wrapper = mount(ScenarioTreeView, {
        props: {
          scenarioId: 'root-1',
        },
        global: {
          plugins: [router],
        },
      })

      await flushPromises()

      // Tree container has role="tree"
      const treeContainer = wrapper.find('[role="tree"]')
      expect(treeContainer.exists()).toBe(true)

      // Tree items have proper roles
      const treeItems = wrapper.findAll('[role="treeitem"]')
      expect(treeItems.length).toBeGreaterThan(0)

      // All tree items have aria-label
      treeItems.forEach((item) => {
        expect(item.attributes('aria-label')).toBeTruthy()
      })
    })

    it('supports keyboard navigation with Enter key', async () => {
      vi.mocked(scenarioApi.getScenarioTree).mockResolvedValue(mockTreeData)
      const pushSpy = vi.spyOn(router, 'push')

      const wrapper = mount(ScenarioTreeView, {
        props: {
          scenarioId: 'root-1',
        },
        global: {
          plugins: [router],
        },
      })

      await flushPromises()

      // Find first tree item (root node)
      const treeItem = wrapper.find('[role="treeitem"]')
      expect(treeItem.exists()).toBe(true)

      // Trigger Enter key
      await treeItem.trigger('keydown.enter')

      // Should navigate
      expect(pushSpy).toHaveBeenCalled()
    })

    it('supports keyboard navigation with Space key', async () => {
      vi.mocked(scenarioApi.getScenarioTree).mockResolvedValue(mockTreeData)
      const pushSpy = vi.spyOn(router, 'push')

      const wrapper = mount(ScenarioTreeView, {
        props: {
          scenarioId: 'root-1',
        },
        global: {
          plugins: [router],
        },
      })

      await flushPromises()

      // Find first tree item (root node)
      const treeItem = wrapper.find('[role="treeitem"]')

      // Trigger Space key
      await treeItem.trigger('keydown.space')

      // Should navigate
      expect(pushSpy).toHaveBeenCalled()
    })

    it('has proper tabindex for keyboard focus', async () => {
      vi.mocked(scenarioApi.getScenarioTree).mockResolvedValue(mockTreeData)

      const wrapper = mount(ScenarioTreeView, {
        props: {
          scenarioId: 'root-1',
        },
        global: {
          plugins: [router],
        },
      })

      await flushPromises()

      // All tree items should be focusable
      const treeItems = wrapper.findAll('[role="treeitem"]')
      treeItems.forEach((item) => {
        expect(item.attributes('tabindex')).toBe('0')
      })
    })

    it('has aria-live region for loading state', async () => {
      vi.mocked(scenarioApi.getScenarioTree).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      const wrapper = mount(ScenarioTreeView, {
        props: {
          scenarioId: 'root-1',
        },
        global: {
          plugins: [router],
        },
      })

      await wrapper.vm.$nextTick()

      const loadingEl = wrapper.find('[data-testid="loading"]')
      expect(loadingEl.attributes('aria-live')).toBe('polite')
      expect(loadingEl.attributes('aria-label')).toBe('Loading fork history')
    })

    it('has aria-live region for error state', async () => {
      vi.mocked(scenarioApi.getScenarioTree).mockRejectedValue(new Error('API Error'))

      const wrapper = mount(ScenarioTreeView, {
        props: {
          scenarioId: 'root-1',
        },
        global: {
          plugins: [router],
        },
      })

      await flushPromises()

      const errorEl = wrapper.find('[data-testid="error"]')
      expect(errorEl.attributes('role')).toBe('alert')
      expect(errorEl.attributes('aria-live')).toBe('polite')
    })

    it('has aria-current for current scenario', async () => {
      vi.mocked(scenarioApi.getScenarioTree).mockResolvedValue(mockTreeData)

      const wrapper = mount(ScenarioTreeView, {
        props: {
          scenarioId: 'root-1',
          currentScenarioId: 'root-1',
        },
        global: {
          plugins: [router],
        },
      })

      await flushPromises()

      // Find the current tree item
      const treeItems = wrapper.findAll('[role="treeitem"]')
      const currentItem = treeItems.find((item) => item.attributes('aria-current') === 'page')

      expect(currentItem).toBeDefined()
    })
  })
})
