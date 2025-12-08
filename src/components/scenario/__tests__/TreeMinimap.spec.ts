import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TreeMinimap from '../TreeMinimap.vue'
import type { ScenarioTreeResponse } from '@/types'

describe('TreeMinimap', () => {
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
        conversation_count: 3,
        fork_count: 0,
        like_count: 1,
        parent_scenario_id: 'root-1',
      },
    ],
    totalCount: 3,
    maxDepth: 1,
  }

  const defaultProps = {
    treeData: mockTreeData,
    viewportWidth: 800,
    viewportHeight: 600,
    panX: 0,
    panY: 0,
    zoom: 1,
    treeWidth: 1000,
    treeHeight: 800,
  }

  beforeEach(() => {
    // Mock window size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    })
  })

  it('renders minimap when visible', () => {
    const wrapper = mount(TreeMinimap, {
      props: defaultProps,
    })

    expect(wrapper.find('[data-testid="tree-minimap"]').exists()).toBe(true)
    expect(wrapper.find('canvas').exists()).toBe(true)
  })

  it('renders toggle button', () => {
    const wrapper = mount(TreeMinimap, {
      props: defaultProps,
    })

    const toggleButton = wrapper.find('[data-testid="minimap-toggle"]')
    expect(toggleButton.exists()).toBe(true)
    expect(toggleButton.attributes('aria-label')).toBe('Hide minimap')
  })

  it('toggles visibility when toggle button is clicked', async () => {
    const wrapper = mount(TreeMinimap, {
      props: defaultProps,
    })

    // Initial state - visible
    expect(wrapper.find('[data-testid="tree-minimap"]').exists()).toBe(true)

    // Click toggle button
    await wrapper.find('[data-testid="minimap-toggle"]').trigger('click')

    // Should be hidden
    expect(wrapper.find('[data-testid="tree-minimap"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="minimap-show"]').exists()).toBe(true)

    // Click show button
    await wrapper.find('[data-testid="minimap-show"]').trigger('click')

    // Should be visible again
    expect(wrapper.find('[data-testid="tree-minimap"]').exists()).toBe(true)
  })

  it('emits pan event when canvas is dragged', async () => {
    const wrapper = mount(TreeMinimap, {
      props: defaultProps,
    })

    const canvas = wrapper.find('canvas')

    // Simulate mousedown
    await canvas.trigger('mousedown', {
      clientX: 75,
      clientY: 75,
    })

    // Emit should be called
    expect(wrapper.emitted('pan')).toBeTruthy()
  })

  it('emits jump event when canvas is clicked', async () => {
    const wrapper = mount(TreeMinimap, {
      props: defaultProps,
    })

    const canvas = wrapper.find('canvas')

    // Simulate click
    await canvas.trigger('click', {
      clientX: 75,
      clientY: 75,
    })

    // Emit should be called
    expect(wrapper.emitted('jump')).toBeTruthy()
  })

  it('renders canvas with correct dimensions', () => {
    const wrapper = mount(TreeMinimap, {
      props: defaultProps,
    })

    const canvas = wrapper.find('canvas')
    expect(canvas.attributes('width')).toBe('150')
    expect(canvas.attributes('height')).toBe('150')
  })

  it('does not render minimap container when treeData is null', () => {
    const wrapper = mount(TreeMinimap, {
      props: {
        ...defaultProps,
        treeData: null,
      },
    })

    // When treeData is null, neither minimap nor show button should render
    expect(wrapper.find('[data-testid="tree-minimap"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="minimap-show"]').exists()).toBe(false)
  })

  it('has correct ARIA attributes', () => {
    const wrapper = mount(TreeMinimap, {
      props: defaultProps,
    })

    const container = wrapper.find('[data-testid="tree-minimap"]')
    expect(container.attributes('role')).toBe('complementary')
    expect(container.attributes('aria-label')).toBe('Tree minimap')
  })
})
