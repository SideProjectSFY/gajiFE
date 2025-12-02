import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ShareButton from '@/components/common/ShareButton.vue'

describe('ShareButton.vue', () => {
  let wrapper: any
  const mockProps = {
    scenarioId: '123e4567-e89b-12d3-a456-426614174000',
    scenarioTitle: 'Harry Potter Scenario',
    baseStory: 'Harry Potter in Slytherin',
  }

  beforeEach(() => {
    // Mock window.open
    vi.spyOn(window, 'open').mockImplementation(() => null)

    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    })

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:5173' },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('should render share button', () => {
      wrapper = mount(ShareButton, {
        props: mockProps,
      })

      const shareBtn = wrapper.find('[data-testid="share-button"]')
      expect(shareBtn.exists()).toBe(true)
      expect(shareBtn.text()).toContain('Share')
      expect(shareBtn.find('svg').exists()).toBe(true)
    })

    it('should not show dropdown initially', () => {
      wrapper = mount(ShareButton, {
        props: mockProps,
      })

      expect(wrapper.find('[data-testid="share-dropdown"]').exists()).toBe(false)
    })
  })

  describe('Dropdown Toggle', () => {
    it('should open dropdown when share button clicked', async () => {
      wrapper = mount(ShareButton, {
        props: mockProps,
      })

      await wrapper.find('[data-testid="share-button"]').trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-testid="share-dropdown"]').exists()).toBe(true)
    })

    it('should show all three share options in dropdown', async () => {
      wrapper = mount(ShareButton, {
        props: mockProps,
      })

      await wrapper.find('[data-testid="share-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="twitter-share"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="facebook-share"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="copy-link"]').exists()).toBe(true)

      expect(wrapper.find('[data-testid="twitter-share"]').text()).toContain('Twitter')
      expect(wrapper.find('[data-testid="facebook-share"]').text()).toContain('Facebook')
      expect(wrapper.find('[data-testid="copy-link"]').text()).toContain('Copy Link')
    })

    it('should close dropdown when clicked again', async () => {
      wrapper = mount(ShareButton, {
        props: mockProps,
      })

      const shareBtn = wrapper.find('[data-testid="share-button"]')
      await shareBtn.trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-testid="share-dropdown"]').exists()).toBe(true)

      await shareBtn.trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.dropdownOpen).toBe(false)
    })
  })

  describe('Twitter Share', () => {
    it('should open Twitter share with correct URL and text', async () => {
      wrapper = mount(ShareButton, {
        props: mockProps,
      })

      await wrapper.find('[data-testid="share-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      const twitterBtn = wrapper.find('[data-testid="twitter-share"]')
      await twitterBtn.trigger('click')

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('https://twitter.com/intent/tweet'),
        '_blank',
        'width=550,height=420,noopener,noreferrer'
      )

      const openMock = window.open as unknown as ReturnType<typeof vi.fn>
      const callArgs = openMock.mock.calls[0][0] as string

      expect(callArgs).toContain(encodeURIComponent('What if... Harry Potter in Slytherin? 🤔'))
      expect(callArgs).toContain(
        encodeURIComponent('http://localhost:5173/scenarios/123e4567-e89b-12d3-a456-426614174000')
      )
    })

    it('should close dropdown after Twitter share', async () => {
      wrapper = mount(ShareButton, {
        props: mockProps,
      })

      await wrapper.find('[data-testid="share-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      const twitterBtn = wrapper.find('[data-testid="twitter-share"]')
      await twitterBtn.trigger('click')

      expect(wrapper.vm.dropdownOpen).toBe(false)
    })
  })

  describe('Facebook Share', () => {
    it('should open Facebook share with correct URL', async () => {
      wrapper = mount(ShareButton, {
        props: mockProps,
      })

      await wrapper.find('[data-testid="share-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      const facebookBtn = wrapper.find('[data-testid="facebook-share"]')
      await facebookBtn.trigger('click')

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('https://www.facebook.com/sharer/sharer.php'),
        '_blank',
        'width=550,height=420,noopener,noreferrer'
      )

      const openMock = window.open as unknown as ReturnType<typeof vi.fn>
      const callArgs = openMock.mock.calls[0][0] as string

      expect(callArgs).toContain(
        encodeURIComponent('http://localhost:5173/scenarios/123e4567-e89b-12d3-a456-426614174000')
      )
    })

    it('should close dropdown after Facebook share', async () => {
      wrapper = mount(ShareButton, {
        props: mockProps,
      })

      await wrapper.find('[data-testid="share-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      const facebookBtn = wrapper.find('[data-testid="facebook-share"]')
      await facebookBtn.trigger('click')

      expect(wrapper.vm.dropdownOpen).toBe(false)
    })
  })

  describe('Copy Link', () => {
    it('should copy link to clipboard', async () => {
      wrapper = mount(ShareButton, {
        props: mockProps,
      })

      await wrapper.find('[data-testid="share-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      const copyBtn = wrapper.find('[data-testid="copy-link"]')
      await copyBtn.trigger('click')

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'http://localhost:5173/scenarios/123e4567-e89b-12d3-a456-426614174000'
      )
    })

    it('should emit linkCopied event', async () => {
      wrapper = mount(ShareButton, {
        props: mockProps,
      })

      await wrapper.find('[data-testid="share-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      const copyBtn = wrapper.find('[data-testid="copy-link"]')
      await copyBtn.trigger('click')

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(wrapper.emitted('linkCopied')).toBeTruthy()
    })

    it('should fallback to execCommand when clipboard API unavailable', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      document.execCommand = vi.fn().mockReturnValue(true)

      wrapper = mount(ShareButton, {
        props: mockProps,
      })

      await wrapper.find('[data-testid="share-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      const copyBtn = wrapper.find('[data-testid="copy-link"]')
      await copyBtn.trigger('click')

      expect(document.execCommand).toHaveBeenCalledWith('copy')
    })

    it('should close dropdown after copying link', async () => {
      wrapper = mount(ShareButton, {
        props: mockProps,
      })

      await wrapper.find('[data-testid="share-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      const copyBtn = wrapper.find('[data-testid="copy-link"]')
      await copyBtn.trigger('click')

      await wrapper.vm.$nextTick()
      expect(wrapper.vm.dropdownOpen).toBe(false)
    })
  })

  describe('Click Outside', () => {
    it('should close dropdown when clicking outside', async () => {
      wrapper = mount(ShareButton, {
        props: mockProps,
        attachTo: document.body,
      })

      await wrapper.find('[data-testid="share-button"]').trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.dropdownOpen).toBe(true)

      document.body.click()
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.dropdownOpen).toBe(false)
    })

    it('should not close dropdown when clicking inside', async () => {
      wrapper = mount(ShareButton, {
        props: mockProps,
        attachTo: document.body,
      })

      await wrapper.find('[data-testid="share-button"]').trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.dropdownOpen).toBe(true)

      const dropdown = wrapper.find('[data-testid="share-dropdown"]')
      await dropdown.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.dropdownOpen).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('should have aria-label on share button', () => {
      wrapper = mount(ShareButton, {
        props: mockProps,
      })

      const shareBtn = wrapper.find('[data-testid="share-button"]')
      expect(shareBtn.attributes('aria-label')).toBe('Share scenario')
    })

    it('should be keyboard accessible', async () => {
      wrapper = mount(ShareButton, {
        props: mockProps,
      })

      const shareBtn = wrapper.find('[data-testid="share-button"]')

      await shareBtn.trigger('keydown.enter')
      await shareBtn.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="share-dropdown"]').exists()).toBe(true)
    })
  })

  describe('URL Generation', () => {
    it('should generate correct scenario URL', async () => {
      wrapper = mount(ShareButton, {
        props: mockProps,
      })

      await wrapper.find('[data-testid="share-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      const copyBtn = wrapper.find('[data-testid="copy-link"]')
      await copyBtn.trigger('click')

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'http://localhost:5173/scenarios/123e4567-e89b-12d3-a456-426614174000'
      )
    })
  })

  describe('Toast Notification', () => {
    it('should show toast after copying link', async () => {
      wrapper = mount(ShareButton, {
        props: mockProps,
      })

      await wrapper.find('[data-testid="share-button"]').trigger('click')
      await wrapper.vm.$nextTick()

      const copyBtn = wrapper.find('[data-testid="copy-link"]')
      await copyBtn.trigger('click')

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 100))

      const toast = document.body.querySelector('div[style*="position: fixed"]')
      expect(toast).toBeTruthy()
      if (toast) {
        expect(toast.textContent).toContain('Link copied')
      }
    })
  })
})
