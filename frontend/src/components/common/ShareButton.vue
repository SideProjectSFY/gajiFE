<template>
  <div
    ref="containerRef"
    class="share-button-container"
  >
    <button
      :class="shareButtonClass"
      aria-label="Share scenario"
      data-testid="share-button"
      @click="toggleDropdown"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle
          cx="18"
          cy="5"
          r="3"
        />
        <circle
          cx="6"
          cy="12"
          r="3"
        />
        <circle
          cx="18"
          cy="19"
          r="3"
        />
        <line
          x1="8.59"
          y1="13.51"
          x2="15.42"
          y2="17.49"
        />
        <line
          x1="15.41"
          y1="6.51"
          x2="8.59"
          y2="10.49"
        />
      </svg>
      <span>Share</span>
    </button>

    <transition name="dropdown-fade">
      <div
        v-if="dropdownOpen"
        :class="dropdownClass"
        data-testid="share-dropdown"
      >
        <button
          :class="shareOptionClass"
          data-testid="twitter-share"
          @click="shareTwitter"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"
            />
          </svg>
          <span>Share on Twitter</span>
        </button>

        <button
          :class="shareOptionClass"
          data-testid="facebook-share"
          @click="shareFacebook"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
          </svg>
          <span>Share on Facebook</span>
        </button>

        <button
          :class="shareOptionClass"
          data-testid="copy-link"
          @click="copyLink"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <span>Copy Link</span>
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { css } from '@/../styled-system/css'

interface Props {
  scenarioId: string
  scenarioTitle: string
  baseStory: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  linkCopied: []
}>()

const dropdownOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)

const toggleDropdown = (event: Event) => {
  event.stopPropagation()
  dropdownOpen.value = !dropdownOpen.value
}

const shareTwitter = () => {
  const text = `What if... ${props.baseStory}? 🤔 Check out this scenario on Gaji!`
  const url = `${window.location.origin}/scenarios/${props.scenarioId}`
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    text
  )}&url=${encodeURIComponent(url)}`

  window.open(twitterUrl, '_blank', 'width=550,height=420,noopener,noreferrer')
  dropdownOpen.value = false
}

const shareFacebook = () => {
  const url = `${window.location.origin}/scenarios/${props.scenarioId}`
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`

  window.open(facebookUrl, '_blank', 'width=550,height=420,noopener,noreferrer')
  dropdownOpen.value = false
}

const copyLink = async () => {
  const url = `${window.location.origin}/scenarios/${props.scenarioId}`

  try {
    await navigator.clipboard.writeText(url)
    emit('linkCopied')
    showToast('Link copied with preview! 🎉')
  } catch (error) {
    // Fallback for older browsers
    const input = document.createElement('input')
    input.value = url
    input.style.position = 'fixed'
    input.style.opacity = '0'
    document.body.appendChild(input)
    input.select()
    try {
      document.execCommand('copy')
      emit('linkCopied')
      showToast('Link copied! 🎉')
    } catch (err) {
      console.error('Failed to copy link:', err)
      showToast('Failed to copy link')
    }
    document.body.removeChild(input)
  }

  dropdownOpen.value = false
}

const showToast = (message: string) => {
  // Simple toast implementation - you can replace with your toast library
  const toast = document.createElement('div')
  toast.textContent = message
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    font-size: 14px;
    font-weight: 500;
    animation: slideIn 0.3s ease;
  `

  const style = document.createElement('style')
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `
  document.head.appendChild(style)
  document.body.appendChild(toast)

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s, transform 0.3s'
    toast.style.opacity = '0'
    toast.style.transform = 'translateX(400px)'
    setTimeout(() => {
      document.body.removeChild(toast)
      document.head.removeChild(style)
    }, 300)
  }, 3000)
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    dropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// PandaCSS classes
const shareButtonClass = css({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 16px',
  fontSize: '14px',
  fontWeight: '500',
  color: '#6b7280',
  backgroundColor: 'white',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  _hover: {
    color: '#667eea',
    borderColor: '#667eea',
    backgroundColor: '#f5f7ff',
  },
})

const dropdownClass = css({
  position: 'absolute',
  top: 'calc(100% + 8px)',
  right: 0,
  backgroundColor: 'white',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  minWidth: '200px',
  overflow: 'hidden',
  zIndex: 10,
})

const shareOptionClass = css({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  width: '100%',
  padding: '12px 16px',
  fontSize: '14px',
  fontWeight: '500',
  color: '#374151',
  backgroundColor: 'white',
  border: 'none',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
  textAlign: 'left',
  _hover: {
    backgroundColor: '#f9fafb',
  },
  _notLast: {
    borderBottom: '1px solid #f3f4f6',
  },
})
</script>

<style scoped>
.share-button-container {
  position: relative;
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
