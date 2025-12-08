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
      expect(wrapper.find('.fork-modal-overlay').exists()).toBe(true)
    })

    it('does not render modal when isOpen is false', () => {
      const wrapper = mountModal({ isOpen: false })
      expect(wrapper.find('.fork-modal-overlay').exists()).toBe(false)
    })

    it('renders step 1 header correctly', () => {
      const wrapper = mountModal()
      expect(wrapper.text()).toContain('Review Parent Scenario')
    })

    it('displays parent scenario information in step 1', () => {
      const wrapper = mountModal()
      expect(wrapper.text()).toContain('Harry Potter')
      expect(wrapper.text()).toContain('Character')
      expect(wrapper.text()).toContain('Hermione in Slytherin')
      expect(wrapper.text()).toContain('What if Hermione was in Slytherin?')
    })

    it('displays info box in step 1', () => {
      const wrapper = mountModal()
      expect(wrapper.text()).toContain('Forking')
      expect(wrapper.text()).toContain('creates a new scenario based on this one')
    })
  })

  describe('step navigation', () => {
    it('starts at step 1', () => {
      const wrapper = mountModal()
      expect(wrapper.text()).toContain('Review Parent Scenario')
      expect(wrapper.text()).toContain('Continue to Customize')
    })

    it('navigates to step 2 when continue button is clicked', async () => {
      const wrapper = mountModal()
      const buttons = wrapper.findAll('button')
      const continueButton = buttons.find((btn) => btn.text().includes('Continue to Customize'))
      await continueButton!.trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('Create Your Fork')
      expect(wrapper.text()).not.toContain('Continue to Customize')
    })

    it('navigates back to step 1 when back button is clicked', async () => {
      const wrapper = mountModal()

      // Go to step 2
      const buttons = wrapper.findAll('button')
      const continueButton = buttons.find((btn) => btn.text().includes('Continue to Customize'))
      await continueButton!.trigger('click')
      await flushPromises()

      // Go back to step 1
      const backButton = wrapper.findAll('button').find((btn) => btn.text().includes('Back'))
      await backButton!.trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('Review Parent Scenario')
    })
  })

  describe('step 2 form', () => {
    const goToStep2 = async (wrapper: ReturnType<typeof mountModal>): Promise<void> => {
      const buttons = wrapper.findAll('button')
      const continueButton = buttons.find((btn) => btn.text().includes('Continue to Customize'))
      await continueButton!.trigger('click')
      await flushPromises()
    }

    it('renders all form fields in step 2', async () => {
      const wrapper = mountModal()
      await goToStep2(wrapper)

      expect(wrapper.text()).toContain('Fork Title')
      expect(wrapper.text()).toContain('Description')
      expect(wrapper.text()).toContain('What If Question')
      expect(wrapper.text()).toContain('Make this fork private')
    })

    it('displays fork lineage breadcrumb in step 2', async () => {
      const wrapper = mountModal()
      await goToStep2(wrapper)

      expect(wrapper.text()).toContain('Harry Potter')
      expect(wrapper.text()).toContain('Hermione in Slytherin')
      expect(wrapper.text()).toContain('Your Fork')
    })

    it('shows preview panel with default preview text', async () => {
      const wrapper = mountModal()
      await goToStep2(wrapper)

      expect(wrapper.text()).toContain('Preview')
      expect(wrapper.text()).toContain('What if Hermione was in Slytherin?')
    })

    it('updates preview when whatIfQuestion is entered', async () => {
      const wrapper = mountModal()
      await goToStep2(wrapper)

      const input = wrapper.find('input[placeholder*="What if"]')
      await input.setValue('What if Hermione was in Slytherin AND became Head Girl?')
      await flushPromises()

      expect(wrapper.text()).toContain('What if Hermione was in Slytherin AND became Head Girl?')
    })

    it('updates preview when only title is entered', async () => {
      const wrapper = mountModal()
      await goToStep2(wrapper)

      const titleInput = wrapper.find('input[placeholder*="Head Girl"]')
      await titleInput.setValue('Hermione as Slytherin Head Girl')
      await flushPromises()

      expect(wrapper.text()).toContain('What if... Hermione as Slytherin Head Girl')
    })

    it('allows toggling public/private', async () => {
      const wrapper = mountModal()
      await goToStep2(wrapper)

      const checkbox = wrapper.find('input[type="checkbox"]')
      expect((checkbox.element as HTMLInputElement).checked).toBe(false)

      await checkbox.setValue(true)
      expect((checkbox.element as HTMLInputElement).checked).toBe(true)
    })
  })

  describe('form submission', () => {
    const goToStep2 = async (wrapper: ReturnType<typeof mountModal>): Promise<void> => {
      const buttons = wrapper.findAll('button')
      const continueButton = buttons.find((btn) => btn.text().includes('Continue to Customize'))
      await continueButton!.trigger('click')
      await flushPromises()
    }

    it('calls API with correct payload when submitting with all fields', async () => {
      const mockResponse = {
        data: {
          id: 'new-fork-id',
          title: 'Custom Fork Title',
          whatIfQuestion: 'Custom What If?',
        },
      }
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const wrapper = mountModal()
      await goToStep2(wrapper)

      // Fill form
      const titleInput = wrapper.find('input[placeholder*="Head Girl"]')
      await titleInput.setValue('Custom Fork Title')

      const descInput = wrapper.find('textarea')
      await descInput.setValue('Custom description')

      const whatIfInput = wrapper.find('input[placeholder*="What if"]')
      await whatIfInput.setValue('Custom What If?')

      const checkbox = wrapper.find('input[type="checkbox"]')
      await checkbox.setValue(true)

      // Submit
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(api.post).toHaveBeenCalledWith(
        '/scenarios/parent-scenario-id/fork',
        {
          title: 'Custom Fork Title',
          description: 'Custom description',
          whatIfQuestion: 'Custom What If?',
          isPrivate: true,
        },
        {
          headers: {
            'X-User-Id': 'test-user-id',
          },
        }
      )
    })

    it('omits empty optional fields from payload', async () => {
      const mockResponse = {
        data: { id: 'new-fork-id' },
      }
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const wrapper = mountModal()
      await goToStep2(wrapper)

      // Submit without filling optional fields
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      const callArgs = vi.mocked(api.post).mock.calls[0]
      const payload = callArgs[1] as Record<string, unknown>

      expect(payload.title).toBeUndefined()
      expect(payload.description).toBeUndefined()
      expect(payload.whatIfQuestion).toBeUndefined()
      expect(payload.isPrivate).toBe(false)
    })

    it('emits forked event on successful submission', async () => {
      const mockResponse = {
        data: { id: 'new-fork-id', title: 'New Fork' },
      }
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const wrapper = mountModal()
      await goToStep2(wrapper)

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.emitted('forked')).toBeTruthy()
      expect(wrapper.emitted('forked')![0]).toEqual([mockResponse.data])
    })

    it('emits close event after successful submission', async () => {
      const mockResponse = {
        data: { id: 'new-fork-id' },
      }
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const wrapper = mountModal()
      await goToStep2(wrapper)

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('disables submit button while submitting', async () => {
      vi.mocked(api.post).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      const wrapper = mountModal()
      await goToStep2(wrapper)

      const submitButton = wrapper.find('button[type="submit"]')

      wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(submitButton.attributes('disabled')).toBeDefined()
      expect(submitButton.text()).toContain('Creating Fork...')
    })

    it('handles API error gracefully', async () => {
      const mockError = {
        response: {
          data: { message: 'Failed to create fork' },
        },
      }
      vi.mocked(api.post).mockRejectedValue(mockError)

      // Mock console.error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const wrapper = mountModal()
      await goToStep2(wrapper)

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Now uses toast notification instead of alert, so just verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalled()
      expect(wrapper.emitted('forked')).toBeFalsy()
      expect(wrapper.emitted('close')).toBeFalsy()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('modal close behavior', () => {
    const goToStep2 = async (wrapper: ReturnType<typeof mountModal>): Promise<void> => {
      const buttons = wrapper.findAll('button')
      const continueButton = buttons.find((btn) => btn.text().includes('Continue to Customize'))
      await continueButton!.trigger('click')
      await flushPromises()
    }

    it('emits close event when close button is clicked', async () => {
      const wrapper = mountModal()
      const closeButton = wrapper.find('button[aria-label="Close modal"]')
      await closeButton.trigger('click')

      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('emits close event when clicking outside modal', async () => {
      const wrapper = mountModal()
      const overlay = wrapper.find('.fork-modal-overlay')
      await overlay.trigger('click')

      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('resets form data when closing', async () => {
      const wrapper = mountModal()

      // Go to step 2 and fill form
      await goToStep2(wrapper)

      const titleInput = wrapper.find('input[placeholder*="Head Girl"]')
      await titleInput.setValue('Some Title')

      // Close modal
      const closeButton = wrapper.find('button[aria-label="Close modal"]')
      await closeButton.trigger('click')
      await flushPromises()

      // Reopen and check if form is reset
      await wrapper.setProps({ isOpen: true })
      await flushPromises()

      await goToStep2(wrapper)

      const resetTitleInput = wrapper.find('input[placeholder*="Head Girl"]')
      expect((resetTitleInput.element as HTMLInputElement).value).toBe('')
    })

    it('resets to step 1 when closing', async () => {
      const wrapper = mountModal()

      // Go to step 2
      await goToStep2(wrapper)

      expect(wrapper.text()).toContain('Create Your Fork')

      // Close modal
      const closeButton = wrapper.find('button[aria-label="Close modal"]')
      await closeButton.trigger('click')
      await flushPromises()

      // Reopen and check if at step 1
      await wrapper.setProps({ isOpen: true })
      await flushPromises()

      expect(wrapper.text()).toContain('Review Parent Scenario')
    })
  })

  describe('scenario type labels', () => {
    it('displays correct label for CHARACTER_CHANGE', () => {
      const wrapper = mountModal()
      expect(wrapper.text()).toContain('Character')
    })

    it('displays correct label for EVENT_ALTERATION', async () => {
      const eventScenario = {
        ...mockParentScenario,
        scenario_type: 'EVENT_ALTERATION' as const,
        parameters: {
          event_name: 'Battle of Hogwarts',
          original_outcome: 'Victory',
          new_outcome: 'Defeat',
        },
      }
      const wrapper = mountModal({ parentScenario: eventScenario })
      expect(wrapper.text()).toContain('Event')
    })

    it('displays correct label for SETTING_MODIFICATION', async () => {
      const settingScenario = {
        ...mockParentScenario,
        scenario_type: 'SETTING_MODIFICATION' as const,
        parameters: {
          original_setting: 'Hogwarts',
          new_setting: 'Durmstrang',
        },
      }
      const wrapper = mountModal({ parentScenario: settingScenario })
      expect(wrapper.text()).toContain('Setting')
    })
  })
})
