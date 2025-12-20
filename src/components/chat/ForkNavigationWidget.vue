<!-- eslint-disable @typescript-eslint/explicit-function-return-type -->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { css } from '../../../styled-system/css'

export interface ForkSummary {
  id: string
  firstMessagePreview: string
  isRoot: boolean
  hasBeenForked: boolean
  messageCount: number
  likeCount: number
  creator?: {
    username: string
    avatarUrl?: string
  }
}

export interface ForkRelationship {
  current: ForkSummary
  parent: ForkSummary | null
  child: ForkSummary | null
  forkStatus: 'root_can_fork' | 'root_forked' | 'fork'
}

interface Props {
  conversationId: string
  forkRelationship: ForkRelationship | null
  isLoading?: boolean
  hasError?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  hasError: false,
})
const router = useRouter()

// i18n messages (준비 - 향후 i18n 라이브러리로 대체 가능)
const messages = {
  loading: '분기 정보 로딩 중...',
  error: '분기 정보를 불러올 수 없습니다',
  forkedFrom: '분기됨:',
  originalConversation: '원본 대화',
  forkedConversation: '분기된 대화',
  forks: '분기',
  messageCount: (count: number) => `${count}개의 메시지`,
  navigateToOriginal: (title: string) => `원본 대화로 이동: ${title}`,
  viewForksList: '분기된 대화 목록 보기',
  forksList: '분기된 대화 목록',
  navigateToFork: (preview: string) => `분기된 대화로 이동: ${preview}`,
  navigationLabel: '대화 분기 탐색',
}

// State
const showForkDropdown = ref(false)
const dropdownRef = ref<HTMLDivElement | null>(null)
const dropdownButtonRef = ref<HTMLButtonElement | null>(null)

// Computed
const isRoot = computed(() => props.forkRelationship?.current.isRoot === true)
const isFork = computed(() => props.forkRelationship?.current.isRoot === false)
const hasParent = computed(() => props.forkRelationship?.parent !== null)
const hasChild = computed(() => props.forkRelationship?.child !== null)

const parentTitle = computed(() => {
  if (!props.forkRelationship?.parent) return ''
  return props.forkRelationship.parent.firstMessagePreview || messages.originalConversation
})

const childPreview = computed(() => {
  if (!props.forkRelationship?.child) return ''
  return props.forkRelationship.child.firstMessagePreview || messages.forkedConversation
})

// Methods
function navigateToParent(): void {
  if (props.forkRelationship?.parent) {
    router.push(`/conversations/${props.forkRelationship.parent.id}`)
  }
}

function navigateToChild(): void {
  if (props.forkRelationship?.child) {
    closeDropdown()
    router.push(`/conversations/${props.forkRelationship.child.id}`)
  }
}

function toggleDropdown(): void {
  showForkDropdown.value = !showForkDropdown.value
}

function openDropdown(): void {
  showForkDropdown.value = true
}

function closeDropdown(): void {
  showForkDropdown.value = false
}

// Handle click outside to close dropdown
function handleClickOutside(event: MouseEvent): void {
  if (!dropdownRef.value || !dropdownButtonRef.value) return

  const target = event.target as Node
  if (!dropdownRef.value.contains(target) && !dropdownButtonRef.value.contains(target)) {
    closeDropdown()
  }
}

// Handle keyboard navigation
function handleKeydown(event: KeyboardEvent): void {
  if (!showForkDropdown.value) {
    // Open dropdown with Enter or Space when button is focused
    if (event.key === 'Enter' || event.key === ' ') {
      const activeElement = document.activeElement
      if (activeElement === dropdownButtonRef.value) {
        event.preventDefault()
        openDropdown()
      }
    }
    return
  }

  // Handle keys when dropdown is open
  switch (event.key) {
    case 'Escape':
      event.preventDefault()
      closeDropdown()
      dropdownButtonRef.value?.focus()
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      navigateToChild()
      break
    case 'Tab':
      // Close dropdown when tabbing away
      closeDropdown()
      break
  }
}

// Setup and cleanup event listeners
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})

// Watch for conversation ID changes to close dropdown
watch(
  () => props.conversationId,
  () => {
    closeDropdown()
  }
)

