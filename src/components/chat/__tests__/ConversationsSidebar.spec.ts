import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'

// Mock router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Home', component: { template: '<div>Home</div>' } },
    {
      path: '/conversations/:id',
      name: 'ConversationChat',
      component: { template: '<div>Chat</div>' },
    },
    { path: '/scenarios', name: 'Scenarios', component: { template: '<div>Scenarios</div>' } },
  ],
})

describe('ConversationsSidebar', () => {
  let ConversationsSidebar: any

  beforeEach(async () => {
    vi.resetModules()
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // Mock services using doMock
    vi.doMock('@/services/conversationApi', () => ({
      listConversations: vi.fn().mockResolvedValue([
        {
          id: 'conv1',
          scenarioId: 'scen1',
          title: 'Test Conversation',
          updatedAt: '2023-01-01T12:00:00Z',
          messageCount: 5,
          isRoot: true,
        },
      ]),
    }))

    vi.doMock('@/services/scenarioApi', () => ({
      scenarioApi: {
        getScenario: vi.fn().mockResolvedValue({
          id: 'scen1',
          title: 'Test Scenario',
          whatIfQuestion: 'What if?',
          bookTitle: 'Test Book',
        }),
      },
    }))

    // Import component dynamically after mocks are set
    const module = await import('../ConversationsSidebar.vue')
    ConversationsSidebar = module.default
  })

  it('renders when visible', () => {
    const wrapper = mount(ConversationsSidebar, {
      props: { visible: true },
      global: {
        plugins: [router, createPinia()],
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.find('[data-testid="conversations-sidebar"]').exists()).toBe(true)
  })

  it('does not render when not visible', () => {
    const wrapper = mount(ConversationsSidebar, {
      props: { visible: false },
      global: {
        plugins: [router, createPinia()],
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.find('[data-testid="conversations-sidebar"]').exists()).toBe(false)
  })

  it('emits update:visible when close button is clicked', async () => {
    const wrapper = mount(ConversationsSidebar, {
      props: { visible: true },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    })

    await wrapper.find('button[aria-label="사이드바 닫기"]').trigger('click')

    expect(wrapper.emitted('update:visible')).toBeTruthy()
    expect(wrapper.emitted('update:visible')?.[0]).toEqual([false])
  })

  it('displays conversations list', async () => {
    const wrapper = mount(ConversationsSidebar, {
      props: { visible: true },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    })

    // Wait for loading to complete
    await flushPromises()
    // Wait a bit more for any internal promises
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Should show conversation items after loading (using semantic <li> elements)
    const items = wrapper.findAll('li')
    expect(items.length).toBeGreaterThan(0)
  })

  it('has proper accessibility attributes', () => {
    const wrapper = mount(ConversationsSidebar, {
      props: { visible: true },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    })

    const sidebar = wrapper.find('[data-testid="conversations-sidebar"]')
    expect(sidebar.attributes('role')).toBe('dialog')
    expect(sidebar.attributes('aria-modal')).toBe('true')
    expect(sidebar.attributes('aria-labelledby')).toBe('sidebar-title')
  })

  it('supports keyboard navigation', async () => {
    const wrapper = mount(ConversationsSidebar, {
      props: { visible: true },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    })

    // Wait for loading
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 400))
    await wrapper.vm.$nextTick()

    // Buttons are naturally focusable, check they exist in list items
    const buttons = wrapper.findAll('li button')
    expect(buttons.length).toBeGreaterThan(0)
  })
})
