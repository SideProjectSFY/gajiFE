<script setup lang="ts">
import { computed } from 'vue'
import { css } from 'styled-system/css'

const props = defineProps<{
  text: string
  min?: number
  max?: number
  label?: string
  id?: string
}>()

const length = computed(() => (props.text || '').length)

const statusClass = computed(() => {
  if (props.max) {
    // Max-based validation (for title)
    return length.value > props.max ? 'over-limit' : 'neutral'
  }

  if (props.min) {
    // Min-based validation (for scenario types)
    if (length.value === 0) return 'neutral'
    return length.value >= props.min ? 'valid' : 'invalid'
  }

  return 'neutral'
})

const styles = {
  counter: css({
    fontSize: '13px',
    fontWeight: '500',
    textAlign: 'right',
    transition: 'color 0.2s ease',
  }),
  valid: css({
    color: 'success',
  }),
  invalid: css({
    color: 'error',
  }),
  neutral: css({
    color: 'neutral.500',
  }),
  overLimit: css({
    color: 'error',
  }),
  checkIcon: css({
    marginLeft: '0.25rem',
    color: 'success',
  }),
}
</script>

<template>
  <div
    :id="id"
    :class="[
      styles.counter,
      statusClass === 'valid' && styles.valid,
      statusClass === 'invalid' && styles.invalid,
      statusClass === 'neutral' && styles.neutral,
      statusClass === 'over-limit' && styles.overLimit,
    ]"
  >
    <span v-if="max">{{ length }}/{{ max }} {{ label || 'chars' }}</span>
    <span v-else-if="min">
      {{ length }}/{{ min }} chars
      <span
        v-if="length >= min"
        :class="styles.checkIcon"
      >✓</span>
    </span>
  </div>
</template>
