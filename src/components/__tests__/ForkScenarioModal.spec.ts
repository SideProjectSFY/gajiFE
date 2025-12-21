import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ForkScenarioModal from '../scenario/ForkScenarioModal.vue'
import type { BrowseScenario } from '@/types'

// Mock the api module
vi.mock('@/services/api', () => ({
  default: {
    post: vi.fn(),
  },
}))

// Import after mocking
import api from '@/services/api'

describe('ForkScenarioModal', () => {
  const mockParentScenario: BrowseScenario = {
    id: 'parent-scenario-id',
    user_id: 'test-user-id',
    base_story: 'Harry Potter',
    scenario_type: 'CHARACTER_CHANGE',
    title: 'Hermione in Slytherin',
    description: 'What if Hermione was sorted into Slytherin?',
    whatIfQuestion: 'What if Hermione was in Slytherin?',
    parameters: {
      character: 'Hermione',
      original_property: 'Gryffindor',
      new_property: 'Slytherin',
    },
    is_private: false,
    conversation_count: 10,
    fork_count: 5,
    like_count: 20,
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mountModal = (props = {}): ReturnType<typeof mount> => {
    return mount(ForkScenarioModal, {
      props: {
        parentScenario: mockParentScenario,
        isOpen: true,
        ...props,
      },
    })
  }

  describe('rendering', () => {
    it('renders modal when isOpen is true', () => {
      const wrapper = mountModal()
      expect(wrapper.find('[data-testid="fork-scenario-modal"]').exists()).toBe(true)
    })

    it('does not render modal when isOpen is false', () => {
      const wrapper = mountModal({ isOpen: false })
      expect(wrapper.find('[data-testid="fork-scenario-modal"]').exists()).toBe(false)
    })

    it('renders header correctly', () => {
      const wrapper = mountModal()
      expect(wrapper.text()).toContain('Fork Scenario')
    })

    it('displays parent scenario information', () => {
      const wrapper = mountModal()
      expect(wrapper.text()).toContain('Hermione in Slytherin')
    })
  })

  describe('form submission', () => {
    it('calls API with correct payload when submitting', async () => {
      const mockResponse = { data: { id: 'new-scenario-id' } }
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const wrapper = mountModal()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(api.post).toHaveBeenCalled()
    })

    it('emits forked event on successful submission', async () => {
      const mockResponse = { data: { id: 'new-scenario-id' } }
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const wrapper = mountModal()
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.emitted('forked')).toBeTruthy()
      expect(wrapper.emitted('forked')![0]).toEqual([{ id: 'new-scenario-id' }])
    })

    it('emits close event after successful submission', async () => {
      const mockResponse = { data: { id: 'new-scenario-id' } }
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const wrapper = mountModal()
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('disables submit button while submitting', async () => {
      let resolvePromise: (value: unknown) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      vi.mocked(api.post).mockReturnValue(promise as Promise<{ data: { id: string } }>)

      const wrapper = mountModal()
      wrapper.find('form').trigger('submit')
      await flushPromises()

      const submitButton = wrapper.find('[data-testid="fork-scenario-button"]')
      expect(submitButton.attributes('disabled')).toBeDefined()

      resolvePromise!({ data: { id: 'test' } })
      await flushPromises()
    })
  })

  describe('modal close behavior', () => {
    it('emits close event when close button is clicked', async () => {
      const wrapper = mountModal()
      const closeButton = wrapper.find('button[aria-label="Close modal"]')
      await closeButton.trigger('click')
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('emits close event when clicking outside modal', async () => {
      const wrapper = mountModal()
      await wrapper.find('.scenario-modal-overlay').trigger('click')
      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })
})
