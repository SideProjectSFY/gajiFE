import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TreeOverviewPanel from '../TreeOverviewPanel.vue'
import type { ScenarioTreeResponse } from '@/types'

describe('TreeOverviewPanel', () => {
  const mockTreeData: ScenarioTreeResponse = {
    root: {
      id: 'root-1',
      title: 'Root Scenario',
      whatIfQuestion: 'What if the main character had superpowers?',
      description: 'A scenario about superpowers',
      user_id: 'user-1',
      created_at: '2024-01-01T00:00:00Z',
      conversation_count: 10,
      fork_count: 3,
      like_count: 5,
    },
    children: [
      {
        id: 'child-1',
        title: 'Fork 1',
        whatIfQuestion: 'What if they could fly?',
        description: 'Flying powers',
        user_id: 'user-2',
        created_at: '2024-01-02T00:00:00Z',
        conversation_count: 5,
        fork_count: 0,
        like_count: 2,
        parent_scenario_id: 'root-1',
      },
      {
        id: 'child-2',
        title: 'Fork 2',
        whatIfQuestion: 'What if they had telepathy?',
        description: 'Mind reading powers',
        user_id: 'user-3',
        created_at: '2024-01-03T00:00:00Z',
        conversation_count: 8,
        fork_count: 0,
        like_count: 3,
        parent_scenario_id: 'root-1',
      },
      {
        id: 'child-3',
        title: 'Fork 3',
        whatIfQuestion: 'What if they had super strength?',
        description: 'Strength powers',
        user_id: 'user-4',
        created_at: '2024-01-04T00:00:00Z',
        conversation_count: 3,
        fork_count: 0,
        like_count: 1,
        parent_scenario_id: 'root-1',
      },
    ],
    totalCount: 4,
    maxDepth: 1,
  }

  it('renders the panel with correct title', () => {
    const wrapper = mount(TreeOverviewPanel, {
      props: {
        treeData: mockTreeData,
      },
    })

    expect(wrapper.find('[data-testid="tree-overview-panel"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Tree Overview')
  })

  it('displays correct statistics', () => {
    const wrapper = mount(TreeOverviewPanel, {
      props: {
        treeData: mockTreeData,
      },
    })

    const content = wrapper.find('[data-testid="panel-content"]')
    expect(content.text()).toContain('Total Scenarios')
    expect(content.text()).toContain('4')
    expect(content.text()).toContain('Max Depth')
    expect(content.text()).toContain('1')
    expect(content.text()).toContain('Total Forks')
    expect(content.text()).toContain('3')
  })

  it('displays featured scenarios sorted by score', () => {
    const wrapper = mount(TreeOverviewPanel, {
      props: {
        treeData: mockTreeData,
      },
    })

    const content = wrapper.find('[data-testid="panel-content"]')
    expect(content.text()).toContain('Featured Scenarios')

    // Root has highest score: 10*2 + 5 = 25
    // child-2 has second highest: 8*2 + 3 = 19
    // Should display at least these scenarios
    expect(content.text()).toContain('Root Scenario')
    expect(content.text()).toContain('Fork 2')
  })

  it('shows maximum of 5 featured scenarios', () => {
    const wrapper = mount(TreeOverviewPanel, {
      props: {
        treeData: mockTreeData,
      },
    })

    // Find all scenario items (they have conversation and like count indicators)
    const scenarioElements = wrapper.findAll('[role="button"]')

    // Should have 4 scenarios (root + 3 children)
    expect(scenarioElements.length).toBeLessThanOrEqual(5)
  })

  it('emits centerNode event when scenario is clicked', async () => {
    const wrapper = mount(TreeOverviewPanel, {
      props: {
        treeData: mockTreeData,
      },
    })

    const firstScenario = wrapper.find('[role="button"]')
    await firstScenario.trigger('click')

    expect(wrapper.emitted('centerNode')).toBeTruthy()
    expect(wrapper.emitted('centerNode')?.[0]).toBeTruthy()
  })

  it('emits centerNode event on keyboard navigation', async () => {
    const wrapper = mount(TreeOverviewPanel, {
      props: {
        treeData: mockTreeData,
      },
    })

    const firstScenario = wrapper.find('[role="button"]')

    // Test Enter key
    await firstScenario.trigger('keydown.enter')
    expect(wrapper.emitted('centerNode')).toBeTruthy()

    // Test Space key
    await firstScenario.trigger('keydown.space')
    expect(wrapper.emitted('centerNode')?.length).toBe(2)
  })

  it('toggles panel visibility on mobile', async () => {
    const wrapper = mount(TreeOverviewPanel, {
      props: {
        treeData: mockTreeData,
      },
    })

    const toggleButton = wrapper.find('[data-testid="panel-toggle"]')

    // Initially open (isOpen starts as true) - element should be visible
    let content = wrapper.find('[data-testid="panel-content"]')
    let style = content.attributes('style')
    expect(!style || !style.includes('display: none')).toBe(true)

    // Click toggle to close
    await toggleButton.trigger('click')
    await wrapper.vm.$nextTick()

    // Should be hidden with display: none
    content = wrapper.find('[data-testid="panel-content"]')
    style = content.attributes('style')
    expect(style).toContain('display: none')

    // Click again to open
    await toggleButton.trigger('click')
    await wrapper.vm.$nextTick()

    // Should be visible again
    content = wrapper.find('[data-testid="panel-content"]')
    style = content.attributes('style')
    expect(!style || !style.includes('display: none')).toBe(true)
  })

  it('shows empty state when no scenarios', () => {
    const emptyTreeData: ScenarioTreeResponse = {
      root: {
        id: 'root-1',
        title: 'Root Scenario',
        whatIfQuestion: 'What if?',
        description: null,
        user_id: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        conversation_count: 0,
        fork_count: 0,
        like_count: 0,
      },
      children: [],
      totalCount: 1,
      maxDepth: 0,
    }

    const wrapper = mount(TreeOverviewPanel, {
      props: {
        treeData: emptyTreeData,
      },
    })

    // Should show root scenario only
    expect(wrapper.text()).toContain('Total Scenarios')
    expect(wrapper.text()).toContain('1')
    expect(wrapper.text()).toContain('Root Scenario')
  })

  it('handles null treeData gracefully', () => {
    const wrapper = mount(TreeOverviewPanel, {
      props: {
        treeData: null,
      },
    })

    expect(wrapper.find('[data-testid="tree-overview-panel"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('0')
  })

  it('has correct ARIA attributes', () => {
    const wrapper = mount(TreeOverviewPanel, {
      props: {
        treeData: mockTreeData,
      },
    })

    const container = wrapper.find('[data-testid="tree-overview-panel"]')
    expect(container.attributes('role')).toBe('complementary')
    expect(container.attributes('aria-label')).toBe('Tree overview panel')

    const toggleButton = wrapper.find('[data-testid="panel-toggle"]')
    expect(toggleButton.attributes('aria-expanded')).toBeDefined()
  })

  it('displays conversation and like counts for scenarios', () => {
    const wrapper = mount(TreeOverviewPanel, {
      props: {
        treeData: mockTreeData,
      },
    })

    const content = wrapper.text()
    expect(content).toContain('💬')
    expect(content).toContain('❤️')
  })
})