// Styles
const styles = {
  widget: css({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem 0',
    fontSize: '0.875rem',
    color: 'neutral.700',
    flexWrap: 'wrap',
    '@media (max-width: 640px)': {
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '0.5rem',
    },
  }),
  icon: css({
    fontSize: '1rem',
  }),
  parentLink: css({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'blue.600',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'color 0.2s',
    '&:hover': {
      color: 'blue.700',
      textDecoration: 'underline',
    },
    '&:focus': {
      outline: '2px solid',
      outlineColor: 'blue.500',
      outlineOffset: '2px',
      borderRadius: '0.25rem',
    },
  }),
  parentText: css({
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    '@media (max-width: 640px)': {
      maxWidth: '150px',
    },
  }),
  separator: css({
    color: 'neutral.400',
  }),
  dropdownContainer: css({
    position: 'relative',
  }),
  dropdownButton: css({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.25rem 0.75rem',
    backgroundColor: 'purple.50',
    color: 'purple.700',
    border: '1px solid',
    borderColor: 'purple.200',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: 'purple.100',
      borderColor: 'purple.300',
    },
    '&:focus': {
      outline: '2px solid',
      outlineColor: 'purple.500',
      outlineOffset: '2px',
    },
  }),
  dropdownMenu: css({
    position: 'absolute',
    top: 'calc(100% + 0.5rem)',
    left: 0,
    minWidth: '280px',
    backgroundColor: 'white',
    border: '1px solid',
    borderColor: 'neutral.200',
    borderRadius: '0.5rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    zIndex: 50,
    overflow: 'hidden',
    animation: 'slideDown 0.2s ease-out',
    transformOrigin: 'top',
    '@media (max-width: 640px)': {
      left: 'auto',
      right: 0,
      minWidth: '240px',
    },
  }),
  dropdownItem: css({
    display: 'block',
    padding: '0.75rem 1rem',
    color: 'neutral.900',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    borderBottom: '1px solid',
    borderColor: 'neutral.100',
    '&:hover': {
      backgroundColor: 'neutral.50',
    },
    '&:focus': {
      backgroundColor: 'neutral.100',
      outline: '2px solid',
      outlineColor: 'blue.500',
      outlineOffset: '-2px',
    },
    '&:last-child': {
      borderBottom: 'none',
    },
  }),
  dropdownItemPreview: css({
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'neutral.900',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  dropdownItemMeta: css({
    fontSize: '0.75rem',
    color: 'neutral.500',
    marginTop: '0.25rem',
  }),
  emptyState: css({
    padding: '1rem',
    textAlign: 'center',
    color: 'neutral.500',
    fontSize: '0.875rem',
  }),
  loadingState: css({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0',
    fontSize: '0.875rem',
    color: 'neutral.500',
  }),
  errorState: css({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    color: 'red.600',
    backgroundColor: 'red.50',
    borderRadius: '0.375rem',
  }),
  chevron: css({
    transition: 'transform 0.3s ease-in-out',
    display: 'inline-block',
  }),
  chevronOpen: css({
    transform: 'rotate(180deg)',
  }),
  // Keyframe animation for dropdown
  '@keyframes slideDown': {
    from: {
      opacity: 0,
      transform: 'translateY(-10px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
}
</script>

<template>
  <!-- Loading state -->
  <output v-if="isLoading" :class="styles.loadingState" aria-live="polite">
    <span aria-hidden="true">⏳</span>
    <span>{{ messages.loading }}</span>
  </output>

  <!-- Error state -->
  <div v-else-if="hasError" :class="styles.errorState" role="alert" aria-live="assertive">
    <span aria-hidden="true">⚠️</span>
    <span>{{ messages.error }}</span>
  </div>

  <!-- Normal state -->
  <nav v-else-if="forkRelationship" :class="styles.widget" :aria-label="messages.navigationLabel">
    <!-- Forked conversation: Show parent link -->
    <template v-if="isFork && hasParent">
      <img
        src="/Logo.svg"
        alt=""
        :class="styles.icon"
        aria-hidden="true"
        style="width: 1em; height: 1em"
      />
      <span>{{ messages.forkedFrom }}</span>
      <a
        data-testid="parent-conversation-link"
        :class="styles.parentLink"
        tabindex="0"
        role="link"
        :aria-label="messages.navigateToOriginal(parentTitle)"
        @click="navigateToParent"
        @keydown.enter="navigateToParent"
      >
        <span :class="styles.parentText">{{ parentTitle }}</span>
      </a>
    </template>

    <!-- Root conversation with child: Show "Forks (1)" dropdown -->
    <template v-if="isRoot && hasChild">
      <span :class="styles.separator" aria-hidden="true">•</span>
      <div ref="dropdownRef" :class="styles.dropdownContainer">
        <button
          ref="dropdownButtonRef"
          :class="styles.dropdownButton"
          :aria-expanded="showForkDropdown"
          aria-haspopup="true"
          :aria-label="messages.viewForksList"
          @click="toggleDropdown"
        >
          <span>{{ messages.forks }} (1)</span>
          <span :class="[styles.chevron, showForkDropdown && styles.chevronOpen]" aria-hidden="true"
            >▼</span
          >
        </button>

        <!-- Dropdown menu -->
        <div
          v-if="showForkDropdown"
          :class="styles.dropdownMenu"
          role="menu"
          :aria-label="messages.forksList"
        >
          <div
            :class="styles.dropdownItem"
            data-testid="child-fork-item"
            role="menuitem"
            tabindex="0"
            :aria-label="messages.navigateToFork(childPreview)"
            @click="navigateToChild"
            @keydown.enter="navigateToChild"
            @keydown.space.prevent="navigateToChild"
          >
            <div :class="styles.dropdownItemPreview">
              {{ childPreview }}
            </div>
            <div :class="styles.dropdownItemMeta">
              {{ messages.messageCount(forkRelationship.child?.messageCount || 0) }}
            </div>
          </div>
        </div>
      </div>
    </template>
  </nav>
</template>
