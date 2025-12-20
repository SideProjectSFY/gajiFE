<!-- Chat Input Area Component -->
<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { css } from '../../../styled-system/css'

interface Props {
  disabled?: boolean
  loading?: boolean
}

interface Emits {
  (e: 'send', message: string): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  loading: false,
})

const emit = defineEmits<Emits>()

const message = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const isEmpty = computed(() => message.value.trim().length === 0)
const isDisabled = computed(() => props.disabled || props.loading)
const canSend = computed(() => !isEmpty.value && !isDisabled.value)

// Auto-resize textarea
function adjustTextareaHeight(): void {
  if (!textareaRef.value) return

  textareaRef.value.style.height = 'auto'
  const maxHeight = 120 // 5 rows * ~24px per row
  const scrollHeight = textareaRef.value.scrollHeight

  textareaRef.value.style.height = Math.min(scrollHeight, maxHeight) + 'px'
}

function handleInput(): void {
  adjustTextareaHeight()
}

function handleKeydown(event: KeyboardEvent): void {
  // Enter to send, Shift+Enter for new line
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

function sendMessage(): void {
  if (!canSend.value) return

  const messageText = message.value.trim()
  emit('send', messageText)

  // Clear input
  message.value = ''

  // Reset textarea height
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
    }
  })
}

const styles = {
  container: css({
    padding: '1rem',
    backgroundColor: 'white',
    borderTop: '1px solid',
    borderColor: 'neutral.200',
  }),
  inputWrapper: css({
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-end',
  }),
  textarea: css({
    flex: 1,
    padding: '0.75rem',
    border: '1px solid',
    borderColor: 'neutral.300',
    borderRadius: '0.5rem',
    fontSize: '0.95rem',
    lineHeight: '1.5',
    resize: 'none',
    minHeight: '42px',
    maxHeight: '120px',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    '&:focus': {
      outline: 'none',
      borderColor: 'blue.500',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
    },
    '&:disabled': {
      backgroundColor: 'neutral.100',
      cursor: 'not-allowed',
      color: 'neutral.500',
    },
  }),
  sendButton: css({
    padding: '0.75rem 1.5rem',
    backgroundColor: 'blue.500',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    '&:hover:not(:disabled)': {
      backgroundColor: 'blue.600',
    },
    '&:focus-visible': {
      outline: '2px solid',
      outlineColor: 'blue.500',
      outlineOffset: '2px',
    },
    '&:disabled': {
      backgroundColor: 'neutral.300',
      cursor: 'not-allowed',
    },
  }),
  loadingSpinner: css({
    width: '16px',
    height: '16px',
    border: '2px solid transparent',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  }),
}
</script>

<template>
  <div
    :class="styles.container"
    data-testid="chat-input-container"
  >
    <div :class="styles.inputWrapper">
      <textarea
        ref="textareaRef"
        v-model="message"
        :class="styles.textarea"
        :disabled="isDisabled"
        :placeholder="
          loading
            ? 'AI가 응답 중입니다...'
            : '메시지를 입력하세요... (Enter: 전송, Shift+Enter: 줄바꿈)'
        "
        :aria-label="loading ? 'AI 응답 대기 중' : '메시지 입력'"
        :aria-disabled="isDisabled"
        data-testid="message-input"
        rows="1"
        @input="handleInput"
        @keydown="handleKeydown"
      />
      <button
        :class="styles.sendButton"
        :disabled="!canSend"
        :aria-label="loading ? '전송 중...' : '메시지 전송'"
        :aria-busy="loading"
        data-testid="send-message-button"
        @click="sendMessage"
      >
        <span
          v-if="loading"
          :class="styles.loadingSpinner"
          aria-hidden="true"
        />
        <span v-else>전송</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
