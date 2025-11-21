<script setup lang="ts">
import { css } from '../../styled-system/css'

// Static style definitions
const styles = {
  container: css({
    minHeight: '100vh',
    padding: '2rem',
    backgroundColor: 'neutral.50',
  }),
  heading: css({
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
  }),
  description: css({
    color: 'neutral.600',
  }),
}
</script>

<template>
  <div :class="styles.container">
    <h1 :class="styles.heading">시나리오 목록</h1>
    <p :class="styles.description">준비 중입니다.</p>
  </div>
</template>
