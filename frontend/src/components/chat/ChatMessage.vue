<!-- Chat Message Bubble Component -->
<script setup lang="ts">
import { computed } from 'vue'
import { css } from '../../../styled-system/css'
import type { Message } from '@/stores/conversation'

interface Props {
  message: Message
}

const props = defineProps<Props>()

const isUser = computed(() => props.message.role === 'user')

// Format timestamp
const formattedTime = computed(() => {
  const date = new Date(props.message.timestamp)
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
})

// Static styles
const styles = {
  messageWrapper: css({
    display: 'flex',
    marginBottom: '1rem',
    animation: 'fadeIn 0.3s ease-in',
  }),
  userWrapper: css({
    justifyContent: 'flex-end',
  }),
  assistantWrapper: css({
    justifyContent: 'flex-start',
  }),
  bubble: css({
    maxWidth: '70%',
    padding: '0.75rem 1rem',
    borderRadius: '1rem',
    wordWrap: 'break-word',
    whiteSpace: 'pre-wrap',
  }),
  userBubble: css({
    backgroundColor: 'blue.500',
    color: 'white',
    borderBottomRightRadius: '0.25rem',
  }),
  assistantBubble: css({
    backgroundColor: 'neutral.100',
    color: 'neutral.900',
    borderBottomLeftRadius: '0.25rem',
  }),
  content: css({
    fontSize: '0.95rem',
    lineHeight: '1.5',
  }),
  timestamp: css({
    fontSize: '0.75rem',
    marginTop: '0.25rem',
    opacity: 0.7,
  }),
}
</script>

<template>
  <div :class="[styles.messageWrapper, isUser ? styles.userWrapper : styles.assistantWrapper]">
    <div :class="[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]">
      <div :class="styles.content">
        {{ message.content }}
      </div>
      <div :class="styles.timestamp">
        {{ formattedTime }}
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
