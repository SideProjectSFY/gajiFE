import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CharCounter from '../CharCounter.vue'

describe('CharCounter', () => {
  describe('with min prop (scenario types)', () => {
    it('shows correct count when text is empty', () => {
      const wrapper = mount(CharCounter, {
        props: { text: '', min: 10 },
      })

      expect(wrapper.text()).toContain('0/10 chars')
      // No checkmark for empty text
      expect(wrapper.text()).not.toContain('✓')
    })

    it('shows correct count for text with 1-9 characters', () => {
      const wrapper = mount(CharCounter, {
        props: { text: 'short', min: 10 },
      })

      expect(wrapper.text()).toContain('5/10 chars')
      // No checkmark for invalid text
      expect(wrapper.text()).not.toContain('✓')
    })

    it('shows checkmark when text is 10+ characters', () => {
      const wrapper = mount(CharCounter, {
        props: { text: 'This is a valid text', min: 10 },
      })

      expect(wrapper.text()).toContain('20/10 chars')
      expect(wrapper.text()).toContain('✓')
    })

    it('shows checkmark at exactly 10 characters', () => {
      const wrapper = mount(CharCounter, {
        props: { text: '1234567890', min: 10 },
      })

      expect(wrapper.text()).toContain('10/10 chars')
      expect(wrapper.text()).toContain('✓')
    })
  })

  describe('with max prop (title field)', () => {
    it('shows correct count when under max', () => {
      const wrapper = mount(CharCounter, {
        props: { text: 'Short title', max: 100, label: 'chars' },
      })

      expect(wrapper.text()).toContain('11/100 chars')
    })

    it('shows correct count when exceeding max', () => {
      const longText = 'a'.repeat(101)
      const wrapper = mount(CharCounter, {
        props: { text: longText, max: 100, label: 'chars' },
      })

      expect(wrapper.text()).toContain('101/100 chars')
    })

    it('shows correct count at exactly max characters', () => {
      const exactText = 'a'.repeat(100)
      const wrapper = mount(CharCounter, {
        props: { text: exactText, max: 100, label: 'chars' },
      })

      expect(wrapper.text()).toContain('100/100 chars')
    })
  })

  describe('reactivity', () => {
    it('updates count when text changes', async () => {
      const wrapper = mount(CharCounter, {
        props: { text: '', min: 10 },
      })

      expect(wrapper.text()).toContain('0/10')

      await wrapper.setProps({ text: 'Hello' })
      expect(wrapper.text()).toContain('5/10')

      await wrapper.setProps({ text: 'Hello World!' })
      expect(wrapper.text()).toContain('12/10')
    })

    it('shows checkmark when crossing threshold', async () => {
      const wrapper = mount(CharCounter, {
        props: { text: 'short', min: 10 },
      })

      expect(wrapper.text()).not.toContain('✓')

      await wrapper.setProps({ text: 'This is now valid text' })
      expect(wrapper.text()).toContain('✓')
    })
  })

  describe('edge cases', () => {
    it('handles null/undefined text gracefully', () => {
      const wrapper = mount(CharCounter, {
        props: { text: undefined as unknown as string, min: 10 },
      })

      expect(wrapper.text()).toContain('0/10')
    })

    it('handles empty string', () => {
      const wrapper = mount(CharCounter, {
        props: { text: '', min: 10 },
      })

      expect(wrapper.text()).toContain('0/10')
      // No checkmark for empty
      expect(wrapper.text()).not.toContain('✓')
    })

    it('uses default label when not provided with max', () => {
      const wrapper = mount(CharCounter, {
        props: { text: 'test', max: 100 },
      })

      expect(wrapper.text()).toContain('4/100 chars')
    })
  })

  describe('computed statusClass', () => {
    it('returns neutral for empty text with min', () => {
      const wrapper = mount(CharCounter, {
        props: { text: '', min: 10 },
      })
      // Check that checkmark is not shown (neutral state)
      expect(wrapper.text()).not.toContain('✓')
    })

    it('returns invalid for text under min', () => {
      const wrapper = mount(CharCounter, {
        props: { text: 'abc', min: 10 },
      })
      // Check that checkmark is not shown (invalid state)
      expect(wrapper.text()).not.toContain('✓')
      expect(wrapper.text()).toContain('3/10')
    })

    it('returns valid for text at or above min', () => {
      const wrapper = mount(CharCounter, {
        props: { text: 'This is valid', min: 10 },
      })
      // Check that checkmark is shown (valid state)
      expect(wrapper.text()).toContain('✓')
    })
  })
})
