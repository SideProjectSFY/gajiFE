import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import BookCard from '@/components/book/BookCard.vue'
import type { Book } from '@/types/book'

describe('BookCard.vue', () => {
  let book: Book

  beforeEach(() => {
    book = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      genre: 'Romance',
      coverImageUrl: 'https://example.com/cover.jpg',
      scenarioCount: 24,
      conversationCount: 156,
    }
  })

  it('renders book information correctly', () => {
    const wrapper = mount(BookCard, {
      props: { book },
    })

    expect(wrapper.find('.book-card__title').text()).toBe('Pride and Prejudice')
    expect(wrapper.find('.book-card__author').text()).toBe('Jane Austen')
    expect(wrapper.find('.book-card__genre').text()).toBe('Romance')
    expect(wrapper.text()).toContain('24 Scenarios')
    expect(wrapper.text()).toContain('156 Conversations')
  })

  it('displays cover image when available', () => {
    const wrapper = mount(BookCard, {
      props: { book },
    })

    const img = wrapper.find('.book-card__image')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://example.com/cover.jpg')
    expect(img.attributes('alt')).toBe('Pride and Prejudice book cover')
  })

  it('displays placeholder when cover image is null', () => {
    book.coverImageUrl = null
    const wrapper = mount(BookCard, {
      props: { book },
    })

    expect(wrapper.find('.book-card__image').exists()).toBe(false)
    expect(wrapper.find('.book-card__placeholder').exists()).toBe(true)
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(BookCard, {
      props: { book },
    })

    await wrapper.find('.book-card__clickable').trigger('click')

    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')?.[0]).toEqual([book])
  })

  it('applies hover styles on mouseover', () => {
    const wrapper = mount(BookCard, {
      props: { book },
    })

    const card = wrapper.find('.book-card')
    expect(card.classes()).toContain('book-card')
  })

  it('has lazy loading for images', () => {
    const wrapper = mount(BookCard, {
      props: { book },
    })

    const img = wrapper.find('.book-card__image')
    expect(img.attributes('loading')).toBe('lazy')
  })
})
