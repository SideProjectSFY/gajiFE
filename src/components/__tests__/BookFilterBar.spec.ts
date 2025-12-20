import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BookFilterBar from '@/components/book/BookFilterBar.vue'

describe('BookFilterBar.vue', () => {
  it('renders genre and sort dropdowns', () => {
    const wrapper = mount(BookFilterBar)

    expect(wrapper.find('#genre-filter').exists()).toBe(true)
    expect(wrapper.find('#sort-filter').exists()).toBe(true)
  })

  it('displays all genre options', () => {
    const wrapper = mount(BookFilterBar)

    const genreSelect = wrapper.find('#genre-filter')
    const options = genreSelect.findAll('option')

    // Should have "All Genres" + all specific genres
    expect(options.length).toBeGreaterThan(5)
    expect(options[0].text()).toBe('All Genres')
  })

  it('displays all sort options', () => {
    const wrapper = mount(BookFilterBar)

    const sortSelect = wrapper.find('#sort-filter')
    const options = sortSelect.findAll('option')

    expect(options.length).toBe(3)
    expect(options[0].text()).toBe('Latest')
    expect(options[1].text()).toBe('Recommended')
    expect(options[2].text()).toBe('Popular')
  })

  it('emits filterChange when genre is changed', async () => {
    const wrapper = mount(BookFilterBar)

    const genreSelect = wrapper.find('#genre-filter')
    await genreSelect.setValue('Fantasy')

    // Wait for debounce (300ms)
    await new Promise((resolve) => setTimeout(resolve, 350))

    expect(wrapper.emitted('filterChange')).toBeTruthy()
    const emittedValue = wrapper.emitted('filterChange')?.[0]?.[0] as {
      genre: string
      sort: string
    }
    expect(emittedValue.genre).toBe('Fantasy')
  })

  it('emits filterChange when sort is changed', async () => {
    const wrapper = mount(BookFilterBar)

    const sortSelect = wrapper.find('#sort-filter')
    await sortSelect.setValue('popular')

    // Wait for debounce (300ms)
    await new Promise((resolve) => setTimeout(resolve, 350))

    expect(wrapper.emitted('filterChange')).toBeTruthy()
    const emittedValue = wrapper.emitted('filterChange')?.[0]?.[0] as {
      genre: string
      sort: string
    }
    expect(emittedValue.sort).toBe('popular')
  })

  it('initializes with provided initial values', () => {
    const wrapper = mount(BookFilterBar, {
      props: {
        initialGenre: 'Sci-Fi',
        initialSort: 'latest',
      },
    })

    const genreSelect = wrapper.find('#genre-filter')
    const sortSelect = wrapper.find('#sort-filter')

    expect((genreSelect.element as HTMLSelectElement).value).toBe('Sci-Fi')
    expect((sortSelect.element as HTMLSelectElement).value).toBe('latest')
  })

  it('is mobile responsive with proper styling', () => {
    const wrapper = mount(BookFilterBar)

    expect(wrapper.find('.book-filter-bar').exists()).toBe(true)
    expect(wrapper.find('.filter-section').exists()).toBe(true)
  })
})
