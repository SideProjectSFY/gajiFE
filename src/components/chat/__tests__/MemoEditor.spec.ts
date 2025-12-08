import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MemoEditor from '../MemoEditor.vue'
import { useMemoStore } from '@/stores/memo'

describe('MemoEditor', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('renders collapsed by default', () => {
    const wrapper = mount(MemoEditor, {
      props: {
        conversationId: 'test-conversation-id',
      },
      global: {
        plugins: [pinia],
      },
    })

    expect(wrapper.find('textarea').exists()).toBe(false)
  })

  it('expands when header is clicked', async () => {
    const wrapper = mount(MemoEditor, {
      props: {
        conversationId: 'test-conversation-id',
      },
      global: {
        plugins: [pinia],
      },
    })

    const headerButton = wrapper.find('button[type="button"]')
    await headerButton.trigger('click')

    expect(wrapper.find('textarea').exists()).toBe(true)
  })

  it('shows character counter', async () => {
    const wrapper = mount(MemoEditor, {
      props: {
        conversationId: 'test-conversation-id',
      },
      global: {
        plugins: [pinia],
        stubs: {
          CharCounter: {
            template: '<div>{{ text.length }}/{{ max }} chars</div>',
            props: ['text', 'max'],
          },
        },
      },
    })

    const headerButton = wrapper.find('button[type="button"]')
    await headerButton.trigger('click')

    const textarea = wrapper.find('textarea')
    await textarea.setValue('Test memo content')
    await flushPromises()

    expect(wrapper.text()).toContain('17')
    expect(wrapper.text()).toContain('2000')
  })

  it('saves memo content to localStorage on input', async () => {
    const conversationId = 'test-conversation-id'
    const wrapper = mount(MemoEditor, {
      props: {
        conversationId,
      },
      global: {
        plugins: [pinia],
      },
    })

    const headerButton = wrapper.find('button[type="button"]')
    await headerButton.trigger('click')

    const textarea = wrapper.find('textarea')
    await textarea.setValue('Draft content')
    await flushPromises()

    expect(localStorage.getItem(`memo_draft_${conversationId}`)).toBe('Draft content')
  })

  it('loads existing memo on mount', async () => {
    const conversationId = 'test-conversation-id'
    const memoStore = useMemoStore()

    // Mock fetchMemo to return existing memo
    vi.spyOn(memoStore, 'fetchMemo').mockResolvedValue({
      id: 'memo-id',
      conversationId,
      userId: 'user-id',
      content: 'Existing memo content',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const wrapper = mount(MemoEditor, {
      props: {
        conversationId,
      },
      global: {
        plugins: [pinia],
      },
    })

    await flushPromises()

    const headerButton = wrapper.find('button[type="button"]')
    await headerButton.trigger('click')
    await flushPromises()

    const textarea = wrapper.find('textarea')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('Existing memo content')
  })

  it('shows save button as disabled when no changes', async () => {
    const wrapper = mount(MemoEditor, {
      props: {
        conversationId: 'test-conversation-id',
      },
      global: {
        plugins: [pinia],
      },
    })

    const headerButton = wrapper.find('button[type="button"]')
    await headerButton.trigger('click')

    const saveButton = wrapper.findAll('button[type="button"]')[1]
    expect(saveButton.attributes('disabled')).toBeDefined()
  })

  it('enables save button when content changes', async () => {
    const wrapper = mount(MemoEditor, {
      props: {
        conversationId: 'test-conversation-id',
      },
      global: {
        plugins: [pinia],
      },
    })

    const headerButton = wrapper.find('button[type="button"]')
    await headerButton.trigger('click')

    const textarea = wrapper.find('textarea')
    await textarea.setValue('New content')
    await flushPromises()

    const saveButton = wrapper.findAll('button[type="button"]')[1]
    expect(saveButton.attributes('disabled')).toBeUndefined()
  })

  it('calls saveMemo when save button is clicked', async () => {
    const conversationId = 'test-conversation-id'
    const memoStore = useMemoStore()

    vi.spyOn(memoStore, 'saveMemo').mockResolvedValue({
      id: 'memo-id',
      conversationId,
      userId: 'user-id',
      content: 'Saved content',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const wrapper = mount(MemoEditor, {
      props: {
        conversationId,
      },
      global: {
        plugins: [pinia],
      },
    })

    const headerButton = wrapper.find('button[type="button"]')
    await headerButton.trigger('click')

    const textarea = wrapper.find('textarea')
    await textarea.setValue('Saved content')
    await flushPromises()

    const saveButton = wrapper.findAll('button[type="button"]')[1]
    await saveButton.trigger('click')
    await flushPromises()

    expect(memoStore.saveMemo).toHaveBeenCalledWith(conversationId, 'Saved content')
  })

  it('shows delete button only when memo exists', async () => {
    const conversationId = 'test-conversation-id'
    const memoStore = useMemoStore()

    const mockMemo = {
      id: 'memo-id',
      conversationId,
      userId: 'user-id',
      content: 'Existing content',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    vi.spyOn(memoStore, 'fetchMemo').mockResolvedValue(mockMemo)

    // Manually set memo in store to simulate existing memo
    memoStore.memos.set(conversationId, mockMemo)

    const wrapper = mount(MemoEditor, {
      props: {
        conversationId,
      },
      global: {
        plugins: [pinia],
        stubs: {
          CharCounter: {
            template: '<div></div>',
            props: ['text', 'max'],
          },
        },
      },
    })

    await flushPromises()

    const headerButton = wrapper.find('button[type="button"]')
    await headerButton.trigger('click')
    await flushPromises()

    const buttons = wrapper.findAll('button[type="button"]')
    const hasDeleteButton = buttons.some((btn) => btn.text().includes('삭제'))
    expect(hasDeleteButton).toBe(true)
  })

  it('enforces max length of 2000 characters', async () => {
    const wrapper = mount(MemoEditor, {
      props: {
        conversationId: 'test-conversation-id',
      },
      global: {
        plugins: [pinia],
      },
    })

    const headerButton = wrapper.find('button[type="button"]')
    await headerButton.trigger('click')

    const textarea = wrapper.find('textarea')
    expect(textarea.attributes('maxlength')).toBe('2000')
  })
})
