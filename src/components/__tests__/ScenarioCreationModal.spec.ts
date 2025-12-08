import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import ScenarioCreationModal from '../ScenarioCreationModal.vue'

// Mock the api module
vi.mock('@/services/api', () => ({
  default: {
    post: vi.fn(),
  },
}))

// Import after mocking
import api from '@/services/api'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    {
      path: '/books/:bookId/scenarios/:scenarioId',
      component: { template: '<div>Scenario</div>' },
    },
  ],
})

describe('ScenarioCreationModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  const mountModal = (props = {}): ReturnType<typeof mount> => {
    return mount(ScenarioCreationModal, {
      props: {
        bookId: 'test-book-id',
        bookTitle: 'Test Book',
        ...props,
      },
      global: {
        plugins: [router],
        stubs: {
          teleport: true,
        },
      },
    })
  }

  describe('rendering', () => {
    it('renders modal with correct title', () => {
      const wrapper = mountModal()
      expect(wrapper.text()).toContain('Create Scenario for Test Book')
    })

    it('renders all form fields', () => {
      const wrapper = mountModal()
      expect(wrapper.find('#scenario-title').exists()).toBe(true)
      expect(wrapper.find('#character-changes').exists()).toBe(true)
      expect(wrapper.find('#event-alterations').exists()).toBe(true)
      expect(wrapper.find('#setting-modifications').exists()).toBe(true)
    })

    it('renders submit and cancel buttons', () => {
      const wrapper = mountModal()
      expect(wrapper.text()).toContain('Create Scenario')
      expect(wrapper.text()).toContain('Cancel')
    })
  })

  describe('validation', () => {
    it('disables submit button when form is empty', () => {
      const wrapper = mountModal()
      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.attributes('disabled')).toBeDefined()
    })

    it('disables submit button when only title is filled', async () => {
      const wrapper = mountModal()
      await wrapper.find('#scenario-title').setValue('Test Title')
      await flushPromises()

      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.attributes('disabled')).toBeDefined()
    })

    it('disables submit button when scenario type has less than 10 chars', async () => {
      const wrapper = mountModal()
      await wrapper.find('#scenario-title').setValue('Test Title')
      await wrapper.find('#character-changes').setValue('short')
      await flushPromises()

      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.attributes('disabled')).toBeDefined()
    })

    it('enables submit button when title + valid scenario type', async () => {
      const wrapper = mountModal()
      await wrapper.find('#scenario-title').setValue('Test Title')
      await wrapper
        .find('#character-changes')
        .setValue('This is a valid character change description')
      await flushPromises()

      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.attributes('disabled')).toBeUndefined()
    })

    it('shows validation error when typing invalid content', async () => {
      const wrapper = mountModal()
      await wrapper.find('#character-changes').setValue('short')
      await flushPromises()

      expect(wrapper.text()).toContain(
        'Please provide at least one scenario type with 10+ characters'
      )
    })

    it('hides validation error when content becomes valid', async () => {
      const wrapper = mountModal()
      await wrapper.find('#character-changes').setValue('short')
      await flushPromises()

      expect(wrapper.text()).toContain('Please provide at least one scenario type')

      await wrapper.find('#character-changes').setValue('This is now a valid description')
      await flushPromises()

      expect(wrapper.text()).not.toContain('Please provide at least one scenario type')
    })
  })

  describe('form submission', () => {
    it('calls API with correct payload on submit', async () => {
      const mockResponse = { data: { id: 'new-scenario-id' } }
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const wrapper = mountModal()
      await wrapper.find('#scenario-title').setValue('Hermione in Slytherin')
      await wrapper
        .find('#character-changes')
        .setValue('Hermione sorted into Slytherin instead of Gryffindor')
      await wrapper.find('#event-alterations').setValue('Troll incident: saved by Draco')
      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(api.post).toHaveBeenCalledWith('/scenarios', {
        book_id: 'test-book-id',
        scenario_title: 'Hermione in Slytherin',
        character_changes: 'Hermione sorted into Slytherin instead of Gryffindor',
        event_alterations: 'Troll incident: saved by Draco',
        setting_modifications: null,
      })
    })

    it('emits created event on successful submission', async () => {
      const mockResponse = { data: { id: 'new-scenario-id' } }
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const wrapper = mountModal()
      await wrapper.find('#scenario-title').setValue('Test Title')
      await wrapper.find('#character-changes').setValue('Valid character changes here')
      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.emitted('created')).toBeTruthy()
      expect(wrapper.emitted('created')![0]).toEqual(['new-scenario-id'])
    })

    it('shows error message on API failure', async () => {
      vi.mocked(api.post).mockRejectedValue({
        response: { data: { message: 'Server error occurred' } },
      })

      const wrapper = mountModal()
      await wrapper.find('#scenario-title').setValue('Test Title')
      await wrapper.find('#character-changes').setValue('Valid character changes here')
      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.text()).toContain('Server error occurred')
    })

    it('disables submit button while submitting', async () => {
      let resolvePromise: (value: unknown) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      vi.mocked(api.post).mockReturnValue(promise as Promise<{ data: { id: string } }>)

      const wrapper = mountModal()
      await wrapper.find('#scenario-title').setValue('Test Title')
      await wrapper.find('#character-changes').setValue('Valid character changes here')
      await flushPromises()

      wrapper.find('form').trigger('submit')
      await flushPromises()

      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.attributes('disabled')).toBeDefined()

      resolvePromise!({ data: { id: 'test' } })
      await flushPromises()
    })
  })

  describe('modal interactions', () => {
    it('emits close event when cancel is clicked (pristine form)', async () => {
      const wrapper = mountModal()
      // Find the cancel button (first button with type="button")
      const cancelButton = wrapper.findAll('button').find((btn) => btn.text() === 'Cancel')
      await cancelButton?.trigger('click')
      await flushPromises()

      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('shows confirmation when canceling dirty form', async () => {
      const confirmMock = vi.fn().mockReturnValue(false)
      vi.stubGlobal('confirm', confirmMock)

      const wrapper = mountModal()
      await wrapper.find('#scenario-title').setValue('Some text')
      await flushPromises()

      const cancelButton = wrapper.findAll('button').find((btn) => btn.text() === 'Cancel')
      await cancelButton?.trigger('click')
      await flushPromises()

      expect(confirmMock).toHaveBeenCalledWith('Discard scenario creation?')
      expect(wrapper.emitted('close')).toBeFalsy()

      vi.unstubAllGlobals()
    })

    it('closes modal when confirming discard', async () => {
      vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))

      const wrapper = mountModal()
      await wrapper.find('#scenario-title').setValue('Some text')
      await flushPromises()

      const cancelButton = wrapper.findAll('button').find((btn) => btn.text() === 'Cancel')
      await cancelButton?.trigger('click')
      await flushPromises()

      expect(wrapper.emitted('close')).toBeTruthy()

      vi.unstubAllGlobals()
    })
  })

  describe('character counters', () => {
    it('updates character counter for title field', async () => {
      const wrapper = mountModal()
      await wrapper.find('#scenario-title').setValue('Hello')
      await flushPromises()

      expect(wrapper.text()).toContain('5/100')
    })

    it('updates character counter for scenario type fields', async () => {
      const wrapper = mountModal()
      await wrapper.find('#character-changes').setValue('Test text')
      await flushPromises()

      expect(wrapper.text()).toContain('9/10')
    })
  })
})
