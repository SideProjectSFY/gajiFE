<template>
  <div
    class="spinner"
    :class="sizeClass"
    role="status"
    aria-label="Loading"
  >
    <div class="spinner-circle" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    size?: 'small' | 'medium' | 'large'
  }>(),
  {
    size: 'medium',
  }
)

const sizeClass = computed(() => `spinner-${props.size}`)
</script>

<style scoped>
.spinner {
  display: inline-block;
}

.spinner-circle {
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-small .spinner-circle {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

.spinner-medium .spinner-circle {
  width: 40px;
  height: 40px;
  border-width: 3px;
}

.spinner-large .spinner-circle {
  width: 60px;
  height: 60px;
  border-width: 4px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
