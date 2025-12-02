<!-- Typing Indicator Component -->
<script setup lang="ts">
import { css } from '../../../styled-system/css'

const styles = {
  wrapper: css({
    display: 'flex',
    justifyContent: 'flex-start',
    marginBottom: '1rem',
  }),
  bubble: css({
    padding: '0.75rem 1rem',
    backgroundColor: 'neutral.100',
    borderRadius: '1rem',
    borderBottomLeftRadius: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  }),
  text: css({
    fontSize: '0.9rem',
    color: 'neutral.600',
  }),
  dotsContainer: css({
    display: 'flex',
    gap: '0.25rem',
  }),
  dot: css({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'neutral.400',
    animation: 'pulse 1.4s ease-in-out infinite',
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
}
</script>

<template>
  <div :class="styles.wrapper">
    <div :class="styles.bubble">
      <span :class="styles.text">AI가 생각하는 중</span>
      <div :class="styles.dotsContainer">
        <div :class="[styles.dot, styles.dot1]" />
        <div :class="[styles.dot, styles.dot2]" />
        <div :class="[styles.dot, styles.dot3]" />
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes pulse {
  0%,
  80%,
  100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
