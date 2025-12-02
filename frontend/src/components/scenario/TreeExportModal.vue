<template>
  <div
    v-if="isOpen"
    data-testid="export-modal-overlay"
    :class="css(overlayStyles)"
    @click.self="closeModal"
  >
    <div
      data-testid="export-modal"
      :class="css(modalStyles)"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <!-- Header -->
      <div :class="css(headerStyles)">
        <h2
          id="export-modal-title"
          :class="css({ fontSize: '1.25rem', fontWeight: '600', color: 'gray.900' })"
        >
          Export Scenario Tree
        </h2>
        <button
          data-testid="close-button"
          :class="css(closeButtonStyles)"
          aria-label="Close export modal"
          @click="closeModal"
        >
          ✕
        </button>
      </div>

      <!-- Content -->
      <div :class="css(contentStyles)">
        <!-- Format Selection -->
        <div :class="css(sectionStyles)">
          <label :class="css(labelStyles)"> Export Format </label>
          <div :class="css({ display: 'flex', gap: '2' })">
            <button
              data-testid="format-png"
              :class="getFormatButtonClass('png')"
              @click="selectedFormat = 'png'"
            >
              PNG (High Quality)
            </button>
            <button
              data-testid="format-svg"
              :class="getFormatButtonClass('svg')"
              disabled
              title="SVG export coming soon"
            >
              SVG (Coming Soon)
            </button>
          </div>
        </div>

        <!-- Include Metadata -->
        <div :class="css(sectionStyles)">
          <label :class="css({ display: 'flex', alignItems: 'center', gap: '2' })">
            <input
              v-model="includeMetadata"
              data-testid="include-metadata"
              type="checkbox"
              :class="css({ cursor: 'pointer' })"
            >
            <span :class="css(labelStyles)">Include metadata (author, date, stats)</span>
          </label>
        </div>

        <!-- Preview Area -->
        <div :class="css(sectionStyles)">
          <label :class="css(labelStyles)"> Preview </label>
          <div
            data-testid="preview-area"
            :class="css(previewStyles)"
            :style="{ backgroundImage: previewUrl ? `url(${previewUrl})` : 'none' }"
          >
            <div
              v-if="isGenerating"
              :class="css({ textAlign: 'center', color: 'gray.500' })"
              role="status"
              aria-live="polite"
            >
              <div :class="css({ fontSize: '2rem', mb: '2' })">
                ⏳
              </div>
              <div>Generating preview...</div>
            </div>
            <div
              v-else-if="!previewUrl"
              :class="css({ textAlign: 'center', color: 'gray.400' })"
            >
              <div :class="css({ fontSize: '2rem', mb: '2' })">
                🖼️
              </div>
              <div>Click "Generate Preview" to see how your export will look</div>
            </div>
          </div>
        </div>

        <!-- Export Options -->
        <div :class="css(sectionStyles)">
          <label :class="css(labelStyles)"> Export Options </label>
          <div :class="css({ display: 'flex', flexDirection: 'column', gap: '2' })">
            <label :class="css({ display: 'flex', alignItems: 'center', gap: '2' })">
              <input
                v-model="includeWatermark"
                data-testid="include-watermark"
                type="checkbox"
                :class="css({ cursor: 'pointer' })"
              >
              <span :class="css({ fontSize: '0.875rem', color: 'gray.700' })">Include "Gaji - What If Scenarios" watermark</span>
            </label>
          </div>
        </div>

        <!-- Error Message -->
        <div
          v-if="errorMessage"
          data-testid="error-message"
          :class="css(errorStyles)"
          role="alert"
        >
          {{ errorMessage }}
        </div>
      </div>

      <!-- Footer -->
      <div :class="css(footerStyles)">
        <button
          data-testid="generate-preview-button"
          :class="css(secondaryButtonStyles)"
          :disabled="isGenerating"
          @click="generatePreview"
        >
          {{ isGenerating ? 'Generating...' : 'Generate Preview' }}
        </button>
        <button
          data-testid="download-button"
          :class="css(primaryButtonStyles)"
          :disabled="isGenerating || !previewUrl"
          @click="downloadImage"
        >
          Download {{ selectedFormat.toUpperCase() }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { css } from 'styled-system/css'
import html2canvas from 'html2canvas'

// Props
interface Props {
  isOpen: boolean
  treeElementRef: HTMLElement | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  export: [options: ExportOptions]
}>()

// Types
interface ExportOptions {
  format: 'png' | 'svg'
  includeMetadata: boolean
  includeWatermark: boolean
}

// State
const selectedFormat = ref<'png' | 'svg'>('png')
const includeMetadata = ref(true)
const includeWatermark = ref(true)
const previewUrl = ref<string | null>(null)
const isGenerating = ref(false)
const errorMessage = ref<string | null>(null)

// Methods
const closeModal = (): void => {
  emit('close')
  // Reset state
  previewUrl.value = null
  errorMessage.value = null
}

const getFormatButtonClass = (format: 'png' | 'svg'): string => {
  const isSelected = selectedFormat.value === format
  return css({
    flex: '1',
    px: '4',
    py: '2',
    border: '2px solid',
    borderColor: isSelected ? 'blue.600' : 'gray.300',
    borderRadius: 'md',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: isSelected ? 'blue.600' : 'gray.700',
    bg: isSelected ? 'blue.50' : 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover:not(:disabled)': {
      borderColor: 'blue.400',
      bg: 'blue.50',
    },
    '&:disabled': {
      opacity: '0.5',
      cursor: 'not-allowed',
    },
  })
}

