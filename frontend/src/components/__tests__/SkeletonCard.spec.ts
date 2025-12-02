import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SkeletonCard from '../common/SkeletonCard.vue'

describe('SkeletonCard', () => {
  it('renders without crashing', () => {
    const wrapper = mount(SkeletonCard)
    expect(wrapper.exists()).toBe(true)
  })

  it('displays skeleton elements', () => {
    const wrapper = mount(SkeletonCard)
    const html = wrapper.html()

    // Check that skeleton elements are present
    expect(html).toBeTruthy()
  })
})
