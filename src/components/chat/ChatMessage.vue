<!-- Chat Message Bubble Component -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useClipboard } from '@vueuse/core'
import { css } from '../../../styled-system/css'
import type { Message } from '@/stores/conversation'

interface Props {
  message: Message
  isLatest?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLatest: false,
})

const isUser = computed(() => props.message.role === 'user')
const isSystem = computed(() => props.message.role === 'system')
const showCopyFeedback = ref(false)

// Clipboard functionality
const { copy, isSupported: isClipboardSupported } = useClipboard()

// Format timestamp
const formattedTime = computed(() => {
  const date = new Date(props.message.timestamp)
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
})

// Copy message to clipboard
async function handleCopy(): Promise<void> {
  if (!isClipboardSupported.value) return

  try {
    await copy(props.message.content)
    showCopyFeedback.value = true
    setTimeout(() => {
      showCopyFeedback.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to copy message:', error)
  }
}

// Static styles
const styles = {
  messageWrapper: css({
    display: 'flex',
    marginBottom: '1rem',
    animation: 'fadeIn 0.3s ease-in',
    position: 'relative',
  }),
  userWrapper: css({
    justifyContent: 'flex-end',
  }),
  assistantWrapper: css({
    justifyContent: 'flex-start',
  }),
  bubbleContainer: css({
    position: 'relative',
    maxWidth: { base: '85%', md: '70%' },
    '&:hover .copy-button': {
      opacity: 1,
    },
  }),
  bubble: css({
    padding: '0.75rem 1rem',
    borderRadius: '1rem',
    wordWrap: 'break-word',
    whiteSpace: 'pre-wrap',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  }),
  userBubble: css({
    backgroundColor: '#1F7D51',
    color: 'white',
    borderBottomRightRadius: '0.25rem',
  }),
  assistantBubble: css({
    backgroundColor: 'neutral.100',
    color: 'neutral.900',
    borderBottomLeftRadius: '0.25rem',
  }),
  systemBubble: css({
    backgroundColor: 'gray.100',
    color: 'gray.700',
    borderRadius: '0.5rem',
    border: '1px solid',
    borderColor: 'gray.300',
    fontStyle: 'italic',
  }),
  content: css({
    fontSize: '0.95rem',
    lineHeight: '1.6',
  }),
  metaRow: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '0.5rem',
    gap: '0.5rem',
  }),
  timestamp: css({
    fontSize: '0.75rem',
    opacity: 0.7,
  }),
  copyButton: css({
    opacity: 0,
    transition: 'opacity 0.2s ease',
    padding: '0.25rem',
    borderRadius: '0.25rem',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    '&:focus-visible': {
      opacity: 1,
      outline: '2px solid',
      outlineColor: 'blue.500',
      outlineOffset: '2px',
    },
  }),
  copyButtonUser: css({
    color: 'white',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
  }),
  copyButtonAssistant: css({
    color: 'neutral.600',
  }),
  copyFeedback: css({
    position: 'absolute',
    top: '-2rem',
    right: '0',
    padding: '0.25rem 0.5rem',
    backgroundColor: 'green.500',
    color: 'white',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    animation: 'fadeIn 0.2s ease-in',
  }),
}
</script>

<template>
  <div
    :class="[
      styles.messageWrapper,
      isSystem ? '' : isUser ? styles.userWrapper : styles.assistantWrapper,
    ]"
    :data-role="message.role"
    data-testid="message-item"
    :aria-label="`${isSystem ? '시스템 메시지' : isUser ? '내 메시지' : 'AI 응답'}: ${message.content}`"
  >
    <div :class="styles.bubbleContainer">
      <!-- Copy feedback toast -->
      <output v-if="showCopyFeedback" :class="styles.copyFeedback" aria-live="polite">
        복사됨!
      </output>

      <div
        :class="[
          styles.bubble,
          isSystem ? styles.systemBubble : isUser ? styles.userBubble : styles.assistantBubble,
        ]"
        :data-testid="
          isSystem
            ? 'system-message'
            : message.role === 'assistant'
              ? 'assistant-message'
              : message.role === 'user'
                ? 'user-message'
                : `message-${message.role}`
        "
      >
        <div :class="styles.content">
          {{ message.content }}
        </div>
        <div :class="styles.metaRow">
          <span :class="styles.timestamp">
            {{ formattedTime }}
          </span>
          <button
            v-if="isClipboardSupported"
            :class="[
              styles.copyButton,
              isUser ? styles.copyButtonUser : styles.copyButtonAssistant,
              'copy-button',
            ]"
            :data-testid="`copy-button-${message.role}`"
            aria-label="메시지 복사"
            @click="handleCopy"
          >
            <span>📋</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
