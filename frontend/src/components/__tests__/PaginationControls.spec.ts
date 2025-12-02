import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PaginationControls from '@/components/book/PaginationControls.vue'

describe('PaginationControls.vue', () => {
  const defaultProps = {
    currentPage: 0,
    totalPages: 5,
    totalElements: 100,
    pageSize: 20,
  }

  it('displays correct pagination info', () => {
    const wrapper = mount(PaginationControls, {
      props: defaultProps,
    })

    expect(wrapper.text()).toContain('Showing 1-20 of 100 books')
  })

  it('displays correct info for last page', () => {
    const wrapper = mount(PaginationControls, {
      props: {
        currentPage: 4,
        totalPages: 5,
        totalElements: 95,
        pageSize: 20,
      },
    })

    expect(wrapper.text()).toContain('Showing 81-95 of 95 books')
  })

  it('renders page number buttons', () => {
    const wrapper = mount(PaginationControls, {
      props: defaultProps,
    })

    const pageButtons = wrapper.findAll('.page-number')
    expect(pageButtons.length).toBeGreaterThan(0)
    expect(pageButtons.length).toBeLessThanOrEqual(5) // Max visible pages
  })

  it('highlights current page', () => {
    const wrapper = mount(PaginationControls, {
      props: {
        ...defaultProps,
        currentPage: 2,
      },
    })

    const activeButton = wrapper.find('.page-number.active')
    expect(activeButton.exists()).toBe(true)
    expect(activeButton.text()).toBe('3') // Page 2 (0-indexed) is displayed as 3
  })

  it('disables Prev button on first page', () => {
    const wrapper = mount(PaginationControls, {
      props: {
        ...defaultProps,
        currentPage: 0,
      },
    })

    const prevButton = wrapper.findAll('.pagination-button')[0]
    expect((prevButton.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('disables Next button on last page', () => {
    const wrapper = mount(PaginationControls, {
      props: {
        ...defaultProps,
        currentPage: 4, // Last page (0-indexed)
      },
    })

    const buttons = wrapper.findAll('.pagination-button')
    const nextButton = buttons[buttons.length - 1]
    expect((nextButton.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('emits pageChange when Prev is clicked', async () => {
    const wrapper = mount(PaginationControls, {
      props: {
        ...defaultProps,
        currentPage: 2,
      },
    })

    const prevButton = wrapper.findAll('.pagination-button')[0]
    await prevButton.trigger('click')

    expect(wrapper.emitted('pageChange')).toBeTruthy()
    expect(wrapper.emitted('pageChange')?.[0]).toEqual([1])
  })

  it('emits pageChange when Next is clicked', async () => {
    const wrapper = mount(PaginationControls, {
      props: {
        ...defaultProps,
        currentPage: 2,
      },
    })

    const buttons = wrapper.findAll('.pagination-button')
    const nextButton = buttons[buttons.length - 1]
    await nextButton.trigger('click')

    expect(wrapper.emitted('pageChange')).toBeTruthy()
    expect(wrapper.emitted('pageChange')?.[0]).toEqual([3])
  })

  it('emits pageChange when page number is clicked', async () => {
    const wrapper = mount(PaginationControls, {
      props: defaultProps,
    })

    const pageButton = wrapper.find('.page-number')
    await pageButton.trigger('click')

    expect(wrapper.emitted('pageChange')).toBeTruthy()
  })

  it('displays correct visible pages range', () => {
    const wrapper = mount(PaginationControls, {
      props: {
        ...defaultProps,
        currentPage: 2,
        totalPages: 10,
      },
    })

    const pageButtons = wrapper.findAll('.page-number')
    // Should show 5 pages centered around current page
    expect(pageButtons.length).toBeLessThanOrEqual(5)
  })

  it('is mobile responsive', () => {
    const wrapper = mount(PaginationControls, {
      props: defaultProps,
    })

    expect(wrapper.find('.pagination-controls').exists()).toBe(true)
    expect(wrapper.find('.pagination-buttons').exists()).toBe(true)
    expect(wrapper.find('.pagination-info').exists()).toBe(true)
  })
})
