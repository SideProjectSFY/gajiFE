<!-- Chat Input Area Component -->
<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { css } from '../../../styled-system/css'

interface Props {
  disabled?: boolean
}

interface Emits {
  (e: 'send', message: string): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const emit = defineEmits<Emits>()

const message = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const isEmpty = computed(() => message.value.trim().length === 0)
const canSend = computed(() => !isEmpty.value && !props.disabled)

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
    transition: 'border-color 0.2s',
    '&:focus': {
      outline: 'none',
      borderColor: 'blue.500',
    },
    '&:disabled': {
      backgroundColor: 'neutral.100',
      cursor: 'not-allowed',
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
    '&:hover:not(:disabled)': {
      backgroundColor: 'blue.600',
    },
    '&:disabled': {
      backgroundColor: 'neutral.300',
      cursor: 'not-allowed',
    },
  }),
}
</script>

<template>
  <div :class="styles.container">
    <div :class="styles.inputWrapper">
      <textarea
        ref="textareaRef"
        v-model="message"
        :class="styles.textarea"
        :disabled="disabled"
        placeholder="메시지를 입력하세요... (Enter: 전송, Shift+Enter: 줄바꿈)"
        rows="1"
        @input="handleInput"
        @keydown="handleKeydown"
      />
      <button
        :class="styles.sendButton"
        :disabled="!canSend"
        @click="sendMessage"
      >
        전송
      </button>
    </div>
  </div>
</template>
