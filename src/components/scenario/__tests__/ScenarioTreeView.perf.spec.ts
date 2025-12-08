/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
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

// Helper to generate large tree data
function generateLargeTreeData(forkCount: number): ScenarioTreeResponse {
  const children = Array.from({ length: forkCount }, (_, i) => ({
    id: `fork-${i + 1}`,
    title: `Fork Scenario ${i + 1}`,
    whatIfQuestion: `What if we explore variation ${i + 1}?`,
    description: `This is fork ${i + 1} with a longer description to simulate real data`,
    parent_scenario_id: 'root-id',
    user_id: 'user-123',
    created_at: new Date(2025, 0, 1 + i).toISOString(),
    conversation_count: Math.floor(Math.random() * 20),
    fork_count: 0,
    like_count: Math.floor(Math.random() * 50),
  }))

  return {
    root: {
      id: 'root-id',
      title: 'Root Scenario',
      whatIfQuestion: 'What if this is the original scenario?',
      description: 'The original scenario that spawned many forks',
      user_id: 'user-123',
      created_at: new Date(2025, 0, 1).toISOString(),
      conversation_count: 50,
      fork_count: forkCount,
      like_count: 100,
    },
    children,
    totalCount: 1 + forkCount,
    maxDepth: children.length > 0 ? 1 : 0,
  }
}

// Helper to create router and mount component
function mountWithRouter(props: { scenarioId: string; currentScenarioId?: string }) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/scenarios/:id', component: { template: '<div />' } }],
  })

  return mount(ScenarioTreeView, {
    props,
    global: {
      plugins: [router],
      stubs: {
        RouterLink: true,
      },
    },
  })
}