const generatePreview = async (): Promise<void> => {
  if (!props.treeElementRef) {
    errorMessage.value = 'Tree element not found. Please try again.'
    return
  }

  isGenerating.value = true
  errorMessage.value = null

  try {
    // Clone the tree element to avoid modifying the original
    const clonedElement = props.treeElementRef.cloneNode(true) as HTMLElement

    // Apply watermark if enabled
    if (includeWatermark.value) {
      const watermark = document.createElement('div')
      watermark.textContent = 'Gaji - What If Scenarios'
      watermark.style.cssText = `
        position: absolute;
        bottom: 16px;
        right: 16px;
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        color: #3b82f6;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      `
      clonedElement.style.position = 'relative'
      clonedElement.appendChild(watermark)
    }

    // Temporarily append to body for rendering
    clonedElement.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: ${props.treeElementRef.scrollWidth}px;
      background: white;
      padding: 32px;
    `
    document.body.appendChild(clonedElement)

    // Generate canvas
    const canvas = await html2canvas(clonedElement, {
      backgroundColor: '#ffffff',
      scale: 2, // High quality
      logging: false,
      useCORS: true,
      allowTaint: true,
    })

    // Remove cloned element
    document.body.removeChild(clonedElement)

    // Convert canvas to blob and create preview URL
    canvas.toBlob((blob) => {
      if (blob) {
        // Revoke previous URL to prevent memory leak
        if (previewUrl.value) {
          URL.revokeObjectURL(previewUrl.value)
        }
        previewUrl.value = URL.createObjectURL(blob)
      }
    }, 'image/png')
  } catch (err) {
    console.error('Failed to generate preview:', err)
    errorMessage.value = 'Failed to generate preview. Please try again.'
  } finally {
    isGenerating.value = false
  }
}

const downloadImage = (): void => {
  if (!previewUrl.value) {
    errorMessage.value = 'Please generate a preview first.'
    return
  }

  // Create download link
  const link = document.createElement('a')
  link.href = previewUrl.value
  link.download = `gaji-scenario-tree-${Date.now()}.${selectedFormat.value}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Emit export event
  emit('export', {
    format: selectedFormat.value,
    includeMetadata: includeMetadata.value,
    includeWatermark: includeWatermark.value,
  })
}

// Watch for modal close to cleanup preview URL
watch(
  () => props.isOpen,
  (newValue) => {
    if (!newValue && previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = null
    }
  }
)

// Styles
const overlayStyles = {
  position: 'fixed',
  inset: '0',
  bg: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: '50',
  padding: '4',
}

const modalStyles = {
  bg: 'white',
  borderRadius: 'lg',
  boxShadow: 'xl',
  maxWidth: '42rem',
  width: '100%',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

const headerStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  p: '6',
  borderBottom: '1px solid',
  borderColor: 'gray.200',
}

const closeButtonStyles = {
  fontSize: '1.5rem',
  color: 'gray.400',
  cursor: 'pointer',
  transition: 'color 0.2s',
  bg: 'transparent',
  border: 'none',
  '&:hover': {
    color: 'gray.600',
  },
}

const contentStyles = {
  p: '6',
  overflowY: 'auto',
  flex: '1',
}

const sectionStyles = {
  mb: '4',
}

const labelStyles = {
  display: 'block',
  fontSize: '0.875rem',
  fontWeight: '600',
  color: 'gray.700',
  mb: '2',
}

const previewStyles = {
  width: '100%',
  height: '16rem',
  border: '2px dashed',
  borderColor: 'gray.300',
  borderRadius: 'lg',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  bg: 'gray.50',
  backgroundSize: 'contain',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
}

const errorStyles = {
  p: '3',
  bg: 'red.50',
  border: '1px solid',
  borderColor: 'red.200',
  borderRadius: 'md',
  fontSize: '0.875rem',
  color: 'red.700',
}

const footerStyles = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '3',
  p: '6',
  borderTop: '1px solid',
  borderColor: 'gray.200',
}

const primaryButtonStyles = {
  px: '4',
  py: '2',
  bg: 'blue.600',
  color: 'white',
  borderRadius: 'md',
  fontSize: '0.875rem',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s',
  border: 'none',
  '&:hover:not(:disabled)': {
    bg: 'blue.700',
  },
  '&:disabled': {
    opacity: '0.5',
    cursor: 'not-allowed',
  },
}

const secondaryButtonStyles = {
  px: '4',
  py: '2',
  bg: 'white',
  color: 'gray.700',
  border: '1px solid',
  borderColor: 'gray.300',
  borderRadius: 'md',
  fontSize: '0.875rem',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s',
  '&:hover:not(:disabled)': {
    bg: 'gray.50',
  },
  '&:disabled': {
    opacity: '0.5',
    cursor: 'not-allowed',
  },
}
</script>
