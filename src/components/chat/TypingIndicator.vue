<!-- Typing Indicator Component -->
<script setup lang="ts">
import { css } from '../../../styled-system/css'

const styles = {
  wrapper: css({
    display: 'flex',
    justifyContent: 'flex-start',
    marginBottom: '1rem',
    animation: 'fadeIn 0.3s ease-in',
  }),
  bubble: css({
    padding: '0.75rem 1rem',
    backgroundColor: 'neutral.100',
    borderRadius: '1rem',
    borderBottomLeftRadius: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  }),
  text: css({
    fontSize: '0.9rem',
    color: 'neutral.600',
  }),
  dotsContainer: css({
    display: 'flex',
    gap: '0.25rem',
    alignItems: 'center',
  }),
  dot: css({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'neutral.400',
    animation: 'bounce 1.4s ease-in-out infinite',
  }),
  dot1: css({
    animationDelay: '0s',
  }),
  dot2: css({
    animationDelay: '0.2s',
  }),
  dot3: css({
    animationDelay: '0.4s',
  }),
  // Screen reader only text
  srOnly: css({
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
  }),
}
</script>

<template>
  <div :class="styles.wrapper" data-testid="typing-indicator" aria-busy="true">
    <div :class="styles.bubble">
      <span :class="styles.text">AI가 생각하는 중</span>
      <div :class="styles.dotsContainer" aria-hidden="true">
        <div :class="[styles.dot, styles.dot1]" />
        <div :class="[styles.dot, styles.dot2]" />
        <div :class="[styles.dot, styles.dot3]" />
      </div>
    </div>
    <!-- Accessible announcement -->
    <span :class="styles.srOnly" aria-live="polite" aria-atomic="true">
      AI가 응답을 생성하고 있습니다
    </span>
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

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  40% {
    transform: translateY(-6px);
    opacity: 1;
  }
}
</style>