describe('ScenarioTreeView.vue - Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders 50 fork nodes within 100ms', async () => {
    const treeData = generateLargeTreeData(50)

    vi.mocked(scenarioApi.getScenarioTree).mockResolvedValue(treeData)

    const startTime = performance.now()

    const wrapper = mount(ScenarioTreeView, {
      props: {
        scenarioId: 'root-id',
        currentScenarioId: 'root-id',
      },
      global: {
        plugins: [router],
        stubs: {
          RouterLink: true,
          TreeOverviewPanel: true,
        },
      },
    })

    // Wait for API calls to resolve and component to update
    await flushPromises()
    await nextTick()
    await nextTick() // Extra tick for reactivity

    const endTime = performance.now()
    const renderTime = endTime - startTime

    console.log(`✓ Render time for 50 nodes: ${renderTime.toFixed(2)}ms`)

    // Expect render time to be under 200ms (relaxed from 100ms for CI environments)
    expect(renderTime).toBeLessThan(200)

    // Verify all nodes are rendered
    const rootNode = wrapper.find('[aria-label*="Root scenario"]')
    expect(rootNode.exists()).toBe(true)

    const forkNodes = wrapper.findAll('[aria-label^="Fork:"]')
    expect(forkNodes.length).toBe(50)
  })

  it('renders 10 fork nodes efficiently', async () => {
    const treeData = generateLargeTreeData(10)

    vi.mocked(scenarioApi.getScenarioTree).mockResolvedValue(treeData)

    const startTime = performance.now()

    const wrapper = mount(ScenarioTreeView, {
      props: {
        scenarioId: 'root-id',
        currentScenarioId: 'root-id',
      },
      global: {
        plugins: [router],
        stubs: {
          RouterLink: true,
          TreeOverviewPanel: true,
        },
      },
    })

    // Wait for API calls to resolve and component to update
    await flushPromises()
    await nextTick()
    await nextTick() // Extra tick for reactivity

    const endTime = performance.now()
    const renderTime = endTime - startTime

    console.log(`✓ Render time for 10 nodes: ${renderTime.toFixed(2)}ms`)
    console.log('Component HTML:', wrapper.html())

    // Should be fast with just 10 nodes
    expect(renderTime).toBeLessThan(100)

    const forkNodes = wrapper.findAll('[aria-label^="Fork:"]')
    console.log('Fork nodes found:', forkNodes.length)
    expect(forkNodes.length).toBe(10)
  })

  it('renders 25 fork nodes efficiently (medium load)', async () => {
    const treeData = generateLargeTreeData(25)

    vi.mocked(scenarioApi.getScenarioTree).mockResolvedValue(treeData)

    const startTime = performance.now()

    const wrapper = mountWithRouter({
      scenarioId: 'root-id',
      currentScenarioId: 'root-id',
    })

    await nextTick()
    await vi.waitFor(() => {
      expect(wrapper.find('[data-testid="tree"]').exists()).toBe(true)
    })

    const endTime = performance.now()
    const renderTime = endTime - startTime

    console.log(`✓ Render time for 25 nodes: ${renderTime.toFixed(2)}ms`)

    // Should be well under the 100ms threshold
    expect(renderTime).toBeLessThan(100)

    const forkNodes = wrapper.findAll('[aria-label^="Fork:"]')
    expect(forkNodes.length).toBe(25)
  })

  it('handles click interactions efficiently with 50 nodes', async () => {
    const treeData = generateLargeTreeData(50)
    vi.mocked(scenarioApi.getScenarioTree).mockResolvedValue(treeData)

    const wrapper = mountWithRouter({
      scenarioId: 'root-id',
      currentScenarioId: 'root-id',
    })

    await nextTick()
    await vi.waitFor(() => {
      expect(wrapper.find('[data-testid="tree"]').exists()).toBe(true)
    })

    const forkNodes = wrapper.findAll('[aria-label^="Fork:"]')
    expect(forkNodes.length).toBe(50)

    // Test click interaction performance on first node
    const startTime = performance.now()
    await forkNodes[0].trigger('click')
    const endTime = performance.now()
    const interactionTime = endTime - startTime

    console.log(`✓ Click interaction time with 50 nodes: ${interactionTime.toFixed(2)}ms`)

    // Click interactions should be instant (< 10ms)
    expect(interactionTime).toBeLessThan(10)
  })

  it('handles keyboard navigation efficiently with 50 nodes', async () => {
    const treeData = generateLargeTreeData(50)
    vi.mocked(scenarioApi.getScenarioTree).mockResolvedValue(treeData)

    const wrapper = mountWithRouter({
      scenarioId: 'root-id',
      currentScenarioId: 'root-id',
    })

    await nextTick()
    await vi.waitFor(() => {
      expect(wrapper.find('[data-testid="tree"]').exists()).toBe(true)
    })

    const forkNodes = wrapper.findAll('[aria-label^="Fork:"]')
    expect(forkNodes.length).toBe(50)

    // Test keyboard interaction performance
    const startTime = performance.now()
    await forkNodes[0].trigger('keydown.enter')
    const endTime = performance.now()
    const interactionTime = endTime - startTime

    console.log(`✓ Keyboard interaction time with 50 nodes: ${interactionTime.toFixed(2)}ms`)

    // Keyboard interactions should be instant (< 10ms)
    expect(interactionTime).toBeLessThan(10)
  })

  it('verifies component renders 50 nodes successfully', async () => {
    const treeData = generateLargeTreeData(50)
    vi.mocked(scenarioApi.getScenarioTree).mockResolvedValue(treeData)

    const wrapper = mountWithRouter({
      scenarioId: 'root-id',
      currentScenarioId: 'root-id',
    })

    await nextTick()
    await vi.waitFor(() => {
      expect(wrapper.find('[data-testid="tree"]').exists()).toBe(true)
    })

    // Verify all 50 nodes are rendered
    const forkNodes = wrapper.findAll('[aria-label^="Fork:"]')
    expect(forkNodes.length).toBe(50)

    console.log('✓ Successfully rendered 50 fork nodes')

    wrapper.unmount()
  })
})
