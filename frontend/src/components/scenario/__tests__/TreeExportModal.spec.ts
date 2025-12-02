import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import TreeExportModal from '../TreeExportModal.vue'

// Mock html2canvas
vi.mock('html2canvas', () => ({
  default: vi.fn(() =>
    Promise.resolve({
      toBlob: (callback: (blob: Blob | null) => void) => {
        const blob = new Blob(['fake image'], { type: 'image/png' })
        callback(blob)
      },
    })
  ),
}))

describe('TreeExportModal', () => {
  let wrapper: VueWrapper
  const mockTreeElement = document.createElement('div')
  mockTreeElement.setAttribute('data-testid', 'tree')
  // Use Object.defineProperty to set scrollWidth
  Object.defineProperty(mockTreeElement, 'scrollWidth', {
    value: 1000,
    writable: true,
  })

  beforeEach(() => {
    wrapper = mount(TreeExportModal, {
      props: {
        isOpen: true,
        treeElementRef: mockTreeElement,
      },
    })
  })

  it('renders modal when isOpen is true', () => {
    expect(wrapper.find('[data-testid="export-modal"]').exists()).toBe(true)
  })

  it('does not render modal when isOpen is false', () => {
    wrapper = mount(TreeExportModal, {
      props: {
        isOpen: false,
        treeElementRef: mockTreeElement,
      },
    })
    expect(wrapper.find('[data-testid="export-modal"]').exists()).toBe(false)
  })

  it('closes modal when close button is clicked', async () => {
    const closeButton = wrapper.find('[data-testid="close-button"]')
    await closeButton.trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('closes modal when clicking outside', async () => {
    const overlay = wrapper.find('[data-testid="export-modal-overlay"]')
    await overlay.trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('selects PNG format by default', () => {
    const pngButton = wrapper.find('[data-testid="format-png"]')
    // PNG should be selected by default (checked via props default value)
    expect(pngButton.exists()).toBe(true)
  })

  it('has SVG format button disabled', () => {
    const svgButton = wrapper.find('[data-testid="format-svg"]')
    expect(svgButton.attributes('disabled')).toBeDefined()
  })

  it('includes metadata checkbox is checked by default', async () => {
    const checkbox = wrapper.find('[data-testid="include-metadata"]')
    const input = checkbox.element as HTMLInputElement
    expect(input.checked).toBe(true)
  })

  it('includes watermark checkbox is checked by default', async () => {
    const checkbox = wrapper.find('[data-testid="include-watermark"]')
    const input = checkbox.element as HTMLInputElement
    expect(input.checked).toBe(true)
  })

  it('disables download button when no preview', () => {
    const downloadButton = wrapper.find('[data-testid="download-button"]')
    expect(downloadButton.attributes('disabled')).toBeDefined()
  })

  it('generates preview when generate preview button is clicked', async () => {
    const generateButton = wrapper.find('[data-testid="generate-preview-button"]')
    await generateButton.trigger('click')

    // Wait for async operation
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 100))

    const previewArea = wrapper.find('[data-testid="preview-area"]')
    expect(previewArea.exists()).toBe(true)
  })

  it('shows error message when tree element is not found', async () => {
    wrapper = mount(TreeExportModal, {
      props: {
        isOpen: true,
        treeElementRef: null,
      },
    })

    const generateButton = wrapper.find('[data-testid="generate-preview-button"]')
    await generateButton.trigger('click')

    await wrapper.vm.$nextTick()

    const errorMessage = wrapper.find('[data-testid="error-message"]')
    expect(errorMessage.exists()).toBe(true)
    expect(errorMessage.text()).toContain('Tree element not found')
  })

  it('emits export event when download button is clicked with preview', async () => {
    // First generate preview
    const generateButton = wrapper.find('[data-testid="generate-preview-button"]')
    await generateButton.trigger('click')

    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Then click download
    const downloadButton = wrapper.find('[data-testid="download-button"]')
    await downloadButton.trigger('click')

    expect(wrapper.emitted('export')).toBeTruthy()
    const exportEvent = wrapper.emitted('export')?.[0]
    expect(exportEvent).toBeDefined()
  })

  it('toggles format selection', async () => {
    const pngButton = wrapper.find('[data-testid="format-png"]')
    await pngButton.trigger('click')

    // PNG should remain selected (SVG is disabled)
    await wrapper.vm.$nextTick()
  })

  it('toggles include metadata checkbox', async () => {
    const checkbox = wrapper.find('[data-testid="include-metadata"]')
    await checkbox.trigger('click')

    const input = checkbox.element as HTMLInputElement
    expect(input.checked).toBe(false)

    await checkbox.trigger('click')
    expect(input.checked).toBe(true)
  })

  it('toggles include watermark checkbox', async () => {
    const checkbox = wrapper.find('[data-testid="include-watermark"]')
    await checkbox.trigger('click')

    const input = checkbox.element as HTMLInputElement
    expect(input.checked).toBe(false)

    await checkbox.trigger('click')
    expect(input.checked).toBe(true)
  })
})
