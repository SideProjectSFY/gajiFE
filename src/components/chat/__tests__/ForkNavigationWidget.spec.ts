import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import ForkNavigationWidget from '../ForkNavigationWidget.vue'
import type { ForkRelationship } from '../ForkNavigationWidget.vue'

// Create a mock router
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/conversations/:id',
      name: 'conversation',
      component: { template: '<div>Conversation</div>' },
    },
  ],
})

describe('ForkNavigationWidget', () => {
  const mockConversationId = 'test-conversation-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when forkRelationship is null', () => {
    const wrapper = mount(ForkNavigationWidget, {
      props: {
        conversationId: mockConversationId,
        forkRelationship: null,
        isLoading: false,
        hasError: false,
      },
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toBe('')
  })

  it('shows loading state when isLoading is true', () => {
    const wrapper = mount(ForkNavigationWidget, {
      props: {
        conversationId: mockConversationId,
        forkRelationship: null,
        isLoading: true,
        hasError: false,
      },
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('분기 정보 로딩 중')
  })

  it('shows error state when hasError is true', () => {
    const wrapper = mount(ForkNavigationWidget, {
      props: {
        conversationId: mockConversationId,
        forkRelationship: null,
        isLoading: false,
        hasError: true,
      },
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('분기 정보를 불러올 수 없습니다')
  })

  it('shows parent link when conversation is a fork', () => {
    const forkRelationship: ForkRelationship = {
      current: {
        id: mockConversationId,
        firstMessagePreview: 'Current message',
        isRoot: false,
        hasBeenForked: false,
        messageCount: 5,
        likeCount: 2,
      },
      parent: {
        id: 'parent-123',
        firstMessagePreview: 'Parent conversation',
        isRoot: true,
        hasBeenForked: true,
        messageCount: 10,
        likeCount: 5,
      },
      child: null,
      forkStatus: 'fork',
    }

    const wrapper = mount(ForkNavigationWidget, {
      props: {
        conversationId: mockConversationId,
        forkRelationship,
      },
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('분기됨:')
    expect(wrapper.text()).toContain('Parent conversation')
  })

  it('navigates to parent when parent link is clicked', async () => {
    const forkRelationship: ForkRelationship = {
      current: {
        id: mockConversationId,
        firstMessagePreview: 'Current message',
        isRoot: false,
        hasBeenForked: false,
        messageCount: 5,
        likeCount: 2,
      },
      parent: {
        id: 'parent-123',
        firstMessagePreview: 'Parent conversation',
        isRoot: true,
        hasBeenForked: true,
        messageCount: 10,
        likeCount: 5,
      },
      child: null,
      forkStatus: 'fork',
    }

    const pushSpy = vi.spyOn(router, 'push')

    const wrapper = mount(ForkNavigationWidget, {
      props: {
        conversationId: mockConversationId,
        forkRelationship,
      },
      global: {
        plugins: [router],
      },
    })

    const parentLink = wrapper.find('a')
    await parentLink.trigger('click')

    expect(pushSpy).toHaveBeenCalledWith('/conversations/parent-123')
  })

  it('shows fork dropdown when root conversation has child', () => {
    const forkRelationship: ForkRelationship = {
      current: {
        id: mockConversationId,
        firstMessagePreview: 'Root conversation',
        isRoot: true,
        hasBeenForked: true,
        messageCount: 10,
        likeCount: 5,
      },
      parent: null,
      child: {
        id: 'child-123',
        firstMessagePreview: 'Forked conversation',
        isRoot: false,
        hasBeenForked: false,
        messageCount: 8,
        likeCount: 3,
      },
      forkStatus: 'root_forked',
    }

    const wrapper = mount(ForkNavigationWidget, {
      props: {
        conversationId: mockConversationId,
        forkRelationship,
      },
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('분기 (1)')
  })

  it('toggles dropdown when fork button is clicked', async () => {
    const forkRelationship: ForkRelationship = {
      current: {
        id: mockConversationId,
        firstMessagePreview: 'Root conversation',
        isRoot: true,
        hasBeenForked: true,
        messageCount: 10,
        likeCount: 5,
      },
      parent: null,
      child: {
        id: 'child-123',
        firstMessagePreview: 'Forked conversation',
        isRoot: false,
        hasBeenForked: false,
        messageCount: 8,
        likeCount: 3,
      },
      forkStatus: 'root_forked',
    }

    const wrapper = mount(ForkNavigationWidget, {
      props: {
        conversationId: mockConversationId,
        forkRelationship,
      },
      global: {
        plugins: [router],
      },
    })

    // Initially dropdown is closed
    let dropdownMenus = wrapper.findAll('div').filter((div) => div.text().includes('8개의 메시지'))
    expect(dropdownMenus.length).toBe(0)

    // Click to open dropdown
    const button = wrapper.find('button')
    await button.trigger('click')

    // Dropdown should be visible
    dropdownMenus = wrapper.findAll('div').filter((div) => div.text().includes('8개의 메시지'))
    expect(dropdownMenus.length).toBeGreaterThan(0)
    expect(wrapper.text()).toContain('Forked conversation')
    expect(wrapper.text()).toContain('8개의 메시지')
  })

  it('navigates to child when child item is clicked', async () => {
    const forkRelationship: ForkRelationship = {
      current: {
        id: mockConversationId,
        firstMessagePreview: 'Root conversation',
        isRoot: true,
        hasBeenForked: true,
        messageCount: 10,
        likeCount: 5,
      },
      parent: null,
      child: {
        id: 'child-123',
        firstMessagePreview: 'Forked conversation',
        isRoot: false,
        hasBeenForked: false,
        messageCount: 8,
        likeCount: 3,
      },
      forkStatus: 'root_forked',
    }

    const pushSpy = vi.spyOn(router, 'push')

    const wrapper = mount(ForkNavigationWidget, {
      props: {
        conversationId: mockConversationId,
        forkRelationship,
      },
      global: {
        plugins: [router],
      },
    })

    // Open dropdown
    const button = wrapper.find('button')
    await button.trigger('click')

    // Click on child item using data-testid
    const childItem = wrapper.find('[data-testid="child-fork-item"]')
    expect(childItem.exists()).toBe(true)
    await childItem.trigger('click')

    expect(pushSpy).toHaveBeenCalledWith('/conversations/child-123')
  })

  it('closes dropdown when conversation ID changes', async () => {
    const forkRelationship: ForkRelationship = {
      current: {
        id: mockConversationId,
        firstMessagePreview: 'Root conversation',
        isRoot: true,
        hasBeenForked: true,
        messageCount: 10,
        likeCount: 5,
      },
      parent: null,
      child: {
        id: 'child-123',
        firstMessagePreview: 'Forked conversation',
        isRoot: false,
        hasBeenForked: false,
        messageCount: 8,
        likeCount: 3,
      },
      forkStatus: 'root_forked',
    }

    const wrapper = mount(ForkNavigationWidget, {
      props: {
        conversationId: mockConversationId,
        forkRelationship,
      },
      global: {
        plugins: [router],
      },
    })

    // Open dropdown
    const button = wrapper.find('button')
    await button.trigger('click')

    // Dropdown should be visible
    let dropdownItems = wrapper.findAll('div').filter((div) => div.text().includes('8개의 메시지'))
    expect(dropdownItems.length).toBeGreaterThan(0)

    // Change conversation ID
    await wrapper.setProps({ conversationId: 'new-conversation-456' })

    // Dropdown should be closed
    dropdownItems = wrapper.findAll('div').filter((div) => div.text().includes('8개의 메시지'))
    expect(dropdownItems.length).toBe(0)
  })

  it('does not render widget for root conversation without child', () => {
    const forkRelationship: ForkRelationship = {
      current: {
        id: mockConversationId,
        firstMessagePreview: 'Root conversation',
        isRoot: true,
        hasBeenForked: false,
        messageCount: 10,
        likeCount: 5,
      },
      parent: null,
      child: null,
      forkStatus: 'root_can_fork',
    }

    const wrapper = mount(ForkNavigationWidget, {
      props: {
        conversationId: mockConversationId,
        forkRelationship,
      },
      global: {
        plugins: [router],
      },
    })

    // Widget nav exists but should have no visible content for this case (changed from div to nav)
    expect(wrapper.html()).toContain('nav')
    expect(wrapper.text()).not.toContain('분기됨:')
    expect(wrapper.text()).not.toContain('분기 (1)')
  })

  it('closes dropdown when clicking outside', async () => {
    const forkRelationship: ForkRelationship = {
      current: {
        id: mockConversationId,
        firstMessagePreview: 'Root conversation',
        isRoot: true,
        hasBeenForked: true,
        messageCount: 10,
        likeCount: 5,
      },
      parent: null,
      child: {
        id: 'child-456',
        firstMessagePreview: 'Child fork preview',
        isRoot: false,
        hasBeenForked: false,
        messageCount: 8,
        likeCount: 3,
      },
      forkStatus: 'root_forked',
    }

    const wrapper = mount(ForkNavigationWidget, {
      props: {
        conversationId: mockConversationId,
        forkRelationship,
      },
      global: {
        plugins: [router],
      },
      attachTo: document.body,
    })

    // Open dropdown
    const dropdownButton = wrapper.find('button')
    await dropdownButton.trigger('click')
    await wrapper.vm.$nextTick()

    // Verify dropdown is open
    expect(wrapper.find('[data-testid="child-fork-item"]').exists()).toBe(true)

    // Click outside
    document.body.click()
    await wrapper.vm.$nextTick()

    // Dropdown should be closed
    expect(wrapper.find('[data-testid="child-fork-item"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('handles keyboard navigation - Escape key closes dropdown', async () => {
    const forkRelationship: ForkRelationship = {
      current: {
        id: mockConversationId,
        firstMessagePreview: 'Root conversation',
        isRoot: true,
        hasBeenForked: true,
        messageCount: 10,
        likeCount: 5,
      },
      parent: null,
      child: {
        id: 'child-456',
        firstMessagePreview: 'Child fork preview',
        isRoot: false,
        hasBeenForked: false,
        messageCount: 8,
        likeCount: 3,
      },
      forkStatus: 'root_forked',
    }

    const wrapper = mount(ForkNavigationWidget, {
      props: {
        conversationId: mockConversationId,
        forkRelationship,
      },
      global: {
        plugins: [router],
      },
      attachTo: document.body,
    })

    // Open dropdown
    const dropdownButton = wrapper.find('button')
    await dropdownButton.trigger('click')
    await wrapper.vm.$nextTick()

    // Verify dropdown is open
    expect(wrapper.find('[data-testid="child-fork-item"]').exists()).toBe(true)

    // Press Escape key
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' })
    document.dispatchEvent(escapeEvent)
    await wrapper.vm.$nextTick()

    // Dropdown should be closed
    expect(wrapper.find('[data-testid="child-fork-item"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('handles keyboard navigation - Enter on child item navigates', async () => {
    const forkRelationship: ForkRelationship = {
      current: {
        id: mockConversationId,
        firstMessagePreview: 'Root conversation',
        isRoot: true,
        hasBeenForked: true,
        messageCount: 10,
        likeCount: 5,
      },
      parent: null,
      child: {
        id: 'child-456',
        firstMessagePreview: 'Child fork preview',
        isRoot: false,
        hasBeenForked: false,
        messageCount: 8,
        likeCount: 3,
      },
      forkStatus: 'root_forked',
    }

    const wrapper = mount(ForkNavigationWidget, {
      props: {
        conversationId: mockConversationId,
        forkRelationship,
      },
      global: {
        plugins: [router],
      },
    })

    // Spy on router.push
    const pushSpy = vi.spyOn(router, 'push')

    // Open dropdown
    const dropdownButton = wrapper.find('button')
    await dropdownButton.trigger('click')
    await wrapper.vm.$nextTick()

    // Find child item and press Enter
    const childItem = wrapper.find('[data-testid="child-fork-item"]')
    await childItem.trigger('keydown.enter')

    // Should navigate to child conversation
    expect(pushSpy).toHaveBeenCalledWith('/conversations/child-456')
  })

  it('has proper ARIA attributes for accessibility', () => {
    const forkRelationship: ForkRelationship = {
      current: {
        id: mockConversationId,
        firstMessagePreview: 'Root conversation',
        isRoot: true,
        hasBeenForked: true,
        messageCount: 10,
        likeCount: 5,
      },
      parent: null,
      child: {
        id: 'child-456',
        firstMessagePreview: 'Child fork preview',
        isRoot: false,
        hasBeenForked: false,
        messageCount: 8,
        likeCount: 3,
      },
      forkStatus: 'root_forked',
    }

    const wrapper = mount(ForkNavigationWidget, {
      props: {
        conversationId: mockConversationId,
        forkRelationship,
      },
      global: {
        plugins: [router],
      },
    })

    // Check nav element has aria-label
    const nav = wrapper.find('nav')
    expect(nav.attributes('aria-label')).toBe('대화 분기 탐색')

    // Check button has ARIA attributes
    const button = wrapper.find('button')
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(button.attributes('aria-haspopup')).toBe('true')
    expect(button.attributes('aria-label')).toContain('분기된 대화')
  })
})
