<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { css } from '../../styled-system/css'

const route = useRoute()

// Computed property for route param (truly reactive - depends on route.params)
const conversationId = computed(() => route.params.id)

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
    <h1 :class="styles.heading">대화 {{ conversationId }}</h1>
    <p :class="styles.description">준비 중입니다.</p>
  </div>
</template>
