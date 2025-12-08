import { describe, it, expect, beforeEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import Pagination from '../Pagination.vue'

describe('Pagination.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    // Setup if needed
  })

  const createWrapper = (props = {}): ReturnType<typeof mount> => {
    return mount(Pagination, {
      props: {
        currentPage: 0,
        totalPages: 10,
        ...props,
      },
    })
  }

  it('renders pagination buttons', () => {
    wrapper = createWrapper()
    expect(wrapper.find('.pagination').exists()).toBe(true)
    expect(wrapper.findAll('.pagination-button')).toHaveLength(2) // Previous and Next
  })

  it('displays page numbers', () => {
    wrapper = createWrapper({ currentPage: 2, totalPages: 10 })
    const pageButtons = wrapper.findAll('.pagination-page')
    expect(pageButtons.length).toBeGreaterThan(0)
  })

  it('disables previous button on first page', () => {
    wrapper = createWrapper({ currentPage: 0, totalPages: 10 })
    const prevButton = wrapper.findAll('.pagination-button')[0]
    expect(prevButton.attributes('disabled')).toBeDefined()
  })

  it('disables next button on last page', () => {
    wrapper = createWrapper({ currentPage: 9, totalPages: 10 })
    const nextButton = wrapper.findAll('.pagination-button')[1]
    expect(nextButton.attributes('disabled')).toBeDefined()
  })

  it('enables both buttons on middle page', () => {
    wrapper = createWrapper({ currentPage: 5, totalPages: 10 })
    const buttons = wrapper.findAll('.pagination-button')
    expect(buttons[0].attributes('disabled')).toBeUndefined()
    expect(buttons[1].attributes('disabled')).toBeUndefined()
  })

  it('emits page-change on page click', async () => {
    wrapper = createWrapper({ currentPage: 2, totalPages: 10 })
    const pageButton = wrapper.findAll('.pagination-page')[0]
    await pageButton.trigger('click')
    expect(wrapper.emitted('page-change')).toBeTruthy()
  })

  it('emits page-change on previous button click', async () => {
    wrapper = createWrapper({ currentPage: 2, totalPages: 10 })
    const prevButton = wrapper.findAll('.pagination-button')[0]
    await prevButton.trigger('click')
    expect(wrapper.emitted('page-change')).toBeTruthy()
    expect(wrapper.emitted('page-change')?.[0]).toEqual([1])
  })

  it('emits page-change on next button click', async () => {
    wrapper = createWrapper({ currentPage: 2, totalPages: 10 })
    const nextButton = wrapper.findAll('.pagination-button')[1]
    await nextButton.trigger('click')
    expect(wrapper.emitted('page-change')).toBeTruthy()
    expect(wrapper.emitted('page-change')?.[0]).toEqual([3])
  })

  it('highlights current page', () => {
    wrapper = createWrapper({ currentPage: 2, totalPages: 10 })
    const activeButton = wrapper.find('.pagination-page.active')
    expect(activeButton.exists()).toBe(true)
    expect(activeButton.text()).toBe('3') // currentPage 2 = display 3 (0-indexed)
  })

  it('shows all pages when total is 5 or less', () => {
    wrapper = createWrapper({ currentPage: 0, totalPages: 5 })
    const pageButtons = wrapper.findAll('.pagination-page')
    expect(pageButtons).toHaveLength(5)
  })

  it('limits visible pages when total is more than 5', () => {
    wrapper = createWrapper({ currentPage: 0, totalPages: 20 })
    const pageButtons = wrapper.findAll('.pagination-page')
    expect(pageButtons.length).toBeLessThanOrEqual(5)
  })

  it('has correct aria labels for accessibility', () => {
    wrapper = createWrapper()
    expect(wrapper.find('.pagination').attributes('aria-label')).toBe('Pagination')
    expect(wrapper.findAll('.pagination-button')[0].attributes('aria-label')).toBe('Previous page')
    expect(wrapper.findAll('.pagination-button')[1].attributes('aria-label')).toBe('Next page')
  })

  it('sets aria-current on active page', () => {
    wrapper = createWrapper({ currentPage: 2, totalPages: 10 })
    const activeButton = wrapper.find('.pagination-page.active')
    expect(activeButton.attributes('aria-current')).toBe('page')
  })
})
